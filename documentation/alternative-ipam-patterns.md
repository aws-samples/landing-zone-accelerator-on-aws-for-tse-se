# Alternative IPAM allocation

For many customers allocating a large (/8 or similar) range that does not conflict with on-premises ranges can be challenging. To help customers overcome this challenge we offer the following approach, which still aligns to the core design principles of security, scalability and resilience.

However, with this approach their are trade-offs that need to be considered during the design phase.

## IPAM architecture

The architecture builds on the IPAM model that the reference architecture defines in the high level design. However, instead of assigning a large non-overlapping CIDR range to the "{{ AcceleratorPrefix }}-supernet" pool, a smaller non-overlapping CIDR will be allocated to the "{{ AcceleratorPrefix }}-supernet" pool. This pool will be used to assign CIDRs to the web subnets in each VPC. 

A second CIDR range that is non-overlapping with on-premises must then be allocated for VPC's. This range will be re-used for every VPC that is deployed. This is specifically done to allow workloads to route through the web subnets to on-premises resources without worrying about conflicting addresses existing with the AWS environment. The diagram shows the web subnets being allocated via IPAM and the other non-routable VPCs being statically defined with the same range for all VPC's.

![CIDR allocation](/architecture-doc/images/ipam/ipam-Overlapping-cidr-allocations.drawio.png)

### Limitations/trade-offs

- Connectivity between environments can only be provided via the web subnet (ingress via ALB, egress via Nat Gateway), PrivateLink or other AWS services that use the AWS Backbone to route traffic from one VPC to another (such as VPC Lattice). This prevents granular instance to instance communication because services are accessed via load balancers in the web subnet only.
- Granular access control or logging (that relies on source IP addresses as a mechanism for identity) to on-premises environments will not be possible because all sources will originate as their VPC's NAT Gateway
- VPC peering will not be possible because of overlapping address ranges
- Potential for asymetric requests. For example, outbound requests go via the NAT Gateway and inbound callbacks are made directly to the load balancer, causing confusion with the application on the state of requests
- Increased costs because all VPCs will need a private NAT Gateway deployed in the web subnets for every VPC
- Access to the Mgmt subnets is required to go via a ALB and reponse traffic will return via a NATGW, which may require running aggregators in each VPC. It is possible to also update this model, using the routable Web ranges as an example to make the Mgmt ranges routable too.

## IPAM implementation

Assign two CIDR ranges which do not overlap with on-premises ranges.

1. **Routable CIDR range for web subnets**
    This should be a reasonably large range to support scaling of spoke VPC's. For example, if each Web subnet is allocated a "/27" (giving 30 usable addresses), then allocating a "/20" would provide provision for 64 VPC's.
1. **Externally non-routable CIDR range for use across other VPC subnets, e.g. App and Data subnets**
    This should be a large subnet to suport growth within the environment. For example a /20 would allow for 64 VPCs.

Update the following values in the [replacements-config.yaml](/config/replacements-config.yaml).

```
  - key: AcceleratorIpamSupernet
    type: String
    value: <Smaller non-overlapping CIDR range to be used across the entire environment for the routable web subnets>
  - key: homeRegionCidr
    type: String
    value: <CIDR allocation from the supernet to be used in the home region for the routable web subnets>
  - key: homeRegionCoreServicesCidr
    type: String
    value: <CIDR allocation from the home region to be used by core services for the routable web subnets>
  - key: homeRegionCoreServicesDevCidr
    type: String
    value: <CIDR allocation from the home region core services to be used by core services Dev for the routable web subnets>
  - key: homeRegionCoreServicesTestCidr
    type: String
    value: <CIDR allocation from the home region core services to be used by core services Test for the routable web subnets>
  - key: homeRegionCoreServicesProdCidr
    type: String
    value: <CIDR allocation from the home region core services to be used by core services Prod for the routable web subnets>
  - key: homeRegionWorkloadCidr
    type: String
    value: <CIDR allocation from the home region for use by worksloads for the routable web subnets>
  - key: homeRegionWorkloadDevCidr
    type: String
    value: <CIDR allocation from the home region worksloads pool for the Dev workloads for the routable web subnets>
  - key: homeRegionWorkloadTestCidr
    type: String
    value: <CIDR allocation from the home region worksloads pool for the Test workloads for the routable web subnets>
  - key: homeRegionWorkloadProdCidr
    type: String
    value: <CIDR allocation from the home region worksloads pool for the Prod workloads for the routable web subnets>
```

Add the following values for the VPC ranges in the [replacements-config.yaml](/config/replacements-config.yaml).

