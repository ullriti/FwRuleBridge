import { CidrIpv4 as fwRuleBridgeCidrIpv4 } from "../../../model/cidrIpv4";
import { HostGroup as fwRuleBridgeHostGroup } from "../../../model/hostGroup";
import { Rule as fwRuleBridgeRule } from "../../../model/rule";
import { Ruleset as fwRuleBridgeRuleset } from "../../../model/ruleset";
import { Service as fwRuleBridgeService } from "../../../model/service";

import { AwsInstance } from "../model/AwsInstance";
import { SecurityGroup } from "../model/SecurityGroup";
import { SecurityGroupRule } from "../model/SecurityGroupRule";

let applicationClassification:
  | "public"
  | "internal"
  | "confidential"
  | "secret" = "public";

let applicationName: string = "unknown application";

const transformedRules: fwRuleBridgeRule[] = [];
const hostGroupList: fwRuleBridgeHostGroup[] = [];
const cidrIpv4List: fwRuleBridgeCidrIpv4[] = [];

export function transform(
  instanceList: AwsInstance[],
  securityGroupList: SecurityGroup[],
  sgRuleList: SecurityGroupRule[]
): fwRuleBridgeRuleset {
  buildHostGroupAndCidrIpv4Lists(instanceList, securityGroupList);
  buildTransformedRules(sgRuleList);

  // Create and return the transformed ruleset
  const ruleset = new fwRuleBridgeRuleset(applicationName, transformedRules, {
    applicationClassification: applicationClassification,
  });
  return ruleset;
}

function buildTransformedRules(sgRuleList: SecurityGroupRule[]) {
  sgRuleList.forEach((rule) => {
    checkAndSetApplicationInfo(rule);

    const service = createService(rule);
    const name = rule.ressourceName;
    const description = rule.description || "";
    const tags = rule.tags;

    const [source, target] = getHostGroup(rule);
    let category: "internal" | "inbound" | "outbound" = "internal";

    // define category if source or target is external
    if (source.external) category = "inbound";
    if (target.external) category = "outbound";

    // define category if cidrIPv4 is defined
    if (rule.cidrIpv4) {
      let ip = rule.cidrIpv4;
      !ip.includes("/") ? (ip = ip + "/32") : "";
      const result = cidrIpv4List.find((cidr) => {
        cidr.cidrIpv4 === ip;
      });
      if (result) {
        category = "internal";
      } else {
        if (rule.category === "ingress") category = "inbound";
        if (rule.category === "egress") category = "outbound";
      }
    }

    // create rule if not already exist
    // this is possible by an internal rule
    const finding = transformedRules.find(
      (value) =>
        value.source === source &&
        value.target === target &&
        value.service === service
    );
    if (!finding) {
      transformedRules.push(
        new fwRuleBridgeRule(
          name,
          category,
          source,
          target,
          service,
          description,
          tags
        )
      );
    }
  });
}

function checkAndSetApplicationInfo(rule: SecurityGroupRule) {
  const tags = rule.tags;
  const keys = Object.keys(tags);

  const name = keys.find(
    (key) =>
      key === "Application Name" ||
      key === "Application-Name" ||
      key === "Applicationname"
  );
  if (name) applicationName = tags[name];

  const classification = keys.find(
    (key) =>
      key === "Application Classification" ||
      key === "Application-Classification" ||
      key === "Applicationclassification"
  );
  if (classification) {
    const value = tags[classification];
    switch (value) {
      case "public":
        applicationClassification = "public";
        break;
      case "internal":
        applicationClassification = "internal";
        break;
      case "confidential":
        applicationClassification = "confidential";
        break;
      case "secret":
        applicationClassification = "secret";
        break;
      default:
        break;
    }
  }
}

