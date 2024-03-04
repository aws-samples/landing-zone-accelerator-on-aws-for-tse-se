
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

# 3. Deploy the reference architecture

The Landing Zone Accelerator on AWS solution deploys an AWS CodeCommit repository called `aws-accelerator-config`, along with six customizable YAML configuration files. The YAML files are pre-populated with a minimal configuration for the solution. The configuration files found in this directory should replace the files in the default AWS CodeCommit repository after adjusting environment specific configurations.

We recommend you read the LZA guidance on [using the configuration files](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/using-configuration-files.html), before continuing with the deployment of the reference architecture.

We recommend you go through every configuration file and confirm the default values correspond to your needs. Pay careful attention to any comments provided in the configuration files. To facilitate futur updates of the reference configuration, we suggest you keep the same file structure and comment out parts that you don't need instead of removing them.

## 3.1 Prepare the reference architecture configuration files

1. Clone the `aws-accelerator-config` AWS CodeCommit repository. You can follow the instructions on [setting up AWS CodeCommit with git](https://docs.aws.amazon.com/codecommit/latest/userguide/setting-up-git-remote-codecommit.html) to clone the repo.
1. Clone this repository (`landing-zone-accelerator-on-aws-for-tse-se`)
1. Copy the contents from the `config` folder in the repository `landing-zone-accelerator-on-aws-for-tse-se` to your local `aws-accelerator-config` repo. You may be prompted to overwrite duplicate configs, such as accounts-config.yaml.

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
- replacements-config.yaml - This file contains global variables that can be referenced from all other configuration files. Review the value of each variable to confirm it is appropriate to your deployment.
- accounts-config.yaml - Replace all the AWS Account email addresses with valid emails for the deployment. These are used to create AWS Accounts.
- global-config.yaml - Replace all emails used for AWS Budgets and security notifications to match the email you allocated in the prerequisites.
- iam-config.yaml - Replace the groupName and Active Directory user account details with those specified in the prerequisites.  **Note: ** the passwords for these accounts will be available via [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/).
- This sample configuration is built using the **ca-central-1** AWS Region as the home or installation Region. If installing to a different home Region, then the five references to **ca-central-1** must be updated to reference your desired home Region in the following four configuration files (global-config, iam-config, network-config, security-config).

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

## 3.5 Running the pipeline

- Commit and push all your change to the `aws-accelerator-config` AWS CodeCommit repository.
- Release a change manually to the `AWSAccelerator-Pipeline` pipeline.
- Wait for the successful completion of the `AWSAccelerator-Pipeline` pipeline.

# 4. Post deployment steps

After successful execution of the pipeline move to the [post deployment steps](post-deployment.md)
