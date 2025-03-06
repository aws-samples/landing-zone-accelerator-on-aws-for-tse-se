
# 2. Deploy Landing Zone Accelerator using AWS Organizations

## 2.1 Create mandatory accounts

Run the [reference architecture account provisioning AWS CloudFormation script](./reference-artifacts/organizations-setup/setup-prerequisites.yaml) to configure the required AWS Organizations organizational units (OUs) and Accounts. This will perform the following steps:

1. [Enable AWS Organizations in your home Region](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_create.html)
2. Create the following organizational units
   - Security
   - Infrastructure
3. Create the following Accounts and place them in the correct organizational units. The email addresses would have been allocated in the prerequisite setup.

| Account | Account Name | Organizational unit |
|---|---|---|
| Security Account | Audit | Security |
| Log Archive Account | LogArchive | Security |

## 2.2 Enable centralized root access management

Follow the instructions on [Enabling centralized root access](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-enable-root-access.html#enable-root-access-console) by going to the [IAM Management Console](https://console.aws.amazon.com/iam/), choose **Root access management** in the navigation pane, and then select **Enable**.

### 2.2.1 Remove root credentials from member accounts

1. Open the [IAM Management Console](https://console.aws.amazon.com/iam/) and choose **Root access management**
2. Expand the list of existing accounts in your organization.
3. For every account that indicates that Root user credentials are **Present**
  a) Select the account from the list and choose **Take privileged action.**
  b) Select **Delete root credentials**
  c) Confirm the action

For more information reference the [Taking a privileged action on a member account](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user-privileged-task.html) section of the IAM User Guide.

## 2.2 Deploy the installer CloudFormation stack
Click the **Launch Solution** button on [Step 1. Launch the stack](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/step-1.-launch-the-stack.html) page. **Ensure the Region is set to your desired home Region, as it typically defaults to US East (N. Virginia)**

Name the stack `AWSAccelerator-InstallerStack` and review the template’s parameters and enter or adjust the default values as needed. For example:

| Parameter | Value |
|---|---|
| **Manual Approval Stage notification email list** | You can use the "LZ operators" email defined in the prerequisites or customize it. |
| **Management Account Email** | Use the "Management Account" email defined in the prerequisites. |
| **Log Archive Account Email** | Use the "Log Archive Account" email defined in the prerequisites. |
| **Audit Account Email** | Use the "Security Account" email defined in the prerequisites. |
| **Control Tower Environment** | Set this to "No" |
| **Configuration Repository Location** | For new deployments this need to be set to S3 |

Leave all other values as default, unless you have specific reasons to customize.

## 2.3 Wait for pipeline to complete
[Step 2. Await initial environment deployment](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/step-2.-await-initial-environment-deployment.html)

- Wait for the successful completion of the `AWSAccelerator-Pipeline` pipeline.

## 2.4 Enable IAM Identity Center in the management account

1. Login into the management account
2. Make sure the region in the console is set to your home AWS Region
3. Follow the guidance on [enabling AWS IAM Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/get-set-up-for-idc.html)

> **Note:**
> Don't configure delegated administration, this will be done by the LZA pipeline in the next steps.

# 3. Deploy the reference architecture

The Landing Zone Accelerator on AWS solution deploys a S3 bucket named `aws-accelerator-config-<account>-<region>`, along with six customizable YAML configuration files. The YAML files are pre-populated with a minimal configuration for the solution. The configuration files found in this repo's '[config](./config/)' should replace the files in the default configuration S3 bucket after adjusting environment specific configurations.

We recommend you read the LZA guidance on [using the configuration files](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/using-configuration-files.html), before continuing with the deployment of the reference architecture.

We recommend you go through every configuration file and confirm the default values correspond to your needs. Pay careful attention to any comments provided in the configuration files. To facilitate future updates of the reference configuration, we suggest you keep the same file structure and comment out parts that you don't need instead of removing them.

## 3.1 Prepare the reference architecture configuration files

1. Create a local directory named `aws-accelerator-config`
  a) `mkdir aws-accelerator-config`
