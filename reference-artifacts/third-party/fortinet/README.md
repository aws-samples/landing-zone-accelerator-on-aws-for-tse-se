# Deploy Fortinet FortiGate Next-Generation Firewall 

This sample uses an IPSec tunnel to connect the firewall appliances to the Transit Gateway with the same pattern used in the AWS Secure Environment Accelerator. Other connectivity patterns are possible such as using Gateway Load Balancers or Transit Gateway Connect attachments. You should review which pattern best answer your needs. We are working on providing other firewall connectivity patterns in this sample architecture in the future.

## Pre-requisites
- LZA with the reference architecture from this repository already installed with the default network configuration
- You have Fortinet valid licence files

## Option 1 - Connect Firewall to Transit Gateway using IPSec

_Note: the [config](./config/) sub-folder contains sample configuration files and more instructions on how to apply the changes_

1. In Perimeter account subscribe to [Fortinet FortiGate Next-Generation Firewall](https://aws.amazon.com/marketplace/pp/prodview-wory773oau6wq) in AWS Marketplace
2. In Management account, locate the LZA Assets bucket (i.e. `aws-accelerator-assets-111222333444-ca-central-1`) and create `fortinet` prefix (i.e. folder)  
  a. Upload your Fortinet licence files to this bucket folder  
  b. Upload the Fortinet configuration files from the `assets/fortinet` folder to this bucket folder  
3. Modify the `network-config.yaml` (see detailed instructions below)  
  a. Remove AWS Network Firewall  
  b. Adjust TGW and subnet route tables  
  c. Add section to define the `customerGateways`  
  d. Create security group for the Firewall instances. Update source IP allowed to access the management interface on port 443
4. Create a `customization-config.yaml` file and add a section for `firewalls/instances` (see sample below)  
  a. Modify the path to your licence files for the two firewall instances  
  b. Modify the value of `CORP_CIDR_1` variable as needed (two instances) to reflect the CIDR range of the VPC reachable through the transit gateway  
  c. (Optional) Add the `applications` block to the `customization-config.yaml` to deploy rsyslog servers to send Fortigate logs to CloudWatch  
5. In the `iam-config.yaml` file ensure the role used by the firewall instance is defined (i.e. `Firewall-Role`)
      <details>
        <summary>Definition of Firewall-Role in iam-config.yaml</summary>

      ```
      roleSets:
        - deploymentTargets:
            accounts:
              - Perimeter
          roles:
            - name: Firewall-Role
              instanceProfile: true
              assumedBy:
                - type: service
                  principal: ec2.amazonaws.com
              policies:
                awsManaged:
                  - AmazonSSMManagedInstanceCore
                  - CloudWatchAgentServerPolicy
                  - AmazonS3ReadOnlyAccess
              boundaryPolicy: AWSAccelerator-Default-Boundary-Policy
      ```
      </details>

6. Create a userdata folder in your `aws-accelerator-config` folder  
  a. Copy the reference files `userdata/fw1.txt` and `userdata/fw2.txt` from this repository  
  b. Modify the content of `userdata/fw1.txt` and `userdata/fw2.txt` with the appropriate licence file name  
  c. Make sure to include those files in your git commit in the next step (i.e. `git add userdata`)  
7. Commit and push all changes to your `aws-accelerator-config` CodeCommit repository
8. Run the pipepline
9. Verify deployment and connect to the Firewall instances, set the admin password and confirm the licences are correclty activated
10. Configure firewall policies as needed and confirm networking is working as expected. See the [public-facing-workload-via-fortigate.md](public-facing-workload-via-fortigate.md) document for an example to configure a public facing web application that is deployed within a workload AWS Account
11. [Optional] Commenting the `centralNetworkServices/networkFirewall` block removed the AWS Network Firewall from the perimeter account, but the firewall policy and rules are still present in the Network accounts. Connect to the network account using a privileged role and delete those resources to finalize cleanup.
12. [Optional] Remove the NAT Gateways and update the route tables of `Perimeter-A` and `Perimeter-B` subnets to target the Fortigate Elastic Network Interfaces (ENI) in the network-config.yaml configuration file and re-run the pipeline.
13. [Optional] Configure Fortigates to send logs to rsyslog or FortiAnalyzer.

### Detailed steps for network-config.yaml file

1. Remove the AWS Network Firewall by commenting the `centralNetworkServices/networkFirewall` configuration block

2. In the `transitGateways/routeTables` remove the 0.0.0.0 route that use the Perimeter VPC attachement (The Fortigates will connect to the TGW using an IPSec tunnel)

The configuration should look like this

```
transitGateways:
  - name: Network-Main
    account: Network
    region: *HOME_REGION
    shareTargets:
      organizationalUnits:
        - Infrastructure
    asn: 65521
    dnsSupport: enable
    vpnEcmpSupport: enable
    defaultRouteTableAssociation: disable
    defaultRouteTablePropagation: disable
    autoAcceptSharingAttachments: enable
    routeTables:
      - name: Network-Main-Core
        routes: []
      - name: Network-Main-Segregated
        routes:
          - destinationCidrBlock: {{ VpcDevCidr }}
            blackhole: true
          - destinationCidrBlock: {{ VpcTestCidr }}
            blackhole: true
          - destinationCidrBlock: {{ VpcProdCidr }}
            blackhole: true
      - name: Network-Main-Shared
        routes: []
      - name: Network-Main-Standalone
        routes: []
```

3. Add a `customerGateways` block to define the IpSec tunnel endpoints with the Fortigate

```
customerGateways:
  - name: accelerator-tunnel1
    account: Network
    region: *HOME_REGION
    ipAddress: ${ACCEL_LOOKUP::EC2:ENI_0:accelerator-firewall-1}
    asn: 65499
    vpnConnections:
      - name: accelerator-tunnel-1
        transitGateway: Network-Main
        routeTableAssociations:
          - Network-Main-Core
        routeTablePropagations:
          - Network-Main-Segregated          
          - Network-Main-Shared
        staticRoutesOnly: false
        tunnelSpecifications:
          - tunnelInsideCidr: 169.254.200.0/30
          - tunnelInsideCidr: 169.254.200.100/30
  - name: accelerator-tunnel2
    account: Network
    region: *HOME_REGION
    ipAddress: ${ACCEL_LOOKUP::EC2:ENI_0:accelerator-firewall-2}
    asn: 65499
    vpnConnections:
      - name: accelerator-tunnel-2
        transitGateway: Network-Main
        routeTableAssociations:
          - Network-Main-Core
        routeTablePropagations:
          - Network-Main-Segregated          
          - Network-Main-Shared
        staticRoutesOnly: false
        tunnelSpecifications:
          - tunnelInsideCidr: 169.254.200.0/30
          - tunnelInsideCidr: 169.254.200.100/30
```

4. Add a security group for the firewalls interface in the Perimeter VPC configuration block

```
    securityGroups:
      - name: "Firewalls_sg"
        description: "FortiGate Firewalls Security Group"
        inboundRules:
          - description: "All Allowed Inbound Traffic"
            types:
              - HTTPS
            sources:
              - 10.1.1.1/32 # UPDATE with IP allowed to manage firewall
          - description: "Mgmt Traffic, Customer Outbound traffic and ALBs"
            types:
              - ALL
            sources:
              - {{ AwsRangeCidr }}
        outboundRules:
          - description: "All Outbound"
            types:
              - ALL
            sources:
              - 0.0.0.0/0
```

4b. If using the Rsyslog server, add a security group for the Rsyslog server in the Central VPC configuration block

```
    securityGroups:
      - name: "Operations-Rsyslog-sg"
        description: "Security Group for rsyslog instances"
        inboundRules:
          - description: "Rsyslog trafic"
            tcpPorts:
              - 514
            udpPorts:
              - 514
            sources:
              - securityGroups:
                  - Management
              - prefixLists:
                  - onpremises-prefix-list
              - account: Perimeter
                vpc: Perimeter
                subnets:
                  - Perimeter-A
                  - Perimeter-B          
        outboundRules:
          - description: "All Outbound"
            types:
              - ALL
            sources:
              - 0.0.0.0/0
```

5. Modify the route tables in the Perimeter VPC that were previously targetting the AWS Network Firewall (`AWSAccelerator-firewall`). Add the route table `Applications` in subnets `Perimeter-A` and `Perimeter-B`

The final `routeTables` block in Perimeter VPC should look like this

```
    routeTables:
      - name: Perimeter-Tgw-A
        routes:
          - name: NfwRoute
            destination: 0.0.0.0/0
            type: local
            targetAvailabilityZone: a
      - name: Perimeter-Tgw-B
        routes:
          - name: NfwRoute
            destination: 0.0.0.0/0
            type: local
            targetAvailabilityZone: b
      - name: Perimeter-A
        routes:
          - name: NatRoute
            destination: 0.0.0.0/0
            type: natGateway
            target: Nat-Perimeter-A
          - name: S3Gateway
            type: gatewayEndpoint
            target: s3
          - name: DynamoDBGateway
            type: gatewayEndpoint
            target: dynamodb
          - name: Applications
            destination: {{ AwsRangeCidr }}
            type: networkInterface
            target: ${ACCEL_LOOKUP::EC2:ENI_1:accelerator-firewall-1}
      - name: Perimeter-B
        routes:
          - name: NatRoute
            destination: 0.0.0.0/0
            type: natGateway
            target: Nat-Perimeter-B
          - name: S3Gateway
            type: gatewayEndpoint
            target: s3
          - name: DynamoDBGateway
            type: gatewayEndpoint
            target: dynamodb
          - name: Applications
            destination: {{ AwsRangeCidr }}
            type: networkInterface
            target: ${ACCEL_LOOKUP::EC2:ENI_1:accelerator-firewall-2}
      - name: Perimeter-Nat-A
        routes:
          - name: IgwRoute
            destination: 0.0.0.0/0
            type: internetGateway
            target: IGW
      - name: Perimeter-Nat-B
        routes:
          - name: IgwRoute
            destination: 0.0.0.0/0
            type: internetGateway
            target: IGW
``````

6. Remove the `transitGatewayAttachments` under the Perimeter VPC

The configuration block should look like this

```
vpcs:
[content removed for simplicity]
[...]
  - name: Perimeter
  [content removed for simplicity]
  [...]
    transitGatewayAttachments: []
```

### Sample customizations-config.yaml file

<details>
  <summary>Sample customizations-config.yaml file</summary>

```
firewalls:
  instances:
    - name: accelerator-firewall-1
      licenseFile: fortinet/FGVMxxxx.lic # UPDATE WITH YOUR LICENSE FILE NAME
      configFile: fortinet/lza-fortigate.conf
      staticReplacements:
        - key: CORP_CIDR_1
          value: {{ AwsRangeCidr }}
      terminationProtection: true
      launchTemplate:
        name: firewall-lt
        blockDeviceMappings:
          - deviceName: /dev/sda1
            ebs:
              deleteOnTermination: true
              encrypted: true
          - deviceName: /dev/sdb
            ebs:
              deleteOnTermination: true
              encrypted: true
        securityGroups: []
        enforceImdsv2: true
        iamInstanceProfile: Firewall-Role
        imageId: ${ACCEL_LOOKUP::ImageId:/aws/service/marketplace/prod-65dnewvcsm3xk/7.2.8}
        instanceType: c5n.xlarge
        networkInterfaces:
          - deleteOnTermination: true
            description: VPN interface
            associateElasticIp: true
            deviceIndex: 0
            sourceDestCheck: false
            groups:
              - Firewalls_sg
            subnetId: PerimeterNat-A
          - deleteOnTermination: true
            description: Private interface
            associateElasticIp: false
            deviceIndex: 1
            sourceDestCheck: false
            groups:
              - Firewalls_sg
            subnetId: PerimeterTgwAttach-A
          - deleteOnTermination: true
            description: Admin interface
            associateElasticIp: false
            deviceIndex: 2
            sourceDestCheck: false
            groups:
              - Firewalls_sg
            subnetId: Perimeter-A
        userData: userdata/fw1.txt
      vpc: Perimeter
    - name: accelerator-firewall-2
      licenseFile: fortinet/FGVMxxxx.lic # UPDATE WITH YOUR LICENSE FILE NAME
      configFile: fortinet/lza-medium-fortigate-2.conf
      staticReplacements:
        - key: CORP_CIDR_1
          value: {{ AwsRangeCidr }}
      terminationProtection: true
      launchTemplate:
        name: firewall-lt-2
        blockDeviceMappings:
          - deviceName: /dev/sda1
            ebs:
              deleteOnTermination: true
              encrypted: true
          - deviceName: /dev/sdb
            ebs:
              deleteOnTermination: true
              encrypted: true
        securityGroups: []
        enforceImdsv2: true
        iamInstanceProfile: Firewall-Role
        imageId: ${ACCEL_LOOKUP::ImageId:/aws/service/marketplace/prod-65dnewvcsm3xk/7.2.8}
        instanceType: c5n.xlarge
        networkInterfaces:
          - deleteOnTermination: true
            description: VPN interface
            associateElasticIp: true
            deviceIndex: 0
            sourceDestCheck: false
            groups:
              - Firewalls_sg
            subnetId: PerimeterNat-B
          - deleteOnTermination: true
            description: Private interface
            associateElasticIp: false
            deviceIndex: 1
            sourceDestCheck: false
            groups:
              - Firewalls_sg
            subnetId: PerimeterTgwAttach-B
          - deleteOnTermination: true
            description: Admin interface
            associateElasticIp: false
            deviceIndex: 2
            sourceDestCheck: false
            groups:
              - Firewalls_sg
            subnetId: Perimeter-B
        userData: userdata/fw2.txt
      vpc: Perimeter
```
</details>

<details>
  <summary>Additional section to add an instance running rsyslog to receive the FortiGate logs to the customizations-config.yaml file</summary>

```
applications:
  - name: rsyslog
    vpc: Central
    deploymentTargets:
      accounts:
        - Operations
      excludedRegions:
        - us-west-2
        - ap-northeast-1
        - ap-northeast-2
        - ap-northeast-3
        - ap-south-1
        - ap-southeast-1
        - ap-southeast-2
        - eu-central-1
        - eu-north-1
        - eu-west-1
        - eu-west-2
        - eu-west-3
        - sa-east-1
        - us-east-1
        - us-east-2
        - us-west-1
        - us-west-2
    autoscaling:
      name: rsyslog-asg
      maxSize: 4
      minSize: 1
      desiredSize: 1
      launchTemplate: rsyslog-lt
      healthCheckGracePeriod: 300
      healthCheckType: ELB # EC2|ELB
      targetGroups:
        - rsyslog-nlb-tg-1
      subnets:
        - Central-App-A
        - Central-App-B
    launchTemplate:
      name: rsyslog-lt
      blockDeviceMappings:
        - deviceName: /dev/xvda
          ebs:
            deleteOnTermination: true
            encrypted: true
            volumeSize: 100
      securityGroups:
        # security group is from network-config.yaml under the same vpc
        - Operations-Rsyslog-sg
        - Management
      # this instance profile is in iam-config.yaml under roleSets
      iamInstanceProfile: Rsyslog-Role
      # Local or public SSM parameter store lookup for Image ID
      imageId: ${ACCEL_LOOKUP::ImageId:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}
      instanceType: t3.large
      userData: userdata/userData-rsyslog.sh
    targetGroups:
      - name: rsyslog-nlb-tg-1
        port: 514
        protocol: TCP_UDP
        type: instance
        attributes:
          connectionTermination: false
          preserveClientIp: true
          proxyProtocolV2: false
    networkLoadBalancer:
      name: rsyslog-nlb
      scheme: internal
      deletionProtection: true
      subnets:
        # subnets are from network-config.yaml under the same vpc
        - Central-Web-A
        - Central-Web-B
      crossZoneLoadBalancing: false
      listeners:
        - name: rsyslog-listener-1
          port: 514
          protocol: TCP_UDP
          targetGroup: rsyslog-nlb-tg-1
```
</details>

<details>
  <summary>Additional section to add a FortiAnalyzer instance to receive the FortiGate logs to the customizations-config.yaml file</summary>

```
  managerInstances:
    - name: accelerator-fortianalyzer
      licenseFile: fortinet/FAZFxxxx.lic # UPDATE WITH YOUR LICENSE FILE NAME
      configFile: fortinet/lza-faz.conf
      launchTemplate:
        name: fortianalyzer-lt
        #ssh_key
        blockDeviceMappings:
          - deviceName: /dev/sda1
            ebs:
              encrypted: false
              volumeSize: 5
          - deviceName: /dev/sdb
            ebs:
              encrypted: false
              volumeSize: 80
        iamInstanceProfile: Firewall-Role
        imageId: ${ACCEL_LOOKUP::ImageId:/aws/service/marketplace/prod-qexuw2zy5yuo2/7.2.5}
        instanceType: m5.xlarge
        networkInterfaces:
          - deviceIndex: 0
            description: FAZ Primary interface
            groups:
              - Firewalls_sg
            privateIpAddress: 10.7.4.222
            subnetId: Perimeter-A
        securityGroups: []
        userData: userdata/faz.txt
      vpc: Perimeter
```
</details>


### FortiGate instances configuration synchronization

The FortiGate instances are, in this Active/Active setup, independent units.  The Fortinet recommended approach is to use FortiManager which allows for centralized management of non only FortiGate instances in AWS but also FortiGate devices located on premises.

If a FortiManager deployment is not desirable, FortiGate configuration synchronization is still possible.  Although the FGCP protocol, as used in Active/Passive architectures, to sync the configuration is not applicable here, there is another capability that can be used. To enable configuration sync between both unit the sync from the autoscaling setup can be used. This will sync all configuration except for the specific configuration item proper to the specific VM like hostname, routing and others. To enable the configuration sync, the FortiOS cli config snippet below can be added to the appropriate FortiGate instances post deployment.

FortiGate 1

```
config system auto-scale
    set status enable
    set role primary
    set sync-interface "port2"
    set psksecret "a big secret"
end
```

FortiGate 2

```
config system auto-scale
    set status enable
    set role secondary
    set sync-interface "port2"
    set primary-ip ip-address-of-fortigate-1
    set psksecret "a big secret"
end
```