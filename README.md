# Trusted Secure Enclaves — Sensitive Edition (TSE-SE)

> ### Important: how TSE-SE is delivered is changing
> - The all-in-one TSE-SE configuration in this repository is now in **maintenance mode** — with support ending in 2027
> - The recommended way to deliver TSE-SE is now to deploy the **[LZA Universal Configuration](https://github.com/aws/lza-universal-configuration)** (UC) as your secure baseline, then apply the sensitive-tier controls documented in the **[uplift guide](./uplift-to-tse-se/README.md)**
> - UC is built and maintained by the **LZA service team** and is covered by **AWS Support**, so you get current LZA features and keep the security outcomes TSE-SE promised
>
> New here? Start with **[What's changing and why](./whats-changing.md)**.

- **New to TSE-SE** > [Delivering TSE-SE on the LZA UC baseline](./deliver-on-uc.md)
- **Just exploring the architecture** > [TSE-SE Reference Architecture](./architecture-doc/readme.md)

## What is TSE-SE

The _Trusted Secure Enclaves — Sensitive Edition_ is a multi-account AWS reference architecture for **sensitive-level workloads**. It was designed with national security, defence, law enforcement, and federal, provincial and municipal government customers to accelerate compliance with strict security requirements, and aligns with frameworks such as NIST SP 800-53, ITSG-33, FedRAMP Moderate, CCCS-Medium, IRAP and other sensitive/medium-level profiles.

TSE-SE is both a reference architecture (the design and the reasoning behind it) and a set of security outcomes (what the architecture achieves).

## Recommended way to deliver TSE-SE

To implement the TSE-SE reference architecture:

1. **Deploy the Landing Zone Accelerator Universal Configuration baseline** 
2. **Apply the sensitive-tier controls** which UC leaves optional (for example, per-account KMS keys) to reach the security outcomes your sensitive workloads need.

See the **[Uplift guide](./uplift-to-tse-se/README.md)** for the sensitive-tier controls to apply.

## Documentation map

| Document | For | What it covers |
|---|---|---|
| [What's changing](./whats-changing.md) | Everyone | The UC baseline, the support model, and an FAQ |
| [Reference Architecture](./architecture-doc/readme.md) | Everyone | The TSE-SE design and the risk reasoning behind it |
| [Uplift guide](./uplift-to-tse-se/README.md) | Implementers | Configuration guide: the file, property, and targets for each sensitive-tier control |
| [Delivering TSE-SE on LZA UC](./deliver-on-uc.md) | New customers | How to uplift the UC baseline for sensitive workloads |
| [Installation and update guides](./install.md) | All-in-one customers | Installing, updating, and post-deployment steps for the original all-in-one configuration |
| [FAQ](./documentation/FAQ.md) | Everyone | Frequently asked questions about the TSE-SE configuration |

## Support and lifecycle

- **The TSE-SE configuration in this repository is in maintenance mode.** It is supported ending in 2027. To keep gaining new LZA features and the broader security outcomes UC adds (data-perimeter RCPs and others) adopt the UC baseline.
- **The LZA Universal Configuration is actively maintained** by the LZA service team and receives new LZA features and fixes.
- **AWS Support** covers the LZA solution and the Universal Configuration. For architecture and control guidance specific to sensitive workloads, work with your AWS account team.