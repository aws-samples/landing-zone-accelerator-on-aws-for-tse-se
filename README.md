# Trusted Secure Enclaves Sensitive Edition (TSE-SE)

## Overview
**The Landing Zone Accelerator on AWS (LZA)** for _Trusted Secure Enclaves Sensitive Edition (TSE-SE)_ is an industry specific deployment of the [Landing Zone Accelerator on AWS](https://aws.amazon.com/solutions/implementations/landing-zone-accelerator-on-aws/) targeting sensitive level workloads.

National security, defence, and national law enforcement organizations around the world need the scale, global footprint, agility, and services that cloud brings to their critical missions—all while they are required to meet stringent security and compliance requirements for their data. Increasingly, these organizations leverage the AWS global hyper-scale cloud to deliver their missions while keeping their sensitive data and workloads secure. To help you accelerate these sensitive missions in cloud, we developed Trusted Secure Enclaves for National Security, Defence and National Law Enforcement.

The _Trusted Secure Enclaves Sensitive Edition (TSE-SE) Reference Architecture_ is a comprehensive, multi-account AWS cloud architecture targeting sensitive level workloads. This architecture was designed in collaboration with our national security; defence; national law enforcement; and federal, provincial, and municipal government customers to accelerate compliance with their strict and unique security and compliance requirements. The _TSE-SE Reference Architecture_ was designed to help customers address central identity and access management, governance, data security, comprehensive logging, and network design/segmentation in alignment with security frameworks such as NIST 800-53, ITSG-33, FEDRAMP Moderate, CCCS-Medium, IRAP, and other sensitive or medium level security profiles.

Please refer to the TSE-SE [Reference Architecture document](./architecture-doc/readme.md) for the full detailed design.

## Deployment overview

AWS developed the sample configuration files herein for use with the Landing Zone Accelerator on AWS (LZA) solution. Using these sample config files with LZA will automate the deployment of the prescriptive and opinionated _Trusted Secure Enclaves Sensitive Edition_ reference architecture.

Deploying the TSE-SE with the LZA automation engine reduces customers foundational build effort by months over manual approaches. It allows customers to rapidly establish a baseline set of technical security controls in alignment with sensitive security frameworks. The TSE-SE is deployed by customers on the customer side of the responsibility model and builds on the [security of the AWS cloud](https://aws.amazon.com/compliance/services-in-scope/).

The sample config files define a log retention period of 2 years based on consultation with regional policy and cybersecurity authorities.  Customers are encouraged to consider defining longer retention periods, such as 10 years, so that you'll have the data you need to investigate and reconstruct events long after they occur.

Customers are encouraged to work with their local AWS Account Teams to learn more about customizing this configuration, to learn more about the TSE-SE reference architecture, the Landing Zone Accelerator on AWS solution, or global national security and defense solutions.

**NOTE: The initial release of the TSE-SE LZA sample configuration files included as part of LZA v1.3 do not yet fully automate the delivery of this architecture. This will be resolved in subsequent LZA releases.**

-  [Configuration files and installation instructions](./install.md)
-  [Instructions for version updates](./update-instructions.md)