function getHostGroup(
  rule: SecurityGroupRule
): [fwRuleBridgeHostGroup, fwRuleBridgeHostGroup] {
  let source: fwRuleBridgeHostGroup;
  let target: fwRuleBridgeHostGroup;
  let result: fwRuleBridgeHostGroup | undefined;
  // create hostgroup from cidrIpv4
  if (rule.cidrIpv4) {
    result = new fwRuleBridgeHostGroup(
      rule.cidrIpv4,
      false,
      [new fwRuleBridgeCidrIpv4(rule.cidrIpv4, "")],
      {}
    );
  }

  // create hostgroup from referencedSecurityGroupId
  else if (rule.referencedSecurityGroupId) {
    const test = hostGroupList.find((hg) =>
      rule.referencedSecurityGroupId!.includes(hg.name)
    );
    if (test) {
      result = test;
    } else {
      result = new fwRuleBridgeHostGroup(
        rule.referencedSecurityGroupId,
        true,
        [],
        { type: "referencedSecurityGroupId" }
      );
    }
  }

  // create hostgroup from prefixListId
  else if (rule.prefixListId) {
    result = new fwRuleBridgeHostGroup(rule.prefixListId, true, [], {
      type: "prefixListId",
    });
  }

  // create hostgroup from securityGroup
  const hg = hostGroupList.find(
    (group) => group.name === rule.securityGroupId.ressourceName
  );
  if (!hg)
    throw new Error(
      "HostGroup not found but should be exist: " + rule.securityGroupId
    );

  // fail if result is not defined
  if (!result) {
    throw new Error("Rule not valid: " + JSON.stringify(rule));
  }

  // define source and target by using rule category
  if (rule.category === "ingress") {
    source = result;
    target = hg;
  } else {
    source = hg;
    target = result;
  }
  return [source, target];
}

function createService(sgRule: SecurityGroupRule): fwRuleBridgeService {
  let result: fwRuleBridgeService;
  if (sgRule.ipProtocol === "-1") {
    result = new fwRuleBridgeService(0, 65535, "all", "");
  } else if (sgRule.ipProtocol === "icmp") {
    result = new fwRuleBridgeService(0, 0, "ICMP", "");
  } else {
    if (sgRule.fromPort && sgRule.toPort) {
      result = new fwRuleBridgeService(
        sgRule.fromPort,
        sgRule.toPort,
        sgRule.ipProtocol.toString().toUpperCase() as "TCP" | "UDP",
        ""
      );
    } else {
      throw new Error("Missing fromPort or toPort in rule " + sgRule);
    }
  }
  return result;
}

function buildHostGroupAndCidrIpv4Lists(
  instanceList: AwsInstance[],
  securityGroupList: SecurityGroup[]
) {
  const sgUsage: { [sgName: string]: fwRuleBridgeCidrIpv4[] } = {};
  instanceList.forEach((instance) => {
    // add cidrIpv4Instance to List
    let ip = instance.privateIp;
    !ip.includes("/") ? (ip = ip + "/32") : "";
    const cidrIpv4 = new fwRuleBridgeCidrIpv4(ip, instance.ressourceName);
    cidrIpv4List.push(cidrIpv4);

    // add to sgUsage
    instance.vpcSecurityGroupIds.forEach((sgId) => {
      if (!sgId.startsWith("aws_security_group.") || !sgId.endsWith(".id")) {
        throw new Error("SecurityGroup has not a valid format: " + sgId);
      }
      const name = sgId.split(".id")[0].split("aws_security_group.")[1];
      const sg = securityGroupList.find(
        (value) => value.ressourceName === name
      );
      if (!sg) {
        throw new Error("Security Group not found with name: " + name);
      }
      sgUsage[sg.ressourceName]
        ? sgUsage[sg.ressourceName].push(cidrIpv4)
        : (sgUsage[sg.ressourceName] = [cidrIpv4]);
    });
  });

  // create host groups and add name and description (if exists) as tag
  securityGroupList.forEach((sg) => {
    const tags = sg.tags || [];
    sg.description ? (tags["Description"] = sg.description) : "";
    sg.name ? (tags["Name"] = sg.name) : "";
    hostGroupList.push(
      new fwRuleBridgeHostGroup(
        sg.ressourceName,
        false,
        sgUsage[sg.ressourceName],
        tags
      )
    );
  });
}
