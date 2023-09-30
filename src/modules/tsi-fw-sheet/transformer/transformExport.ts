import { CidrIpv4 as fwRuleBridgeCidrIpv4 } from "../../../model/cidrIpv4";
import { HostGroup as fwRuleBridgeHostGroup } from "../../../model/hostGroup";
import { Rule as fwRuleBridgeRule } from "../../../model/rule";
import { Ruleset as fwRuleBridgeRuleset } from "../../../model/ruleset";
import { Service as fwRuleBridgeService } from "../../../model/service";

import { Application } from "../model/application";
import { Rule } from "../model/rule";
import { ServerGroup } from "../model/serverGroup";
import { ServiceGroup } from "../model/serviceGroup";
import { Service } from "../model/service";
import { ServerGroupMember } from "../model/serverGroupMember";
import { IpOrNetwork } from "../model/ipOrNetwork";
import { ServiceGroupMember } from "../model/serviceGroupMember";
import { parseString2Date } from "../utils/helpers";

const serverGroups: ServerGroup[] = [];
const serviceGroups: ServiceGroup[] = [];
const transformedRules: Rule[] = [];

export function transform(ruleset: fwRuleBridgeRuleset): {
  application: Application;
  serviceGroups: ServiceGroup[];
  serverGroups: ServerGroup[];
} {
  const rules = ruleset.rules;
  const [transformedRules, serviceGroups, serverGroups] = transformRules(rules);

  return {
    application: new Application(
      ruleset.name,
      ruleset.tags["Application Classification"],
      transformedRules
    ),
    serviceGroups: serviceGroups,
    serverGroups: serverGroups,
  };
}

function transformRules(
  rules: fwRuleBridgeRule[]
): [
  transformedRules: Rule[],
  serviceGroups: ServiceGroup[],
  serverGroups: ServerGroup[]
] {
  getServiceGroups(rules);
  getServerGroups(rules);
  getRules(rules);

  return [transformedRules, serviceGroups, serverGroups];
}

function getRules(rules: fwRuleBridgeRule[]) {
  rules.forEach((rule) => {
    const source = getSourceOrTarget(rule.source);
    const target = getSourceOrTarget(rule.target);
    const service = getService(rule.service);
    if (!(service instanceof ServiceGroup) && service.length !== 1) {
      service.forEach((s) => {
        const newRule = createRule(source, target, s, rule);
        isUnique(newRule) ? transformedRules.push(newRule) : "";
      });
    } else if (service instanceof ServiceGroup) {
      const newRule = createRule(source, target, service, rule);
      isUnique(newRule) ? transformedRules.push(newRule) : "";
    } else {
      const newRule = createRule(source, target, service[0], rule);
      isUnique(newRule) ? transformedRules.push(newRule) : "";
    }
  });
}

function isUnique(rule: Rule): boolean {
  const result = transformedRules.find(
    (item) =>
      compareSourceTarget(item.source, rule.source) &&
      compareSourceTarget(item.target, rule.target) &&
      compareService(item.service, rule.service)
  );
  return !result ? true : false;
}

function compareSourceTarget(
  item1: ServerGroup | IpOrNetwork,
  item2: ServerGroup | IpOrNetwork
): boolean {
  if (item1 instanceof ServerGroup && item2 instanceof ServerGroup) {
    return item1.name === item2.name;
  }
  if (item1 instanceof IpOrNetwork && item2 instanceof IpOrNetwork) {
    return item1.getIp() === item2.getIp();
  }
  return false;
}

function compareService(
  item1: ServiceGroup | Service,
  item2: ServiceGroup | Service
): boolean {
  if (item1 instanceof ServiceGroup && item2 instanceof ServiceGroup) {
    return item1.name === item2.name;
  }
  if (item1 instanceof Service && item2 instanceof Service) {
    return (
      item1.port_range === item2.port_range && item1.protocol === item2.protocol
    );
  }
  return false;
}

function createRule(
  source: ServerGroup | IpOrNetwork,
  target: ServerGroup | IpOrNetwork,
  service: ServiceGroup | Service,
  rule: fwRuleBridgeRule
): Rule {
  return new Rule(
    source,
    target,
    service,
    rule.tags["Date"] ? parseString2Date(rule.tags["Date"]) : new Date(),
    rule.description,
    rule.tags["Protocol-Stack"],
    rule.category,
    rule.tags["Justification"],
    rule.tags["Secured-By"],
    rule.tags["Data-Classification"]
  );
}

function getSourceOrTarget(
  hostGroup: fwRuleBridgeHostGroup
): IpOrNetwork | ServerGroup {
  if (singleHostGroup(hostGroup)) {
    if (hostGroup.members[0] instanceof fwRuleBridgeCidrIpv4)
      return new IpOrNetwork(formatIP(hostGroup.members[0].cidrIpv4));
    throw new Error("SingleHost Group but not CidrIpv4 Member: " + hostGroup);
  } else {
    const result = serverGroups.find((group) => group.name === hostGroup.name);
    if (!result)
      throw new Error("Servergroup " + hostGroup.name + " not found!");
    return result;
  }
}

