import { SecurityGroup } from "./SecurityGroup";

export class SecurityGroupRule {
  ressourceName: string;
  category: "ingress" | "egress";

  securityGroupId: SecurityGroup;
  ipProtocol: "tcp" | "udp" | "icmp" | "-1";
  description?: string;

  cidrIpv4?: string;
  prefixListId?: string;
  referencedSecurityGroupId?: string;

  fromPort?: number;
  toPort?: number;

  tags: { [key: string]: string } = {};

  constructor(
    ressourceName: string,
    category: "ingress" | "egress",
    securityGroup: SecurityGroup,
    ipProtocol: "tcp" | "udp" | "icmp" | "-1",
    tags: { [key: string]: string }
  ) {
    this.ressourceName = ressourceName;
    this.category = category;
    this.securityGroupId = securityGroup;
    this.ipProtocol = ipProtocol;
    this.tags = tags;
  }
}
