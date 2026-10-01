# Delivering TSE-SE on the LZA Universal Config baseline

TSE-SE is a **reference architecture and a set of security outcomes** for sensitive and regulated workloads. You deliver it by deploying the [LZA Universal Configuration](https://github.com/aws/lza-universal-configuration) (UC) as your secure baseline, then applying the documented **sensitive-tier modifications** that uplift a general-purpose landing zone for sensitive workloads.

Background: [What's changing](./whats-changing.md).

## The steps

| Step | What you do | Where to go |
|---|---|---|
| 1 | Understand the architecture and outcomes | [Reference architecture](./architecture-doc/readme.md) |
| 2 | Deploy the UC baseline | [UC Getting Started guide](https://github.com/aws/lza-universal-configuration/blob/main/docs/02-Getting-Started/index.adoc) |
| 3 | Apply the sensitive-tier controls | [Uplift guide](./uplift-to-tse-se/README.md#sensitive-tier-controls-to-apply) |
| 4 | Validate against your compliance framework | Your AWS account team |

## Step 1 — Understand the architecture and outcomes

Start with the [reference architecture](./architecture-doc/readme.md) — the account structure, security design, logging model, the security outcomes, and the *why* behind each decision.

## Step 2 — Deploy the UC baseline

Deploy the baseline by following the UC project's own documentation, starting with its **[Getting Started guide](https://github.com/aws/lza-universal-configuration/blob/main/docs/02-Getting-Started/index.adoc)** (prerequisites, config modules, and step-by-step deployment).

> Important: UC provides two network model options (hub-and-spoke and shared VPC). Both route north-south traffic through UC's centralised Ingress/Egress/Inspection path, where Network Firewall gives you centralised inspection. Some sensitive threat models need more: TLS inspection, a specific accredited appliance, or a controlled publishing path. TSE-SE provides the reference design for each — and because these attach to that centralised perimeter path, they apply under either network model. See [perimeter design](./architecture-doc/readme.md#74-perimeter-design-from-centralised-inspection-to-deep-inspection) before you settle the network model.

## Step 3 — Apply the sensitive-tier controls


The **[Uplift guide](./uplift-to-tse-se/README.md)** is your checklist — work through it and apply the controls your workload requires.

## Step 4 — Validate against your compliance framework

Not every sensitive deployment needs every control. See [Deciding what to apply](./uplift-to-tse-se/README.md#deciding-what-to-apply), then map your chosen controls to your framework with your AWS account team and plan your accreditation evidence.
