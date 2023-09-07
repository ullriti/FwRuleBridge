import { CidrIpv4 as fwRuleBridgeCidrIpv4 } from "../../../model/cidrIpv4";
import { HostGroup as fwRuleBridgeHostGroup } from "../../../model/hostGroup";
import { Rule as fwRuleBridgeRule } from "../../../model/rule";
import { Ruleset as fwRuleBridgeRuleset } from "../../../model/ruleset";
import { Service as fwRuleBridgeService } from "../../../model/service";
import { AwsInstance } from "../model/AwsInstance";
import { SecurityGroup } from "../model/SecurityGroup";
import { SecurityGroupRule } from "../model/SecurityGroupRule";

const instanceList: AwsInstance[] = [];
const securityGroupList: SecurityGroup[] = [];
const sgRuleList: SecurityGroupRule[] = [];

export function transform(ruleset: fwRuleBridgeRuleset): {
  instanceList: AwsInstance[];
  securityGroupList: SecurityGroup[];
  sgRuleList: SecurityGroupRule[];
} {
  const rules = ruleset.rules;

  // alle Regeln nacheinander laden und anhand der Regeln die Listen erstellen
  // Application Name und Classification als Tags schreiben
  // AWS Instance Ressource Namen stehen in der CIDR Description
  // Host-Group Namen === Security-Group Name
  // Validierung das nicht zu viele Security-Groupen pro Host definiert werden

  rules.forEach((rule) => {
    // set source and target
    switch (rule.category) {
      case "inbound":
        createRule("ingress", rule, ruleset);
        break;

      case "outbound":
        createRule("egress", rule, ruleset);
        break;

      case "internal":
        createRule("ingress", rule, ruleset);
        createRule("egress", rule, ruleset);
        break;
    }
  });

  return {
    instanceList: instanceList,
    securityGroupList: securityGroupList,
    sgRuleList: sgRuleList,
  };
}

function getSecurityGroup(hostgroup: fwRuleBridgeHostGroup): SecurityGroup {
  if (hostgroup.external)
    throw new Error(
      "HostGroup is external but should be a Security Group. Thats not possible: " +
        hostgroup
    );

  // if exists, then return finding
  const finding = securityGroupList.find(
    (sg) => sg.ressourceName === hostgroup.name
  );
  if (finding) {
    return finding;
  }

  // create security group
  const name = hostgroup.name;
  const tags = hostgroup.tags;
  const newSG = new SecurityGroup(name, tags);
  const keys = Object.keys(hostgroup.tags);
  keys.find((value) => value === "Name")
    ? (newSG.name = hostgroup.tags["Name"])
    : "";
  keys.find((value) => value === "Description")
    ? (newSG.description = hostgroup.tags["Description"])
    : "";
  securityGroupList.push(newSG);

  // create AwsInstances and relations to newSG
  createAwsInstanceAndRelation2SG(hostgroup, newSG);

  return newSG;
}

function createAwsInstanceAndRelation2SG(
  hostgroup: fwRuleBridgeHostGroup,
  sg: SecurityGroup
) {
  hostgroup.members.forEach((member) => {
    if (member instanceof fwRuleBridgeHostGroup) {
      createAwsInstanceAndRelation2SG(member, sg);
    } else {
      const ip = member.cidrIpv4;
      const name = member.description;

      const finding = instanceList.find(
        (instance) => instance.ressourceName === name
      );
      if (finding) {
        if (finding.privateIp !== ip)
          throw new Error(
            "Got two instances with name " +
              name +
              " but two different IPs: " +
              ip +
              " and " +
              finding.privateIp
          );

        finding.vpcSecurityGroupIds.push(
          "aws_security_group." + sg.ressourceName + ".id"
        );
      } else {
        instanceList.push(
          new AwsInstance(name, ip, [
            "aws_security_group." + sg.ressourceName + ".id",
          ])
        );
      }
    }
  });
}

function isCidrIpv4(
  members: (fwRuleBridgeCidrIpv4 | fwRuleBridgeHostGroup)[]
): boolean {
  return members.length == 1 && members[0] instanceof fwRuleBridgeCidrIpv4;
}

function mergeObjects(...objects: { [key: string]: string }[]): {
  [key: string]: string;
} {
  const mergedObject: { [key: string]: string } = {};

  objects.forEach((obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        mergedObject[key] = obj[key];
      }
    }
  });

  return mergedObject;
}

function createRule(
  type: "ingress" | "egress",
  rule: fwRuleBridgeRule,
  ruleset: fwRuleBridgeRuleset
) {
  // set protocol
  let protocol: "tcp" | "udp" | "icmp" | "-1";
  if (rule.service.protocol === "all") {
    protocol = "-1";
  } else {
    protocol = rule.service.protocol.toLowerCase() as "tcp" | "udp" | "icmp";
  }

  // define ports if tcp or udp
  let fromPort, toPort;
  if (protocol === "tcp" || protocol == "udp") {
    fromPort = rule.service.fromPort;
    toPort = rule.service.toPort;
  }

  // merge rule and ruleset tags and add application name
  const tags = mergeObjects(rule.tags, ruleset.tags, {
    "Application-Name": ruleset.name,
  });

  // set standard values
  const name = rule.name;
  const description = rule.description;

  const target =
    type === "ingress"
      ? getSecurityGroup(rule.target)
      : getSecurityGroup(rule.source);

  const newRule = new SecurityGroupRule(name, type, target, protocol, tags);
  fromPort ? (newRule.fromPort = fromPort) : "";
  toPort ? (newRule.toPort = toPort) : "";
  description ? (newRule.description = description) : "";

  const source = type === "ingress" ? rule.source : rule.target;
  if (source.external) {
    if (isCidrIpv4(source.members)) {
      newRule.cidrIpv4 = (source.members[0] as fwRuleBridgeCidrIpv4).cidrIpv4;
    } else {
      if (source.tags["type"] === "prefixListId") {
        newRule.prefixListId = source.name;
      } else {
        newRule.referencedSecurityGroupId = source.name;
      }
    }
  } else {
    newRule.referencedSecurityGroupId = source.name;
  }

  sgRuleList.push(newRule);
}