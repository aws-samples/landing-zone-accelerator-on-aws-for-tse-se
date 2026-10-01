# Applying TSE-SE sensitive-tier controls on the LZA UC baseline

For background, see the [documentation home](../README.md) and [What's changing](../whats-changing.md).

This page is the **configuration reference** for the sensitive-tier controls read [the control posture in the reference architecture](../architecture-doc/readme.md#6-the-control-posture-for-sensitive-workloads) for a deeper explanation of _why_ these controls might be enabled.

## Sensitive-tier controls to apply

### Per-account customer-managed KMS keys (CMKs)
- **Outcome:** per-account customer-managed KMS keys for S3, Lambda, SQS and CloudWatch Logs.
- **Edit:** `global-config.yaml` → `s3.encryption.createCMK`, `lambda.encryption.useCMK`, `sqs.encryption.useCMK`, `logging.cloudwatchLogs.encryption.useCMK`

The four blocks share the same deployment targets. Define them once (shown here on `s3`) and repeat the identical `deploymentTargets` on the other three:

```yaml
s3:
  encryption:
    createCMK: true
    deploymentTargets:
      organizationalUnits:
        - Security
        - Infrastructure
        - Workloads
        - Workloads/Dev
        - Workloads/Test
        - Workloads/Prod
        - Workloads/Sandbox
      accounts:
        - Management
lambda:
  encryption:
    useCMK: true
    deploymentTargets: # repeat the same organizationalUnits + accounts as s3
sqs:
  encryption:
    useCMK: true
    deploymentTargets: # repeat the same targets
logging:
  cloudwatchLogs:
    encryption:
      useCMK: true
      deploymentTargets: # repeat the same targets
```

- **Targets:** `Security`, `Infrastructure`, `Workloads/*` and the `Management` account. In the TSE-SE config these blocks also carry `excludedRegions: [{{OtherEnabledRegions}}]`; on UC, set `excludedRegions` to match your enabled-region strategy (the UC baseline enables a smaller region set than TSE-SE did).

### In-configuration data-residency enforcement
- **Outcome:** region lockdown enforced from the config repository. The TSE-SE `GBL1` statement denies all actions outside your home region (bar a global-service allow-list), and `GBL2` restricts `acm`/`kms`/`sns:Publish` to the home region and `us-east-1`.
- **Edit:** enable Control Tower Region Deny for your permitted regions. If you also need residency enforced in the repo, add a customer-managed SCP in `organization-config.yaml` → `serviceControlPolicies` that references a policy file containing the `GBL1`/`GBL2` statements:

```yaml
serviceControlPolicies:
  - name: "{{ AcceleratorPrefix }}-Data-Residency"
    description: Restricts activity to approved regions (TSE-SE GBL1/GBL2).
    policy: service-control-policies/data-residency.json
    type: customerManaged
    deploymentTargets:
      organizationalUnits:
        - Infrastructure
        - Security
        - Workloads
```

  Copy the `GBL1` and `GBL2` statements from the TSE-SE `service-control-policies/LZA-Guardrails-Sensitive.json` into `data-residency.json`.
- **Targets:** the OUs above. Watch the Control Tower SCP quota; attach at account level if you exceed it.

### Near-real-time threat detection and sensitive-data discovery
- **Outcome:** GuardDuty runs with S3 and EKS protection enabled and publishes findings every 15 minutes (UC defaults to a longer export interval). Macie is enabled with sensitive-data findings published, also at 15-minute frequency.
- **Edit:** `security-config.yaml` → `centralSecurityServices.guardduty` and `centralSecurityServices.macie`

```yaml
  guardduty:
    enable: true
    s3Protection:
      enable: true
    eksProtection:
      enable: true
    exportConfiguration:
      enable: true
      destinationType: S3
      exportFrequency: FIFTEEN_MINUTES
  macie:
    enable: true
    policyFindingsPublishingFrequency: FIFTEEN_MINUTES
    publishSensitiveDataFindings: true
```

- **Targets:** organization-wide (delegated security-services admin account).

### CIS monitoring alarms
- **Outcome:** CloudWatch metric-filter alarms wired to SNS for root usage, unauthorized API calls, console sign-in without MFA, IAM/CloudTrail/Config changes, NACL/gateway/route-table/VPC changes and CMK disable-or-delete, plus bespoke unapproved-source-IP and unencrypted-filesystem alarms.
- **Note:** CIS AWS Foundations Benchmark v3.0.0 removed these log-metric-filter controls, so enabling CIS v3 in Security Hub does not recreate them — add them explicitly.
- **Edit:** `security-config.yaml` → `cloudWatch.metricSets` and `cloudWatch.alarmSets`. One representative filter-and-alarm pair (repeat the pattern for each control):

```yaml
cloudWatch:
  metricSets:
    - regions:
        - "{{AcceleratorHomeRegion}}"
      deploymentTargets:
        accounts:
          - Management
      metrics:
        - filterName: "{{ AcceleratorPrefix }}-RootAccountMetricFilter"
          logGroupName: "aws-controltower/CloudTrailLogs"
          filterPattern: '{$.userIdentity.type="Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType !="AwsServiceEvent"}'
          metricNamespace: CloudTrailMetrics
          metricName: RootAccount
          metricValue: "1"
  alarmSets:
    - regions:
        - "{{ AcceleratorHomeRegion }}"
      deploymentTargets:
        accounts:
          - Management
      alarms:
        - alarmName: "{{ AcceleratorPrefix }}-CIS-1.1-RootAccountUsage"
          alarmDescription: "Root account usage."
          snsTopicName: SecurityLow
          metricName: RootAccount
          namespace: CloudTrailMetrics
          comparisonOperator: GreaterThanOrEqualToThreshold
          evaluationPeriods: 1
          period: 300
          statistic: Sum
          threshold: 1
          treatMissingData: notBreaching
```

  Copy the full `metricSets`/`alarmSets` blocks from the TSE-SE `security-config.yaml`. In TSE-SE they point at `logGroupName: "{{ CloudTrailLogGroup }}"`; on UC, repoint every `logGroupName` to the Control Tower-managed trail log group `aws-controltower/CloudTrailLogs`.
- **Targets:** the `Management` account in your home region.

### Additional SCP hardening
- **Outcome:** deny launching unencrypted EBS volumes at create (`EBS1`/`EBS2`), deny creating unencrypted EFS file systems (`EFS`) and unencrypted RDS instances and Aurora/DocumentDB/Neptune clusters (`RDS`/`AUR`), and block high-risk or unmanaged services (`PMP` for Marketplace; `OTHS` for Lightsail, GameLift, AppFlow, IQ, and account close).
- **Edit:** add the statements to a customer-managed workload SCP (for example the file behind `{{ AcceleratorPrefix }}-Core-Workloads-Guardrails-1`). The EBS encrypt-on-create statements:

```json
{
  "Sid": "EBS1",
  "Effect": "Deny",
  "Action": "ec2:RunInstances",
  "Resource": "arn:${PARTITION}:ec2:*:*:volume/*",
  "Condition": { "Bool": { "ec2:Encrypted": "false" } }
},
{
  "Sid": "EBS2",
  "Effect": "Deny",
  "Action": "ec2:CreateVolume",
  "Resource": "*",
  "Condition": { "Bool": { "ec2:Encrypted": "false" } }
}
```

  Copy the `EFS`, `RDS`, `AUR`, `PMP` and `OTHS` statements from the TSE-SE `service-control-policies/LZA-Guardrails-Sensitive.json`.
- **Targets:** your workload OUs (`Workloads/Dev|Test|Prod`, and `Workloads/Sandbox` if wanted). If you hit the Control Tower SCP quota, attach at account level as the UC baseline does for its own guardrails.

### Network and identity control-plane lockdown
- **Outcome:** deny the network and identity control-plane actions that only the automation should perform — creating or modifying VPCs, internet/NAT/transit/VPN gateways, VPC peering and endpoints, deleting network ACLs, IAM user/group/access-key self-management, and KMS key deletion — for every principal except the accelerator and management roles (`NET2`).
- **Edit:** copy the `NET2` statement from the TSE-SE `service-control-policies/LZA-Guardrails-Sensitive.json` into your customer-managed SCP. Its `Condition` uses `ArnNotLike` on `aws:PrincipalArn` to exempt `{{ AcceleratorPrefix }}*` roles and the management account access role — keep those values aligned with your deployment or you will lock out your own automation.
- **Targets:** your workload and core OUs.

### Network Firewall tamper protection
- **Outcome:** deny associating or disassociating subnets and creating, deleting, or updating the accelerator-managed Network Firewall firewalls and policies (`NFW`), so the inspection path cannot be detached or altered outside the automation.
- **Edit:** copy the `NFW` statement from the TSE-SE `service-control-policies/LZA-Guardrails-Part1.json`. It scopes `Resource` to the `firewall*`/`state*` ARNs prefixed with `{{ AcceleratorPrefix }}`.
- **Targets:** the OUs where your inspection VPC and firewalls live (Infrastructure / Network).

### Active auto-remediation
- **Outcome:** non-compliant resources are fixed automatically rather than only flagged. S3 buckets get SSE-KMS and HTTPS-only policies; EC2 instances are moved to IMDSv2.
- **Edit:** `security-config.yaml` → `awsConfig.ruleSets[].rules`. Re-add `S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED`, `S3_BUCKET_SSL_REQUESTS_ONLY` and `EC2_IMDSV2_CHECK` with their remediation. The S3 SSE rule:

```yaml
- name: "{{ AcceleratorPrefix }}-s3-bucket-server-side-encryption-enabled"
  identifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
  complianceResourceTypes:
    - AWS::S3::Bucket
  remediation:
    rolePolicyFile: custom-config-rules/bucket-sse-enabled-remediation-role.json
    automatic: true
    targetId: "{{ AcceleratorPrefix }}-Put-S3-Encryption"
    retryAttemptSeconds: 60
    maximumAutomaticAttempts: 5
    parameters:
      - name: BucketName
        value: RESOURCE_ID
        type: String
      - name: KMSMasterKey
        value: ${ACCEL_LOOKUP::KMS}
        type: StringList
```

  Copy the full rule entries from the TSE-SE `security-config.yaml`. The SSM remediation documents live in the TSE-SE `ssm-documents/` directory (`s3-encryption.yaml`, `s3-enforce-https.yaml`) and their IAM roles in `custom-config-rules/` (`bucket-sse-enabled-remediation-role.json`, `bucket-enforce-https-remediation-role.json`, `imdsv2-remediation-role.json`). The IMDSv2 rule uses the AWS-managed document `AWSConfigRemediation-EnforceEC2InstanceIMDSv2`, so it needs no custom document.
- **Targets:** your workload and core OUs (match the `ruleSets[].deploymentTargets` you use for the rest of your Config rules).

### Defence-in-depth session logging
- **Outcome:** Session Manager logs written to both CloudWatch Logs and S3 as independent sinks.
- **Edit:** `global-config.yaml` → `logging.sessionManager.sendToS3` (and lifecycle rules)

```yaml
  sessionManager:
    sendToCloudWatchLogs: true
    sendToS3: true
    lifecycleRules:
      - enabled: true
        abortIncompleteMultipartUpload: 7
        expiration: 730
        noncurrentVersionExpiration: 730
```

- **Targets:** organization-wide (set via the `sessionManager` block; keep any `excludeAccounts`/`excludeRegions` you need).

### Longer retention and finer cost and audit granularity
Edit the properties you want in `global-config.yaml` and `security-config.yaml`:

- **CloudWatch Logs retention** — `global-config.yaml` → `cloudwatchLogRetentionInDays: 731` (UC defaults to 365).
- **Hourly Cost & Usage Report with resource detail** — `global-config.yaml` → `reports.costAndUsageReport`: `timeUnit: HOURLY`, `additionalArtifacts: [ATHENA]`, `additionalSchemaElements: [RESOURCES]` (UC defaults to monthly).
- **Organization-wide asset inventory** — `global-config.yaml` → `ssmInventory.enable: true` with your OU targets.
- **SCP-tamper alerting** — `security-config.yaml` → `centralSecurityServices.scpRevertChangesConfig.snsTopicName: SecurityHigh`.
- **Account-level log capture** — `global-config.yaml` → `logging.cloudwatchLogs.subscription` with `type: ACCOUNT`, so new and existing log groups are captured without per-group configuration.
- **Stricter password lockout** — `security-config.yaml` → `iamPasswordPolicy.hardExpiry: true`, so an expired password needs an administrator to unlock rather than self-service reset.

## Deciding what to apply

Not every sensitive deployment needs every control. The right set depends on your compliance regime (NIST SP 800-53, ITSG-33 / CCCS-Medium, IRAP, NATO RESTRICTED equivalents, and others) and your organization's risk appetite. Work with your AWS account team to map the controls you apply to your framework and to plan your accreditation evidence.