2. Download the starting configurations from the configuration S3 bucket (`aws-accelerator-config-<account>-<region>`). The object key in the bucket is `zipped/aws-accelerator-config.zip`   
    - To download the file using AWS CLI to your current local directory: `aws s3 cp s3://aws-accelerator-config-<account>-<region>/zipped/aws-accelerator-config.zip .`
3. Unzip the configuration copied from S3  
    - Bash: `unzip aws-accelerator-config.zip -d aws-accelerator-config/`  
    - Powershell: `Expand-Archive -Path aws-accelerator-config.zip -DestinationPath aws-accelerator-config\`  
4. Clone this repository (`landing-zone-accelerator-on-aws-for-tse-se`)
5. Copy the contents from the `config` folder in the repository `landing-zone-accelerator-on-aws-for-tse-se` to your local `aws-accelerator-config` folder. You may be prompted to overwrite duplicate configs, such as accounts-config.yaml.

## 3.2 Prepare additional organizational units

You can run the [`setup-organizational-units`](./reference-artifacts/organizations-setup/setup-organizational-units.yaml) CloudFormation script to create the following organizational units required by the reference architecture.
- Central
- Dev
- Test
- Prod
- UnClass
- Sandbox

## 3.3 Mandatory customization

Using the IDE of your choice, in your local `aws-accelerator-config` folder, update the following values:
- replacements-config.yaml - This file contains global variables that can be referenced from all other configuration files. Review the value of each variable to confirm it is appropriate to your deployment. **Note: ** the passwords for the active directory accounts will be available via [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/).
- accounts-config.yaml - Update the config email addresses to match the email addresses you assigned in the prerequisites section.

### 3.3.1 Changing the home Region

If you are changing the home region from *ca-central-1* to  different region, you need to make the following configuration file modifications.

- global-config.yaml - **homeRegion: &HOME_REGION ca-central-1** must be updated from *ca-central-1* to the region you are using as your home region, e.g. *homeRegion: &HOME_REGION eu-west-2*
- global-config.yaml - all references to your home region in any **excludeRegions** blocks must be deleted and *ca-central-1* must be added.
- security-config.yaml - all references to your home region in any **excludeRegions** blocks must be deleted and *ca-central-1* must be added.
- customizations-config.yaml - Update references to *ca-central-1* to the region you are using as your home region

### 3.3.2 Changing the accelerator prefix

If you changed the [accelerator prefix](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/step-1.-launch-the-stack.html) from **AWSAccelerator** during the LZA deployment, you need to make the following configuration file modifications.

- global-config.yaml - update the **cdkOptions/customDeploymentRole** to *<custom prefix>-PipelineRole* e.g. *ExamplePrefix-PipelineRole*.
- iam-config.yaml - update the **managedActiveDirectories/logs/groupName** to *<custom prefix>-/MAD/{{MadDnsName}}* e.g. */ExamplePrefix/MAD/{{MadDnsName}}*.
- **dynamic-partitioning/log-filters.json** - update the acceleratorPrefix to *<custom prefix>*. For example if your prefix is *TSEProd*, the config file should look like the following:
```
[
  { "logGroupPattern": "/TSEProd/MAD", "s3Prefix": "managed-ad" },
  { "logGroupPattern": "/TSEProd/rql", "s3Prefix": "rql" },
  { "logGroupPattern": "/TSEProd-SecurityHub", "s3Prefix": "security-hub" },
  { "logGroupPattern": "TSEProdFirewallFlowLogGroup", "s3Prefix": "nfw" },
  { "logGroupPattern": "/TSEProd/rsyslog", "s3Prefix": "rsyslog" },
  { "logGroupPattern": "TSEProd-sessionmanager-logs", "s3Prefix": "ssm" }
]
```

If you are deploying a demo environment for experimentation purposes, and don't need to perform any specific customization such as defining specific CIDR ranges that don't overlap with on-premises networks, you may wish to skip to the section on running the pipeline.

## 3.4 Network customization

It is common for customers to want to assert control over their networking, based on existing on-premises requirements, such as CIDR ranges and the specific workload requirements, e.g. a VPN to integrate with on-premises services.

By default reference architecture deploys a fully working shared network, isolated between development, test and production environments. The following section describes how to modify the CIDR ranges for the shared networking if necessary.

### 3.4.1 Customizing the shared network

We recommend that customers start with the new IPAM schema. You can read more about the IPAM design in the [architecture design documentation](../doc-tse/architecture-doc/readme.md). To adopt this new pattern rename the [network-config.yaml.ipam](../config/network-config.yaml.ipam) to `network-config.yaml` and the [replacements-config.yaml.ipam](../config/replacements-config.yaml.ipam) to `replacements-config.yaml`.

The IPAM makes use of a contiguous CIDR for the entire solution. This is currently specified as `10.0.0.0/8` and is subdivided into pools, as per the schema defined in the architecture design document.

You can choose to customize these ranges in the `replacements-config.yaml`.

If you intend to connect your on-premises environment to the TGW in the future, you need to make sure the ASN is unique. The default ASN is `65521`. If you need to update this edit the `transitGateways/asn` value in the `network-config.yaml`.

## 3.5 Copy assets to assets buckets

The sample configuration file uses self-signed certificates to attach to Application Load Balancers. Valid certificates need to be copied to the S3 assets bucket of your management account. (e.g. `aws-accelerator-assets-<account-id>-<home-region>`)

The `network-config.yaml` references certificates used by the Application Load Balancers (ALB), but the sample certificates must be generated locally. Follow these instructions to generate sample certificates for the initial deployment and demonstration purposes. Ideally you would generate real certificates using your existing certificate authority. Note that the config references the sample certs in a `certs` folder, therefore, the sample certs must be in uploaded into a `certs` folder in the S3 bucket.

```
Example1:
openssl req -newkey rsa:2048 -nodes -keyout example1-cert.key -out example1-cert.csr -subj "/C=CA/ST=Ontario/L=Ottawa/O=AnyCompany/CN=*.example.ca"
openssl x509 -signkey example1-cert.key -in example1-cert.csr -req -days 1095 -out example1-cert.crt
```

Example command to copy to S3
```
aws s3 cp example1-cert.crt  s3://aws-accelerator-assets-<account-id>-<home-region>/certs/example1-cert.crt
aws s3 cp example1-cert.key  s3://aws-accelerator-assets-<account-id>-<home-region>/certs/example1-cert.key
```

You can also update the configuration to automatically request certificates from Amazon Certificate Manager (ACM). See the [CertificateConfig](https://awslabs.github.io/landing-zone-accelerator-on-aws/latest/typedocs/v1.6.2/classes/_aws_accelerator_config.CertificateConfig.html) documentation from LZA.

## 3.6 (Optional) Validate the configuration file

We recommend that you familiarize yourself with the LZA developer tools to locally validate your configuration files

To validate the configuration files you will need to download and build the [Landing Zone Accelerator code](https://github.com/awslabs/landing-zone-accelerator-on-aws).

Instructions to run the configuration validation can be found in the [LZA Developer guide](https://awslabs.github.io/landing-zone-accelerator-on-aws/latest/developer-guide/scripts/#configuration-validator)

## 3.7 Running the pipeline

1. Zip your local configuration files and copy them to the configuration S3 bucket. Make sure the zip archive contains all files directly at the root of the archive, without the `aws-accelerator-config` top folder.

    Bash (Linux/MacOS)
    ```bash
    cd aws-accelerator-config/
    rm ../aws-accelerator-config.zip
    zip -r ../aws-accelerator-config.zip . *
    aws s3 cp ../aws-accelerator-config.zip s3://aws-accelerator-config-<account>-<region>/zipped/aws-accelerator-config.zip
    ```

    Powershell (Windows)
    ```powershell
    cd aws-accelerator-config\
    rm ..\aws-accelerator-config.zip
    Compress-Archive -Path .\ -DestinationPath ..\aws-accelerator-config.zip
    aws s3 cp ../aws-accelerator-config.zip s3://aws-accelerator-config-<account>-<region>/zipped/aws-accelerator-config.zip
    ```

2. Release a change manually to the `AWSAccelerator-Pipeline` pipeline.
3. Wait for the successful completion of the `AWSAccelerator-Pipeline` pipeline.

# 4. Post deployment steps

After successful execution of the pipeline move to the [post deployment steps](post-deployment.md)