function formatIP(ip: string): string {
  if (ip.includes("/32")) return ip.split("/")[0];
  return ip;
}

function getService(service: fwRuleBridgeService): Service[] | ServiceGroup {
  if (service.description.includes("Group:")) {
    const infos = service.description.split(",");
    const name =
      infos
        .find((value) => value.includes("Group:"))
        ?.split(":")[1]
        .trim() || service.description;
    const result = serviceGroups.find((group) => group.name === name);
    if (!result) throw new Error("ServiceGroup " + name + " not found!");
    return result;
  } else {
    const result: Service[] = [];
    const portRange =
      service.fromPort === service.toPort
        ? service.fromPort
        : service.fromPort + " - " + service.toPort;

    if (service.protocol === "all") {
      const protos: ("TCP" | "UDP" | "ICMP")[] = ["TCP", "UDP", "ICMP"];
      protos.forEach((proto) => result.push(new Service(proto, portRange)));
    } else {
      result.push(new Service(service.protocol, portRange));
    }
    return result;
  }
}

function getServiceGroups(rules: fwRuleBridgeRule[]) {
  rules.forEach((rule) => {
    const service: fwRuleBridgeService = rule.service;
    if (service.description.includes("Group:")) {
      const infos = service.description.split(",");
      const name =
        infos
          .find((value) => value.includes("Group:"))
          ?.split(":")[1]
          .trim() || service.description;
      const description =
        infos
          .find((value) => value.includes("Description:"))
          ?.split(":")[1]
          .trim() || service.description;

      const portRange =
        service.fromPort === service.toPort
          ? service.fromPort
          : service.fromPort + " - " + service.toPort;

      const newSGmembers: ServiceGroupMember[] = [];
      if (service.protocol === "all") {
        // create service for TCP and UDP
        const protos: ("TCP" | "UDP")[] = ["TCP", "UDP"];
        protos.forEach((proto) => {
          const portRange = "0 - 65535";
          newSGmembers.push(
            new ServiceGroupMember(
              new Service(proto, portRange),
              new Date(),
              description
            )
          );
        });
        // create service for ICMP
        newSGmembers.push(
          new ServiceGroupMember(new Service("ICMP"), new Date(), description)
        );
      } else {
        newSGmembers.push(
          new ServiceGroupMember(
            new Service(service.protocol, portRange),
            new Date(),
            description
          )
        );
      }

      const existingGroup = serviceGroups.find((value) => value.name === name);
      if (existingGroup) {
        newSGmembers.forEach((item) => {
          if (
            !existingGroup.members.find((member) => {
              if (
                member.member instanceof Service &&
                item.member instanceof Service
              ) {
                if (
                  member.description === item.description &&
                  member.member.port_range === item.member.port_range &&
                  member.member.protocol === item.member.protocol
                )
                  return true;
              }
              return false;
            })
          )
            existingGroup.members.push(item);
        });
      } else {
        serviceGroups.push(new ServiceGroup(name, newSGmembers));
      }
    }
  });
}

function getServerGroups(rules: fwRuleBridgeRule[]) {
  rules.forEach((rule) => {
    if (!singleHostGroup(rule.source)) getServerGroupsOfEntry(rule.source);
    if (!singleHostGroup(rule.target)) getServerGroupsOfEntry(rule.target);
  });
}

function getServerGroupsOfEntry(group: fwRuleBridgeHostGroup) {
  // if server group already exists skip
  if (serverGroups.find((value) => value.name === group.name)) return [];

  // if external then return empty group
  if (group.external) {
    serverGroups.push(new ServerGroup(group.name, []));
    return;
  }

  const members = getServerGroupMembers(group);

  serverGroups.push(new ServerGroup(group.name, members));
}

function getServerGroupMembers(
  group: fwRuleBridgeHostGroup
): ServerGroupMember[] {
  const resultMembers: ServerGroupMember[] = [];

  group.members.forEach((member) => {
    if (member instanceof fwRuleBridgeCidrIpv4) {
      resultMembers.push(
        new ServerGroupMember(
          new IpOrNetwork(formatIP(member.cidrIpv4)),
          new Date(),
          member.description
        )
      );
    } else {
      let finding = serverGroups.find((value) => value.name === member.name);
      // if server group already exists just add member
      if (!finding) {
        const m = getServerGroupMembers(member);
        const newSG = new ServerGroup(member.name, m);
        serverGroups.push(newSG);
        finding = newSG;
      }
      resultMembers.push(
        new ServerGroupMember(finding, new Date(), member.tags.toString() || "")
      );
    }
  });

  return resultMembers;
}

function singleHostGroup(hostGroup: fwRuleBridgeHostGroup): boolean {
  if (hostGroup.members.length > 0 && hostGroup.external)
    throw new Error(
      "HostGroup has members and is external. This shouldnt happen: " +
        hostGroup
    );

  if (
    hostGroup.members.length === 1 &&
    hostGroup.members[0] instanceof fwRuleBridgeCidrIpv4
  )
    return true;

  return false;
}
