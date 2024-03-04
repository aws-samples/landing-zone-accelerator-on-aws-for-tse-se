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

**If you are already operating Identity Center from the Audit account with provisionned permission sets and assignements you should carefully review the impact of this change. Making this change can remove all existing Identity Center configurations**. To continue using the Audit Account as the delegated adminstrator for Identity Center you can use the following configuration instead:
```
identityCenter:
 name: OrgIdentityCenter
 delegatedAdminAccount: Audit
```
