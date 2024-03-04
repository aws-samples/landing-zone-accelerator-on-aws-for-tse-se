# 4. Post Deployment Steps

## 4.1 Access AWS IAM Identity Centre and configure your identity source

1. Log into the Operations account that is the delegated adminisration account for AWS IAM Identity Center.
2. If you plan to use the AWS Directory that the reference architecture deploys follow the [IAM Identity centre guidance to configure AD](https://docs.aws.amazon.com/singlesignon/latest/userguide/connectawsad.html). If you plan to use an external IDP follow the IAM Identity centre guidance to configure an external identity provider](https://docs.aws.amazon.com/singlesignon/latest/userguide/manage-your-identity-source-idp.html).

## 4.2 Configure Multi-factor authentication for IAM Identity Centre:

We recommend the following minimum settings:

- Every time they sign in (always-on)
- Security key and built-in authenticators
- Authenticator apps
- Require them to provide a one-time password sent by email to sign in
- Users can add and manage their own MFA devices

## 4.3 Configure MFA for the breakglass users

The breakglass users are highly privileged user accounts.

Login to the management and follow the [AWS IAM documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_enable.html) to configure MFA on both breakglass accounts. We recommend that you use hardware MFA for these accounts.
