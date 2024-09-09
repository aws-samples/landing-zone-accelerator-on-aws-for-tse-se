**PLEASE NOTE THAT WHILST THE CHANGES ARE BEING MADE ALL INGRESS AND EGRESS TRAFFIC TO THE ENVIRONMENT WILL BE BLOCKED**

**WE HIGHLY RECOMMEND YOU TEST THESE CHANGES IN A DEVELOPMENT ENVIRONMENT BEFORE MAKING THESE CHANGES IN PRODUCTION**

## Step 1 - remove existing perimeter NAT routes
Replace the *routeTables* section of the *Perimeter* VPC to be as follows:

```
    routeTables:
      - name: IGW-Ingress-Routes
        gatewayAssociation: internetGateway
        routes: []
      - name: Perimeter-A
        routes: []
      - name: Perimeter-B
        routes: []
      - name: Perimeter-Nat-A
        routes: []
      - name: Perimeter-Nat-B
        routes: []
      - name: Perimeter-Tgw-A
        routes: []
      - name: Perimeter-Tgw-B
        routes: []
```

## Step 2 - Add the Perimeter VPC CIDR to the AWS Network Firewall Policy

Update the *networkFirewall/rules/- name: "{{ AcceleratorPrefix }}-domain-list-group"/ruleGroup/ruleVariables/ipSets/definition* to include the Perimeter VPC CIDR:

```
              definition:
                - "{{ VpcCentralCidr }}"
                - "{{ VpcDevCidr }}"
                - "{{ VpcTestCidr }}"
                - "{{ VpcProdCidr }}"
                - "{{ VpcPerimeterCidr }}"
```

## Step 3 - run the pipeline

**NOTE: INGRESS AND EGRESS NETWORKING WILL BE UNAVAILABLE DURING THE NEXT TWO STAGES STAGE**

Run the AWSAccelerator-Pipeline.

## Step 4 - Add the new routes

Edit the *routeTables* section of the *Perimeter* VPC to be as follows:

```
    routeTables:
      - name: IGW-Ingress-Routes
        gatewayAssociation: internetGateway
        routes:
          - name: PerimeterNat-A
            destination: "{{ Subnet-Perimeter-Nat-A }}"
            type: networkFirewall
            target: "{{ AcceleratorPrefix }}-firewall"
            targetAvailabilityZone: a
          - name: PerimeterNat-B
            destination: "{{ Subnet-Perimeter-Nat-B }}"
            type: networkFirewall
            target: "{{ AcceleratorPrefix }}-firewall"
            targetAvailabilityZone: b
      - name: Perimeter-A
        routes: 
          - name: IgwRoute
            destination: 0.0.0.0/0
            type: internetGateway
            target: IGW
      - name: Perimeter-B
        routes: 
          - name: IgwRoute
            destination: 0.0.0.0/0
            type: internetGateway
            target: IGW
      - name: Perimeter-Nat-A
        routes: 
          - name: NfwRoute
            destination: 0.0.0.0/0
            type: networkFirewall
            target: "{{ AcceleratorPrefix }}-firewall"
            targetAvailabilityZone: a
          - name: TgwRoute
            destination: "{{ AcceleratorIpamSupernet }}"
            type: transitGateway
            target: Network-Main
      - name: Perimeter-Nat-B
        routes: 
          - name: NfwRoute
            destination: 0.0.0.0/0
            type: networkFirewall
            target: "{{ AcceleratorPrefix }}-firewall"
            targetAvailabilityZone: b
          - name: TgwRoute
            destination: "{{ AcceleratorIpamSupernet }}"
            type: transitGateway
            target: Network-Main
      - name: Perimeter-Tgw-A
        routes:
          - name: NfwRoute
            destination: 0.0.0.0/0
            type: natGateway
            target: Nat-Perimeter-A
          - name: TgwRoute
            destination: "{{ AcceleratorIpamSupernet }}"
            type: transitGateway
            target: Network-Main
      - name: Perimeter-Tgw-B
        routes:
          - name: NfwRoute
            destination: 0.0.0.0/0
            type: natGateway
            target: Nat-Perimeter-B
          - name: TgwRoute
            destination: "{{ AcceleratorIpamSupernet }}"
            type: transitGateway
            target: Network-Main
```

## Step 5 - run the pipeline

**NOTE: WHEN THE PIPELINE RUNS INGRESS AND EGRESS WILL BE RESTORED**

Run the AWSAccelerator-Pipeline.

## Additional notes

For customers that are comfortable with run individual stages using the [LZA cli](https://awslabs.github.io/landing-zone-accelerator-on-aws/v1.6.2/developer-guide/scripts/#core-cli), downtime can be minimized in steps 3 and 5 by running the following stages directly:

### Step 3
Run the *network-prep* stage against the *network account*
Run the *network-vpc* stage against the *perimeter account*

### Step 5
Run the *network-vpc* stage against the *perimeter account*

After running these stages individually the config files must be committed back to the *aws-accelerator* repository and a full pipeline run completed.