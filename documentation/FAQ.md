# FAQ

This document covers Frequently Asked Questions specific to this reference architecture of Landing Zone Accelerator. For general questions and troubleshooting steps, please refer to the Landing Zone Accelerator on AWS [Implementation Guide](https://docs.aws.amazon.com/solutions/latest/landing-zone-accelerator-on-aws) and the [solution documentation on GitHub Pages](https://awslabs.github.io/landing-zone-accelerator-on-aws/latest/).


## IAM Identity Center

### Does LZA automatically enable Identity Center?

LZA allow you to delegate the administration of Identity Center to a specific AWS account and it allows you to manage Permission Sets and Assignments. For more details refer to [IdentityCenterConfig](https://awslabs.github.io/landing-zone-accelerator-on-aws/latest/typedocs/latest/classes/_aws_accelerator_config.IdentityCenterConfig.html) in the configuration reference. However, it doesn't automatically enable Identity Center, you must enable it manually in your management account, or as part of [Control Tower setup](https://docs.aws.amazon.com/controltower/latest/userguide/sso.html).

Note: If the `identityCenter` configuration attribute is not defined in your iam-config.yaml file or if no `delegatedAdminAccount` is specified, then Identity Center administration is delegated to the `centralSecurityServices/delegatedAdminAccount` specified in `security-config.yaml`. (i.e. Audit account)

### To which account should Identity Center administration be delegated?

This reference architecture delegates Identity Center administration to the Operations account, to further minimize access to the highly restricted management account. This enables AWS Identity Center to directly connect to a Managed Active Directory (AD) or other IdP in the Operations account.

See [section 3.2.2](../architecture-doc/readme.md#322-aws-sso) of the Reference Architecture documentation for more details.


### What are the considerations when upgrading to version 1.6.1-a and later of this reference architecture?

Version 1.6.0-a and before of this reference architecture didn't include the `identityCenter` configuration attribute. Therefore Identity Center delegated administration was set by default to the Audit account.

Starting from 1.6.1-a of this reference architecture, Identity Center administration is explicitly delegated to the Operations account to align with the prescribed architecture.

For existing deployments, before making this change in your configuration and running the pipeline, you will need to manually deregister the current delegated administrator. This can be done by running this command using your management account credentials from the command line: `aws organizations deregister-delegated-administrator --account-id <accountid-of-the-current-delegated-admin (i.e. audit)> --service-principal sso.amazonaws.com`

If you didn't previously used or enabled Identity Center, you need to enable it in your management account before running the LZA pipeline.

**If you are already operating Identity Center from the Audit account with provisionned permission sets and assignements you should carefully review the impact of this change. Making this change can remove all existing Identity Center configurations**. To continue using the Audit Account as the delegated administrator for Identity Center you can use the following configuration instead:
```
identityCenter:
 name: OrgIdentityCenter
 delegatedAdminAccount: Audit
```

## AWS Regions

### What is the Home Region?

The [homeRegion](https://awslabs.github.io/landing-zone-accelerator-on-aws/latest/typedocs/v1.6.0/classes/_aws_accelerator_config.GlobalConfig.html#homeRegion) is where the accelerator pipeline is deployed and the region in which you will most often operate in. This reference architecture deploys the networking resources in that region by default.

### What are Enabled Regions?
[enabledRegions](https://awslabs.github.io/landing-zone-accelerator-on-aws/latest/typedocs/v1.6.0/classes/_aws_accelerator_config.GlobalConfig.html#enabledRegions) is the list of regions where accelerator resources will be deployed. Home region must be part of this list.

### Why should all regions be enabled in my configuration even if I don't intend to deploy workloads outside the Home Region?

We highly recommend to add all AWS regions that are enabled by default to the list of `enabledRegions` in LZA to deploy all the guardrails and detective controls configured by this reference architecture. Service Control Policies are in place to prevent users to deploy resources outside of the home region, the deployment of detective controls in every region serves as a defense in depth measure. Multiple `excludeRegions:` statements are included in the reference configuration to avoid deploying unnecessary resources to all enabled regions and limit cost.

### What if I want to deploy workloads in another region than the home region?

The exact steps required to enable an additional region within the reference architecture may vary based on the type of workload and use of the region (e.g. used for disaster recovery only are as the main region for specific applications). The high-level steps are:

1. Update the accelerator Service Control Policies to allow the use of the additional region. More precisely the `GBL1` and `GBL2` statements that denies the use of most services outside the Home Region.
2. Remove the additional region from the `excludeRegions:` directives throughout the configuration files.
3. Deploy the appropriate networking and other supporting resources in the additional region.

### What about deploying workloads to an opt-in region?

AWS Regions added after March 20, 2019 are disabled by default and need to be enabled before resources can be created in those regions. In addition to the steps from the previous section you will need to enable the opt-in region by following the steps in [Enable or disable a Region in your organization](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-regions.html#manage-acct-regions-enable-organization)

## Application Load Balancers Forwarding

Since the `1.7.0-a` release of the configuration, Application Load Balancers are deployed in the Perimeter VPC. Sample configuration is also provided to automate the deployment of Application Load Balancers in workload accounts. AWS ALBs are published using DNS names which resolve to backing IPs which could silently change at any time due to a scaling event, maintenance, or a hardware failure. While published as a DNS name, ALBs can only target IP addresses. This presents a challenge as we need the ALBs in the perimeter account to target ALB's in the various back-end workload accounts.

ALB Forwarding solves this problem by executing a small snippet of code every 60 seconds which updates managed ALB listeners with any IP changes, ensuring any managed flows do not go offline. This removes the requirement to leverage a 3rd party appliance to perform NAT to a DNS name.

See the [post-deployment](../post-deployment.md) instructions for more details on how to configure the ALB forwarding rules

### Why was a target group not created for an ALB Forwarding entry?

When an entry is added to the ALB Forwarding table, a lookup is performed to validate and configure the target group. Additional information is then inserted to the DynamoDB table, specifically to the newly added entry with the key `metadata`. If this `metadata` key is not added and populated and/or a target group is not added, this could indicate an error in the parameters provided for the entry.

To troubleshoot ALB Forwarding target group creation, consult the CloudWatch logs for the ALB Forwarding Lambda functions. The CloudWatch Log Groups are named `<AcceleratorPrefix>-AlbIPForwa-*`. If necessary, remove the affected entry from the DynamoDB table and re-add, ensuring that any information provided is correct.

### Why can I not reach resources behind my workload ALB through the external ALB?

The reachability of resources in workload accounts relies on several factors:

1. The ALB targets in the workload account are healthy.

Since the external ALB in the Perimeter account relies on health checks against the internal ALB in workload accounts, verify that the targets attached to the workload internal ALB are healthy.

2. Routing from the Perimeter ALBs to the workload ALBs, and return traffic, through the Transit Gateway.

Verify that the Transit Gateway is configured in the Landing Zone Accelerator to route traffic between the Perimeter and workload VPCs, and that the corresponding Transit Gateway attachments are present in the Network account.

3. Network security configuration permitting the required traffic to the workload ALBs and resources.

Verify that any Network ACLs (NACLS) and security groups are configured to permit the required traffic from the ALB Forwarding resources in the Perimeter account.

## How to use Amazon Inspector CIS scans with LZA
Amazon Inspector is an automated vulnerability management service that continually scans Amazon Elastic Compute Cloud (EC2), AWS Lambda functions, and container images in Amazon ECR and within continuous integration and continuous delivery (CI/CD) tools, in near-real time for software vulnerabilities and unintended network exposure.

As of LZA v1.9.2, the ability to enable Inspector using LZA configuration is not yet supported, so it must be configured manually. Prior to manually enabling using the instructions [here](https://docs.aws.amazon.com/inspector/latest/user/managing-multiple-accounts.html), note the following:
- These VPC Endpoints are needed: (ec2messages, inspector2, s3, ssm, ssmmessages). Ensure these are listed in the network-config.yaml
- If all egress traffic is denied, and you are using a strict VPC Endpoint Policy, ensure these 2 buckets are accessible: (inspector2-oval-prod-ca-central-1, cis-datasets-prod-yul-5e0c95e). Note the region identifiers may need to change.
- If ssmInventoryConfig is enabled, there may be a conflict with the deployment of the AWS-GatherSoftwareInventory SSM association (deployed by both the LZA setting, and Inspector). This currently happens when `"Automatically activate Inspector for new member accounts"` is configured. Disable this setting, and manually activate after new accounts are created.