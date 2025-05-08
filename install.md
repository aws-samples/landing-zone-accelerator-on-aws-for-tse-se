# Trusted Secure Enclaves Sensitive Edition (TSE-SE)

There are five parts to this guide:

1. Prerequisites - This includes gathering information, external dependencies for the initial deployment and the initial AWS Organizations management account setup.
2. LZA Deployment
3. TSE-SE reference architecture deployment and customization
4. Post deployment steps

# 1. Prerequisites

This reference architecture uses Landing Zone Accelerator on AWS (LZA) as its deployment engine. We therefore assume foundational knowledge of [Landing Zone Accelerator on AWS (LZA)](https://aws.amazon.com/solutions/implementations/landing-zone-accelerator-on-aws/). If you are not familiar with LZA we recommend you work through the [LZA immersion day](https://catalog.workshops.aws/landing-zone-accelerator/en-US) prior to deploying the reference architecture.

To support the LZA and reference architecture deployments, you will need to identify the following parameters and resources.

## 1.1 Identify your home AWS Region

The home AWS Region will be the Region in which you will most often operate in.

## 1.2 Email addresses
You will need to provision the following 7 unique email addresses for the accounts that the reference architecture will create.

| Account | Purpose | Example email |
|---|---|---|
| Management Account | This account is designated when first creating an AWS Organizations organization. It is a privileged account where all AWS Organizations global configuration management and billing consolidation occurs. The account will be used to create the other two mandatory accounts required by LZA. |  lz-dev+management@example.com |
| Security Account | This account is used to centralize all security operations and management activities. This account is typically used as a delegated administrator of centralized security services such as Amazon Macie, Amazon GuardDuty, and AWS Security Hub. NOTE: The LZA configuration files refer to this as the Audit account, but it serves the function of the Security Tooling account. | lz-dev+security@example.com |
| Log Archive Account | This account is used for centralized logging of AWS service logs. | lz-dev+log-archive@example.com |
| Network Account | This account is used for centralized networking that allows network administrators to govern shared networks and internally shared network services for the organization. For example, access to on-premises services via a VPN. | lz-dev+network@example.com |
| Operations Account | This account is used for centralized IT Operational resources (Active Directory, traditional syslog tooling, ITSM, etc.). | lz-dev+operations@example.com |
| Perimeter Account | This account is used to centralize access to external networks, e.g. third-party SaaS or internet connectivity. | lz-dev+perimeter@example.com |
| Sandbox/Workload Accounts | These accounts are where the workloads are deployed. As a minimum we recommend creating a development workload account to test the reference architecture deployment.  | lz-dev+workload-dev-1@example.com | lz-dev+workload-dev-1@example.com |

Additionally, you will need to allocate the following 5 email addresses used for operational notification purposes.

| Name | Purpose | Example email |
|---|---|---|
| High security events | Events marked as CRITICAL or HIGH will be sent to this email address. |  lz-dev+security-alerts-high@example.com |
| Medium security events | Events marked as MEDIUM will be sent to this email address. |  lz-dev+security-alerts-medium@example.com |
| Low security events | Events marked as LOW will be sent to this email address. |  lz-dev+security-alerts-low@example.com |
| AWS budgets alerts | Any alerts related to the spending limits applied to the accounts will be sent to this email address. |  lz-dev+budget-alerts@example.com |
| LZ operators | Any events related to the operation of the landing zone will be sent to this email, for example change approval for landing zone updates. |  lz-dev+operators@example.com |

## 1.3 Active directory domain details

| Name | Purpose | Example |
|---|---|---|
| Active Directory Domain | Root domain suffix for the managed active directory controller | example.com |
| adconnector-user email | [Domain user to be created to allow AD Connector setup](https://docs.aws.amazon.com/directoryservice/latest/admin-guide/directory_ad_connector.html) for centralized IAM authentication | example-adconnector-user@example.com |
| AD Admin User | AWS Managed Active Directory User for Admin tasks | example-user1@example.com |
| AD ReadOnly User | AWS Managed Active Directory User for read only tasks | example-user2@example.com |

## 1.4 GitHub account
If you are using the GitHub source for the LZA code, you will need a GitHub account to generate a GitHub API key in a later step.

## 1.5 Reference architecture management account setup
You will need to create a new AWS Account for the reference architecture deployment. You can follow the [AWS guidance on setting up a new AWS account](https://aws.amazon.com/free/).

### 1.5.1 Run EC2 instance in the management account
To run the installation in new accounts you need to pre-warm the account so that AWS automatically sets the correct quotas. To do this, launch small EC2 instance t3.medium for 15 minutes. Then terminate the instance and delete its security group.

### 1.5.2 Set security, operations, and billing contact information

Follow the guidance on [configuring account level contacts](https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-startup-security-baseline/acct-01.html) to set the security and billing information. You can either use the email addresses you allocated above for "High security events", "LZ operators" and "AWS budgets alerts" or define additional contacts.

### 1.5.3 Verify email of the root user
After creating the account e-mail is sent to the root user with the request to verify the e-mail address. Confirm by clicking the link in the email.

### 1.5.4 Enable MFA on the root user

We recommend that you use a hardware multi-factor authentication (MFA) device. Follow the guidance on [restricting the use of the root user](https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-startup-security-baseline/acct-02.html) to configure MFA on the root user.

### 1.5.5 Create a local IAM deployment user account

- [Configure console access for each user](https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-startup-security-baseline/acct-03.html) - you only need to follow the steps to create a local IAM user
- [Require MFA to login](https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-startup-security-baseline/acct-05.html) - **note:** You only need to configure the IAM user you created when restricting root user access, with MFA (In the post deployment steps you will configure your IdP where you can govern MFA access)

### 1.5.6 [optional] Increase the quota for AWS accounts

If your deployment will have more than 10 AWS, access the [service quota console for AWS Organizations](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/organizations/quotas), to request an increase to the default maximum number of accounts.

### 1.5.7 Verify the quota for Lambda functions

In the Service quota console look for Service = Lambda and verify that quota on Concurrent executions = 1000. If it is smaller or 'not available' make sure you executed steps from point 1.5.1. If it did not help use the button 'Request increase at account-level' to request 1000. If it is not increased after 24 hours please contact [Support Center](https://console.aws.amazon.com/support/home).

### 1.5.8 Update AWS CodeBuild concurrency quota

Follow the prerequisite step to [update AWS CodeBuild concurrency quota](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/prerequisites#update-codebuild-conncurrency-quota).

### 1.5.9 Ensure your home AWS Region is accessible

Follow the prerequisite step to [ensure your global region is accessible](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/prerequisites#ensure-your-global-region-is-accessible).

### 1.5.10 Enable AWS Cost Explorer

Following the guidance on [enabling AWS Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-enable.html).

### 1.5.11 Configure your GitHub token secret

If you are using the GitHub source for the LZA code, you will need to follow the prerequisite step to [store a github token in secrets manager](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/prerequisites.html#create-a-github-personal-access-token-and-store-in-secrets-manager)

## 1.6 Configure Private Marketplace
A [private marketplace](https://aws.amazon.com/marketplace/features/privatemarketplace) controls which products users in your AWS account, such as business users and engineering teams, can procure from AWS Marketplace. It is built on top of AWS Marketplace, and enables your administrators to create and customize curated digital catalogs of approved independent software vendors (ISVs) and products that conform to their in-house policies. Users in your AWS account can find, buy, and deploy approved products from your private marketplace, and ensure that all available products comply with your organization’s policies and standards.

With AWS Organizations, you can centralize management of all of your accounts, group your accounts into organizational units (OUs), and attach different access policies to each OU. You can create multiple private marketplace experiences that are associated with your entire organization, one or more OUs, or one or more accounts in your organization, each with its own set of approved products. Your AWS administrators can also apply company branding to each private marketplace experience with your company or team’s logo, messaging, and color scheme.

The following are the minimum required steps to enable private marketplace.

> [!IMPORTANT]
> [Enable AWS Organizations in your home Region](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_create.html)

1. In the Organization Management account go here: https://aws.amazon.com/marketplace/privatemarketplace/create
2. Select both checkboxes in the `Enable trusted access for AWS Organizations` section
3. Click `Enable a Private Marketplace`, and wait for activation to complete
4. Go to "Experiences" navigation menu, select `Create experience`
5. Provide an Experience title (i.e. append `-PMP`), and click `Create Experience`. (This takes several minutes to complete)
6.  Once successfully completed, click on the new experience
7.  Click the `Settings` tab, 
    1.  Change the color, so it is clear PMP is enabled for users
    2.  Ensure the "Product requests" option is set to `Product requests off` 
    3.  Click the `Live`option 
    4.  Click `Save` at the bottom to apply the changes. (This takes several minutes to complete)
8.  Once succesfully completed, click on the `Associated audience` tab
9.  Click the `Add additional audience` button
10. Select the root `Organization` OU, and click `Next`
11. Review settings, and click `Associate with experience`. (This takes several minutes to complete)
12. Go to the "Products" tab, then select the `All AWS Marketplace products` nested sub-tab
13. Search Private Marketplace for any desired products and select
14. Select "Add" in the top right
    1.  Due to PMP provisioning delays, this sometimes fails when attempted immediately following enablement of PMP or if adding each product individually - retry after 20 minutes.
15. While not used in the Organization account, you may need to subscribe to any subscriptions and accept the EULA for each selected product (you will also need to do the same in the account deploying a product)

# 2. Deploy LZA

We recommend you first read the [LZA guidance on troubleshooting and known issues](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws/troubleshooting.html) prior to running the installation.

Before deploying the Landing Zone Accelerator on AWS, you need to choose a method to centralize the management of resources provisioned by this solution. You can use either AWS Control Tower or AWS Organizations for the management capabilities.

Use the following steps to deploy the LZA solution.
- [Install LZA using AWS Organizations](install-organizations.md)
- [Install LZA using AWS Control Tower](install-controltower.md)
