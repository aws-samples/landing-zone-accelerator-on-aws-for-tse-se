const { ConfigServiceClient, PutEvaluationsCommand } = require("@aws-sdk/client-config-service");
const crypto = require("node:crypto");
const client = new ConfigServiceClient();

const EXPECTED_MODE = 'none';
const ANNOTATION_LIMIT = 256;
const SIGNING_SERVICE = 'bedrock';
const REQUEST_TIMEOUT_MS = 10000;
const EMPTY_PAYLOAD_HASH = crypto.createHash('sha256').update('').digest('hex');

exports.handler = async function (event, context) {
  console.log(`Custom Rule for checking Bedrock account data retention mode...`);
  console.log(JSON.stringify(event, null, 2));

  let invokingEvent;
  try {
    invokingEvent = JSON.parse(event.invokingEvent);
  } catch (error) {
    console.error('Error parsing invokingEvent:', error);
    throw new Error('Invalid invokingEventFormat');
  }

  const invocationType = invokingEvent.messageType;

  let ruleParams;
  try {
    ruleParams = JSON.parse(event.ruleParameters || '{}');
  } catch (error) {
    console.error('Error parsing ruleParameters:', error);
    throw new Error('Invalid ruleParametersFormat');
  }

  if (!ruleParams.TargetRegions) {
    throw new Error('"TargetRegions" is required');
  }

  // Periodic rule only. Bedrock account data retention is not an AWS Config
  // resource type, so there is no configuration item to evaluate and every
  // invocation arrives as a ScheduledNotification.
  if (invocationType !== 'ScheduledNotification') {
    return;
  }

  const regions = ruleParams.TargetRegions
    .split(',')
    .map(region => region.trim())
    .filter(region => region.length > 0);

  if (regions.length === 0) {
    throw new Error('TargetRegions resolved to an empty list');
  }

  const evaluation = await evaluateCompliance({
    regions,
  });

  console.debug(`Evaluation`);
  console.debug(JSON.stringify(evaluation, null, 2));

  const payload = {
    ResultToken: event.resultToken,
    Evaluations: [
      {
        ComplianceResourceId: event.accountId,
        ComplianceResourceType: 'AWS::::Account',
        ComplianceType: evaluation.complianceType,
        OrderingTimestamp: new Date(),
        Annotation: evaluation.annotation.slice(0, ANNOTATION_LIMIT),
      },
    ],
  };
  const putEvaluationsCommand = new PutEvaluationsCommand(payload);
  await client.send(putEvaluationsCommand);
};

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value, 'utf8').digest();
}

function getSigningKey(secretAccessKey, dateStamp, region) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, SIGNING_SERVICE);
  return hmac(serviceKey, 'aws4_request');
}

// Reproduces the name the SDK would have put on the error, so that an
// unreadable region is annotated with the API error rather than a bare status.
function getErrorName(response, body) {
  const errorType = response.headers.get('x-amzn-errortype');
  if (errorType) {
    return errorType.split(':')[0];
  }
  try {
    const parsed = JSON.parse(body);
    if (parsed.__type) {
      return parsed.__type.split('#').pop();
    }
  } catch (error) {
    // No parsable body, so fall through to the status based name.
  }
  return `HttpStatus${response.status}`;
}

// The Bedrock data retention operations are newer than the AWS SDK bundled with
// the Lambda runtime, so this signs the request with SigV4 and calls the
// regional endpoint directly instead of going through an SDK client. It matches
// the approach the remediation SSM document takes for the write operation.
async function getAccountDataRetention(region) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('no AWS credentials available to the function');
  }

  const host = `bedrock.${region}.amazonaws.com`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  // Host is signed but not sent explicitly, because the runtime sets it from
  // the request URL to this same value.
  const headersToSign = { host, 'x-amz-date': amzDate };
  if (sessionToken) {
    headersToSign['x-amz-security-token'] = sessionToken;
  }
  const headerNames = Object.keys(headersToSign).sort();
  const canonicalHeaders = headerNames.map(name => `${name}:${headersToSign[name]}\n`).join('');
  const signedHeaders = headerNames.join(';');

  const canonicalRequest = [
    'GET',
    '/data-retention',
    '',
    canonicalHeaders,
    signedHeaders,
    EMPTY_PAYLOAD_HASH,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${SIGNING_SERVICE}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex'),
  ].join('\n');

  const signature = crypto
    .createHmac('sha256', getSigningKey(secretAccessKey, dateStamp, region))
    .update(stringToSign, 'utf8')
    .digest('hex');

  const requestHeaders = {
    'x-amz-date': amzDate,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, `
      + `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
  if (sessionToken) {
    requestHeaders['x-amz-security-token'] = sessionToken;
  }

  const response = await fetch(`https://${host}/data-retention`, {
    method: 'GET',
    headers: requestHeaders,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body = await response.text();
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} from ${host}`);
    error.name = getErrorName(response, body);
    throw error;
  }

  return JSON.parse(body);
}

async function evaluateCompliance(props) {
  const { regions } = props;
  const offenders = [];
  const unreadable = [];

  // The retention mode is set per region, so each governed region is read on
  // its own regional endpoint rather than inferred from one call.
  for (const region of regions) {
    let mode;
    try {
      const response = await getAccountDataRetention(region);
      mode = response.mode || 'unknown';
    } catch (error) {
      console.error(`Error reading the retention mode in ${region}:`, error);
      unreadable.push(`${region}=${error.name}`);
      continue;
    }

    console.log(`${region} mode=${mode}`);

    if (mode !== EXPECTED_MODE) {
      offenders.push(`${region}=${mode}`);
    }
  }

  // A region whose mode could not be read is unknown, not compliant. Reporting
  // COMPLIANT here would assert zero retention that was never confirmed, so the
  // rule fails loudly instead and leaves the evaluation unrecorded.
  if (offenders.length === 0 && unreadable.length > 0) {
    throw new Error(`Could not read the retention mode: ${unreadable.join('; ')}`);
  }

  if (offenders.length > 0) {
    const detail = unreadable.length > 0 ? `; unread: ${unreadable.join('; ')}` : '';
    return {
      complianceType: 'NON_COMPLIANT',
      annotation: `Retention not ${EXPECTED_MODE}: ${offenders.join('; ')}${detail}`,
    };
  }

  return {
    complianceType: 'COMPLIANT',
    annotation: `Retention is ${EXPECTED_MODE} in ${regions.join(', ')}`,
  };
}