```
  - key: AcceleratorVpcCidr
    type: String
    value: <CIDR range to be used for all VPC's in the environment that doesn't overlap with on-premises>
  - key: AcceleratorMgmtACidr
    type: String
    value: <CIDR range from AcceleratorVpcCidr used for Mgmt-A>
  - key: AcceleratorMgmtBCidr
    type: String
    value: <CIDR range from AcceleratorVpcCidr used for Mgmt-B>
  - key: AcceleratorAppACidr
    type: String
    value: <CIDR range from AcceleratorVpcCidr used for App-A>
  - key: AcceleratorAppBCidr
    type: String
    value: <CIDR range from AcceleratorVpcCidr used for App-B>
  - key: AcceleratorDataACidr
    type: String
    value: <CIDR range from AcceleratorVpcCidr used for Data-A>
  - key: AcceleratorDataBCidr
    type: String
    value: <CIDR range from AcceleratorVpcCidr used for Data-B>
  - key: AcceleratorTgwACidr
    type: String
    value: <CIDR range from AcceleratorVpcCidr used for Tgw-B>
  - key: AcceleratorTgwBCidr
    type: String
    value: <CIDR range from AcceleratorVpcCidr used for Tgw-B>
```

Update the [network-config.yaml](/config/network-config.yaml) "{{ AcceleratorPrefix }}-home-region-workload-pool" IPAM pool to use only a single workload CIDR. 

```
        - name: "{{ AcceleratorPrefix }}-home-region-workload-pool"
          description: "Used for all workload environments in the home region, e.g. Dev, Test and Production."
          locale: "{{ AcceleratorHomeRegion }}"
          provisionedCidrs:
            - "{{ homeRegionWorkloadCidr }}"
```

Update the [network-config.yaml](/config/network-config.yaml) to add an additional CIDR to the VPC CIDR ranges and update the Web/App and Data subnets to use the new AcceleratorVpcCidr ranges. An example of this is below:

```
  - name: Prod
    tags:
      - key: Name
        value: Prod
    account: Network
    region: "{{ AcceleratorHomeRegion }}"
    ipamAllocations:
      - ipamPoolName: "{{ AcceleratorPrefix }}-home-region-workload-prod-pool"
        netmaskLength: 16
    cidrs:
      - "{{AcceleratorVpcCidr}}"
...
    subnets:
      - name: Prod-Web-A
        availabilityZone: a
        routeTable: Prod
        ipamAllocation:
          ipamPoolName: "{{ AcceleratorPrefix }}-home-region-workload-prod-pool"
          netmaskLength: 20
        shareTargets:
          organizationalUnits:
            - Prod
      - name: Prod-Web-B
        availabilityZone: b
        routeTable: Prod
        ipamAllocation:
          ipamPoolName: "{{ AcceleratorPrefix }}-home-region-workload-prod-pool"
          netmaskLength: 20
        shareTargets:
          organizationalUnits:
            - Prod
      - name: Prod-App-A
        availabilityZone: a
        routeTable: Prod
        ipv4CidrBlock: "{{AcceleratorAppACidr}}"
        shareTargets:
          organizationalUnits:
            - Prod
      - name: Prod-App-B
        availabilityZone: b
        routeTable: Prod
        ipv4CidrBlock: "{{AcceleratorAppBCidr}}"
        shareTargets:
          organizationalUnits:
            - Prod
      - name: Prod-Data-A
        availabilityZone: a
        routeTable: Prod
        ipv4CidrBlock: "{{AcceleratorDataACidr}}"
        shareTargets:
          organizationalUnits:
            - Prod
      - name: Prod-Data-B
        availabilityZone: b
        routeTable: Prod
        ipv4CidrBlock: "{{AcceleratordataBCidr}}"
        shareTargets:
          organizationalUnits:
            - Prod
      - name: Prod-MainTgwAttach-A
        availabilityZone: a
        routeTable: Prod
        ipv4CidrBlock: "{{AcceleratorTgwACidr}}"
      - name: Prod-MainTgwAttach-B
        availabilityZone: b
        routeTable: Prod
        ipv4CidrBlock: "{{AcceleratorTgwBCidr}}"
      - name: Prod-Mgmt-A
        availabilityZone: a
        routeTable: Prod
        ipv4CidrBlock: "{{ AcceleratorMgmtACidr }}"
      - name: Prod-Mgmt-B
        availabilityZone: b
        routeTable: Prod
        ipv4CidrBlock: "{{ AcceleratorMgmtACidr }}"
```
