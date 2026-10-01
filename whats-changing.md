# What's changing for TSE-SE

- The all-in-one TSE-SE configuration in this repository is now in **maintenance mode** — with support ending in 2027.
- Recommended going forward: you deliver TSE-SE by deploying the **LZA Universal Configuration (UC)** as your secure baseline, then applying the documented **sensitive-tier modifications** where a sensitive workload needs an additional control.


## Why this is happening

AWS field teams maintained TSE-SE until 2027. Over that time AWS built the LZA Universal Configuration from those controls, and UC now has thousands of successful deployments. UC is maintained and supported by the LZA service team, so you deploy it as your baseline and add the controls in this repository that suit your workload. That leaves you with one supported LZA baseline instead of competing templates — you choose only which additional controls to apply.

UC did not make every TSE-SE control a default. Because not every customer runs sensitive or regulated workloads, the sensitive-only controls stayed out of the common baseline as opt-in hardening. A customer running ordinary workloads should not have to run (or pay for) controls they do not need, and a sensitive-workload customer can switch them on. See the [uplift guide](./uplift-to-tse-se/README.md).

## What's new

- **Latest features, sooner.** UC is built and maintained by the LZA service team and tracks new LZA releases and AWS service capabilities.
- **Official AWS Support.** UC is a supported configuration you can raise support cases against.


## What this means for you

- **New to TSE-SE?** Start with [Delivering TSE-SE on LZA UC](./deliver-on-uc.md): deploy the baseline, then apply the sensitive-tier controls for your compliance regime.
- **Want to understand the design first?** Read the [TSE-SE reference architecture](./architecture-doc/readme.md).
- **Migration** customers can perform their own migrations now, a detailed migration guide is available from your AWS account team or [aws-tse-support@amazon.com](mailto:aws-tse-support@amazon.com) and will be released here before 2027.

## FAQ

**Will my existing TSE-SE deployment stop working?**
No. Nothing changes in your deployed environment; the configuration you are running continues to operate. The TSE-SE template stays with support ending in 2027, and as the LZA engine evolves and you upgrade it, unmigrated features may change or stop working.

**Do I have to migrate immediately?**
No. TSE-SE is supported ending in 2027, so you have a runway to plan. But it is in maintenance mode: new LZA features, service coverage, broader hardening (data-perimeter RCPs and the rest), and fixes arrive through the UC baseline, not through new TSE-SE releases. To take full advantage of those improvements (and to stay supported past 2027) migrate to the UC baseline.

**Is the Universal Config less secure than TSE-SE?**
No. UC contains the broadest TSE-SE security outcomes as its defaults and adds new protections. The difference is that some sensitive-only controls are opt-in rather than always-on, so you enable the ones your workload requires. See the [uplift guide](./uplift-to-tse-se/README.md).

**Where did controls like per-account KMS keys go?**
They are still available — they are now an opt-in sensitive-tier modification rather than a baseline default, because not all customers need them. The [uplift guide](./uplift-to-tse-se/README.md) shows how to apply per-account customer-managed keys and the other sensitive-tier controls.

**Is the TSE-SE reference architecture going away?**
No. The reference architecture and its security outcomes continue. Only the implementation path has changed — UC baseline plus documented sensitive-tier modifications.

**Can I still see the old configuration and its docs?**
Yes. The [installation](./install.md), [version update](./update-instructions.md) and [post-deployment](./post-deployment.md) guides for the all-in-one configuration remain in this repository. The original architecture document and earlier releases are in this repository's Git history and GitHub releases.
