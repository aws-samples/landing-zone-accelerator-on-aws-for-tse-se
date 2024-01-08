# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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