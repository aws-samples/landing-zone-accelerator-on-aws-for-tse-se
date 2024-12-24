# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- towncrier release notes start -->

## [1.11.0-a] 2024-12-27

### Added

- feat(global-config): We have added tagging on all LZA provisioned resources that support tagging. The tag key is Accelerator and the key is set to the value provides to `AcceleratorPrefix` in the replacements-config.yaml.
- feat(config rule): Created a new AWS Config rule to detect IMDSv1 and auto-remediate to IMDSv2. IMPORTANT: Before enabling, ensure that existing running software is compatible with IMDSv2. See here https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html#instance-metadata-transition-to-version-2 
- feat(security): Added Accelerator tags to all AWS Config Rules. Modified `RUL` SCP to Deny AWS Config actions on Accelerator tagged rules only. This allow individual workload accounts administrators to create and manage their own AWS Config Rules while protecting acclerator deployed rules.

### Changed

- feat(security): removed noisy CloudWatch alarms and supporting metric filters to align with AWS Security Hub recommendations. https://docs.aws.amazon.com/securityhub/latest/userguide/controls-to-disable.html#controls-to-disable-cloudwatch-alarms
- fix(security-config): We have updated the `"{{ AcceleratorPrefix }}-ec2-instance-profile-permission"` AWS Config rule to attach additional policies required to support encrypted logging of AWS SSM Sessions Manager. This fix will now allow users with custom EC2 roles to make use of sessions manager without needing to manually add additional policies.
- fix(security-config): Updated Sensitive SCP to view CloudTrail entries in Global Region


## [1.10.0-a] 2024-10-31
### Added
- feat(network-config): We have released a new IPAM schema and two new CIDR allocation strategies. This change has been made to offer customers more flexibility to adopt different network patterns in the future, such as hub-and-spoke and hybrid models. You can read about the new changes in the [design documentation](./architecture-doc/readme.md) for the solution. The deployment instructions now contain details on how to implement this new model. Please note, it is not possible for existing deployments to update to use this new model, as it would require a complete redeployment of all VPC's. 

