
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

The Landing Zone Accelerator on AWS solution deploys an AWS CodeCommit repository called `aws-accelerator-config`, along with six customizable YAML configuration files. The YAML files are pre-populated with a minimal configuration for the solution. The configuration files found in this repo's '[config](./config/)' should replace the files in the default AWS CodeCommit repository after adjusting environment specific configurations.

We recommend you read the LZA guidance on [using the configuration files](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/using-configuration-files.html), before continuing with the deployment of the reference architecture.

We recommend you go through every configuration file and confirm the default values correspond to your needs. Pay careful attention to any comments provided in the configuration files. To facilitate future updates of the reference configuration, we suggest you keep the same file structure and comment out parts that you don't need instead of removing them.

## 3.1 Prepare the reference architecture configuration files

1. Clone the `aws-accelerator-config` AWS CodeCommit repository. You can follow the instructions on [setting up AWS CodeCommit with git](https://docs.aws.amazon.com/codecommit/latest/userguide/setting-up-git-remote-codecommit.html) to clone the repo.
2. Clone this repository (`landing-zone-accelerator-on-aws-for-tse-se`)
3. Copy the contents from the `config` folder in the repository `landing-zone-accelerator-on-aws-for-tse-se` to your local `aws-accelerator-config` repo. You may be prompted to overwrite duplicate configs, such as accounts-config.yaml.

## 3.2 Prepare additional organizational units

You can run the [`setup-organizational-units`](./reference-artifacts/organizations-setup/setup-organizational-units.yaml) CloudFormation script to create the following organizational units required by the reference architecture.
- Central
- Dev
- Test
- Prod
- UnClass
- Sandbox

## 3.3 Mandatory customization

Using the IDE of your choice, in your local `aws-accelerator-config` repo, update the following values:
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

The shared network makes use of a contiguous CIDR. The is currently specified as `10.0.0.0/8`. This is subdivided into 

| CIDR range | Purpose | Notes |
|---|---|---|
| 10.1.0.0/16 | Central | This range is allocated to the central VPC. Note that `10.1.0.1/32` is reserved for DX connections. |
| 10.2.0.0/16 | Development | This range is allocated to the Dev VPC |
| 10.3.0.0/16 | Test | This range is allocated to the Test VPC |
| 10.4.0.0/16 | Production | This range is allocated to the production VPC |
| 10.7.0.0/22 | Endpoint | This range is allocated to the Endpoint VPC |
| 10.7.4.0/22 | Perimeter | This range is allocated to the Perimeter VPC |
| 10.7.8.0 - 10.255.255.255 |  | These are the remaining CIDRs from `10.0.0.0/8`. These are used used to checkout non-overlapping ranges for use with local Sandbox account VPC's. |

You can choose to customize these ranges in the `replacements-config.yaml`, however take careful note when updating the config to also update subnet range, NACLs, Security Groups, Firewall rules and routing appropriately in `network-config.yaml`. 

## 3.5 Copy assets to assets buckets

The sample configuration file uses self-signed certificates to attach to Application Load Balancers. Valid certificates need to be copied to the S3 assets bucket of your management account. (e.g. `aws-accelerator-assets-<account-id>-<home-region>`)

The `network-config.yaml` references certificates used by the Application Load Balancers (ALB), but the sample certificates must be generated locally. Follow these instructions to generate sample certificates for the initial deployment and demonstration purposes. Ideally you would generate real certificates using your existing certificate authority. Note that the config references the sample certs in a `certs` folder, therefore, the sample certs must be in uploaded into a `certs` folder in the S3 bucket.

```
Example1:
openssl req -newkey rsa:2048 -nodes -keyout example1-cert.key -out example1-cert.csr -subj "/C=CA/ST=Ontario/L=Ottawa/O=AnyCompany/CN=*.example.ca"
openssl x509 -signkey example1-cert.key -in example1-cert.csr -req -days 1095 -out example1-cert.crt
```

You can also update the configuration to automatically request certificates from Amazon Certificate Manager (ACM). See the [CertificateConfig](https://awslabs.github.io/landing-zone-accelerator-on-aws/latest/typedocs/v1.6.2/classes/_aws_accelerator_config.CertificateConfig.html) documentation from LZA.

## 3.6 Running the pipeline

- Commit and push all your change to the `aws-accelerator-config` AWS CodeCommit repository.
- Release a change manually to the `AWSAccelerator-Pipeline` pipeline.
- Wait for the successful completion of the `AWSAccelerator-Pipeline` pipeline.

# 4. Post deployment steps

After successful execution of the pipeline move to the [post deployment steps](post-deployment.md)