### Changed
- feat(security-config): We have made changes to the AWS SecurityHub standards the solution enables by default.  Based on customer feedback we are adding the "NIST Special Publication 800-53 Revision 5" standard and upgrading to "CIS AWS Foundations Benchmark v3.0.0". We have removed standalone AWS Config rules which are now provided through Security Hub. We have also removed "PCI DSS v3.2.1" as all but three controls were covered in the other standards, and these three controls continue to have coverage through the below alternative mechanisms:
  - [CloudWatch.1](https://docs.aws.amazon.com/securityhub/latest/userguide/cloudwatch-controls.html#cloudwatch-1) - This is resolved through the use of GuardDuty which also identifies the use of "root". GuardDuty publishes its findings to SecurityHub. Further details can be found [here](https://docs.aws.amazon.com/securityhub/latest/userguide/controls-to-disable.html#controls-to-disable-cloudwatch-alarms).
  - [IAM.10](https://docs.aws.amazon.com/securityhub/latest/userguide/iam-controls.html#iam-10) - This is covered through other IAM controls [IAM.7](https://docs.aws.amazon.com/securityhub/latest/userguide/iam-controls.html#iam-7), [IAM.15](https://docs.aws.amazon.com/securityhub/latest/userguide/iam-controls.html#iam-15), [IAM.16](https://docs.aws.amazon.com/securityhub/latest/userguide/iam-controls.html#iam-16)
  - [CloudTrail.3](https://docs.aws.amazon.com/securityhub/latest/userguide/cloudtrail-controls.html#cloudtrail-3) - Covered by [CloudTrail.1](https://docs.aws.amazon.com/securityhub/latest/userguide/cloudtrail-controls.html#cloudtrail-1)
This change enables customers to: 1) align to the latest version of the compliance standards provided by SecurityHub, and 2) brings in additional compliance coverage through the NIST enabled controls.
- fix(scp): Modified GLB1 SCP to unblock Amazon Quicksight registration endpoint
- doc(installation): Updated documentation to include latest steps to enable Private Marketplace.
- fix(scp): Modified SEC SCP for additional security hub APIs
- fix(inspector): support of CIS scans in default instance profile 
- fix(security-config): Added additional exclusions for regions where audit manager isn't supported
- fix(logging): Updated dynamic partitioning rules to use latest log group naming conventions
- feat(logging): Added dynamic partitioning rule for CloudWatch Logs VPC Flow Logs

## [1.9.2-b] 2024-09-10
### Added
- feat(docs): Updated architecture documentation and diagrams

### Changed
- feat(network): **This change will cause a disruption to ingress and egress traffic and therefore must be carefully planned to minimize disruption to workloads.** We have made the decision to move the network firewall north of the Perimeter-NAT subnets to enable two outcomes for customers. 1. Allow customers to deploy internet facing appliances in the Perimeter-NAT subnets directly, without the need for ALB/NLB, whilst still being protected by a boundary device. This requirement supports products that are expected to sit at the edge and have multiple inbound ports open to support their application, which is currently not support by ALB/NLB's. 2. Allow the edge boundary device to see the public address ranges of the connections being established to the perimeter account. In the previous pattern the network firewalls sat south of the ALB/NLBs causing them to see the private addresses of connections and requiring administrators to work with X-Forwarded-For headers to see the public IP addresses. With this change customers will see the public IP addresses and can directly use their own IP threat lists to control traffic into the perimeter. To implement this optional change customers will need to make the changes in two phases. Detailed instructions to make the changes can be found [here](./documentation/1-9-2b-nfw-update-instructions.md). **Note: the time of the disruption will based on performing two full pipeline runs, please factor this in when scheduling the change.**

## [1.9.2-a] 2024-08-30
### Added
- feat(replacements): All CIDR ranges for VPC's, Subnets and IPAM have been moved to the replacements file. This simplifies customisation during deployment and also makes future changes for networking easier to identify. If you previously customized your CIDR ranges, when applying this change to an existing deployment, make sure to replace the CIDR ranges in replacement-config.yaml by the current values defined in your network-config.yaml file.

### Changed
- fix(scp): Modified LAM SCP to block additional APIs
- feat(networking): Improvements to third-party reference artifacts documentation to deploy FortiGates.
- fix(docs): Updated installation documentation to use S3 as the configuration source
- feat(global-config): Enable all regions by default
- fix(iam): Updated default configuration and documentation to deploy Managed Active Directory configuration instances in a post-deployment step
- fix(scp): Updated Sandbox and Unclass SCPs to make them consistent with Sensistive
- fix(iam-config): Add S3 GetObject policy to support SSM buckets

## [1.8.1-c] 2024-07-25
### Changed
- fix(security-config): Updated alarms related to root use login activity. Removed duplicate and unused alarms and metrics.
- fix(iam-config): Removed Accelerator prefix from roles created

## [1.8.1-b] 2024-07-05
### Added
- feat(networking): Added instructions and sample configurations to use Fortinet in the Perimeter VPC instead of AWS Network Firewall. You can ignore those changes if you are not planning to adopt third-party Firewalls.

## [1.8.1-a] 2024-07-05
### Changed
- fix(network-config): Removed invalid target group attributes definition
- fix(security): Exclude GUARDDUTY_NON_ARCHIVED_FINDINGS config rule from ca-west-1 until it becomes available
- fix(scp): Modified GLB1 SCP to allow GuardDuty findings to be viewed in other regions

## [1.7.0-a] - 2024-06-03
### Added
- feat(network-config): Add deployments of Application Load Balancers in perimeter VPC. Added sample to deploy ALB in workload accounts and ALB Forwarding feature.
- feat(replacements): Added use of replacements-config.yaml file to centralize deployment variables.

### Changed
- fix(custom-config): Updated nodejs and AWS SDK version
- fix(network-config): Removed App2 subnets from the central network. These were used originally used for AWS Managed Active Directory; however, since MAD now supports running in a delegated account with IAM Identity Center, these are no longer needed. Customers should check there are no other resources deployed in these subnets prior to making change
- feat(global-config): Enabled additional regions by default with CMK region excludes for cost optimization
- fix(global-config): Add CWL subscription filter exclusion for organization CloudTrail logs
- fix(docs): Updated broken link to install instructions
- fix(docs): Updated documentation for Control Tower deployments with LZA v1.7.0

## [1.6.1-a] - 2024-03-04
### Added
- feat(replacements): Added use of replacements-config.yaml file to centralize global variables.
- fix(iam-config): Modified IAM Identity Center configuration to delegate to the Operations account. In the previous version of the configuration file, Identity Center delegated administrator was not explicitly delegated to any account. Therefore LZA used the Audit (Security) account as the delegated administrator by default. We recommend to delegate Identity Center administration to the operations account. Refer to the [Identity Center section of the FAQ](./documentation/FAQ.md#IAM-Identity-Center) for more details
- feat(security-config): Added AWS Config rule to enforce HTTPS on S3 bucket via the bucket policy
- fix(network-config): Added blackhole routes to Transit Gateway Network-Main-Segregated route table to match the documented reference architecture
- feat(global-config): Added config version, to help customers easily find their current config version. This helps customers know which changelogs should be reviewed to understand the changes made between versions

### Changed
- fix(scp): Modified ACM SCP to use accelerator prefix variable
- fix(scp): Modified GLB1 SCP to allow CloudWatch metrics for WAF in global region
- fix(security-config): Added variable and instructions to update CloudWatch log group name for CloudTrail logs. Fixes CloudWatch alarms if using Control Tower
- fix(network-config): Updated source rules to include Central-Web-B as an allowed source

## [1.6.0-a] - 2024-01-10
### Added
- feat(global-config)!: Use the [cdkOptions/customDeploymentRole](https://awslabs.github.io/landing-zone-accelerator-on-aws/classes/_aws_accelerator_config.cdkOptionsConfig.html#customDeploymentRole) for all CDK deployment tasks. **When implementing this change on existing deployments it is important to review and implement the related SCP changes to use the `${ACCELERATOR_PREFIX}` replacements in statement conditions.**
- feat(global-config): Configure quota limits increase request, so those are no longer needed to be manually requested during installation
- feat(security-config): Configure SNS topic to send Security Hub notifications
- feat(security-config): Enable CloudWatch logging for Security Hub notifications
- feat(security-config): Enables the AWS Config Aggregator if not using Control Tower
### Changed
- fix(global-config): Remove duplicate CloudTrail management events when deployed with ControlTower
- fix(scp): Modified TAG1 SCP to prevent modification of security groups owned by AWSAccelerator
- chore: Reformated yaml files to remove trailing whitespaces and use proper indentation

## [1.5.1-a] - 2023-11-01
This sample configuration is now maintained in this standalone repository.

## [1.5.0] - 2023-10-05
### Added
- feat(network-config)!: Add configuration to delete rules of default security groups. Best practice is to not use the default security groups. **Please review if your existing workloads use the default security groups before applying this change.**
### Changed
- feat(iam-config): Use dedicated `AWSAccelerator-RDGW-Role` for Managed Active Directory management instance
- feat(network-config): Deployment of default Web, App and Data security groups in all VPCs and workload accounts (ASEA parity)
- fix(network-config): Add deployment of interface endpoints for Secrets Manager, CloudFormation and Monitoring (ASEA parity)
- fix(scp): SCP updates for granular billing permissions
- fix(network-config): Add additional Route Table entries in the Network Firewall Perimeter subnets to target the NAT Gateway in the proper availability zone
- fix(security-config): Refactor AWS Config rules to avoid duplication
- fix(config rules): Fixed accelerator-ec2-instance-profile-permission Config rule
- fix(iam-config): Changed deployment target of `AWSAccelerator-Default-Boundary-Policy` to align with the deployment target of the roles referencing this policy.

## [1.4.0] - 2023-05-03
### Added
- feat(global-config): Added support for Control Tower in the configuration. **IMPORTANT**: Control Tower can only be enabled in the initial installation and not through an update.
### Changed
- feat(scp): updates to some SCP statements
- fix(network-config): Security groups defined in shared VPCs are now replicated to accounts where the subnets are shared. If you reference a prefix list from a security group, you need to update the deployment targets of the prefix list to deploy the prefix list in all shared accounts
- fix(security-config): Lambda runtimes for AWS Config rules were updated to NodeJs16

## [1.3.0] - 2022-12-21
The first version of this reference configuration was released with LZA version 1.3.0.
