import { CidrIpv4 as fwRuleBridgeCidrIpv4 } from "../../../model/cidrIpv4";
import { HostGroup as fwRuleBridgeHostGroup } from "../../../model/hostGroup";
import { Rule as fwRuleBridgeRule } from "../../../model/rule";
import { Ruleset as fwRuleBridgeRuleset } from "../../../model/ruleset";
import { Service as fwRuleBridgeService } from "../../../model/service";

import { Application } from "../model/application";
import { IpOrNetwork } from "../model/ipOrNetwork";
import { Rule } from "../model/rule";
import { ServerGroup } from "../model/serverGroup";
import { Service } from "../model/service";
import { ServiceGroup } from "../model/serviceGroup";

import { formatDate2String } from "../utils/helpers";

// Transforms an Application into a fwRuleBridgeRuleset
export function transform(application: Application): fwRuleBridgeRuleset {
  // Extract application's classification as tags
  const rulesetTags = {
    "Application Classification": application.classification,
  };

  // Create an array to store transformed rules
  const rules: fwRuleBridgeRule[] = [];

  // Transform each rule in the application
  application.ruleset.forEach((value) => {
    const source = getHostGroup(value.source);
    const target = getHostGroup(value.target);
    const services = getServices(value);

    services.forEach((service) => {
      rules.push(
        new fwRuleBridgeRule(
          getRuleName(source, target, service),
          parseCategory(value.category),
          source,
          target,
          service,
          value.description,
          getRuleTag(value)
        )
      );
    });
  });

  // Create and return the transformed ruleset
  const ruleset = new fwRuleBridgeRuleset(application.name, rules, rulesetTags);
  return ruleset;
}

// Generate a rule name based on source, target, and service
function getRuleName(
  source: fwRuleBridgeHostGroup,
  target: fwRuleBridgeHostGroup,
  service: fwRuleBridgeService
): string {
  return (
    source.name +
    "_to_" +
    target.name +
    "_with_" +
    service.fromPort +
    "-" +
    service.toPort +
    "/" +
    service.protocol
  );
}

// Generate tags for a rule based on Rule object properties
function getRuleTag(value: Rule) {
  return {
    "Protocol-Stack": value.protocolStack,
    Justification: value.justification,
    "Secured-By": value.securedBy,
    "Data-Classification": value.dataClassification,
    Date: formatDate2String(value.date),
  };
}

// Transform an IpOrNetwork or ServerGroup into a fwRuleBridgeHostGroup
function getHostGroup(
  source: IpOrNetwork | ServerGroup
): fwRuleBridgeHostGroup {
  if (source instanceof IpOrNetwork) {
    return new fwRuleBridgeHostGroup(
      source.getIp(),
      false,
      [new fwRuleBridgeCidrIpv4(source.getIp(), "")],
      {}
    );
  } else {
    const result = getListOfHosts(source);
    return result;
  }
}

// Transform a ServerGroup into a fwRuleBridgeHostGroup
function getListOfHosts(serverGroup: ServerGroup): fwRuleBridgeHostGroup {
  const members: (fwRuleBridgeCidrIpv4 | fwRuleBridgeHostGroup)[] = [];
  serverGroup.members.forEach((value) => {
    if (value.member instanceof IpOrNetwork) {
      members.push(
        new fwRuleBridgeCidrIpv4(value.member.getIp(), value.description)
      );
    } else {
      members.push(getListOfHosts(value.member));
    }
  });

  return new fwRuleBridgeHostGroup(serverGroup.name, false, members, {});
}

// Parse a category string into "inbound", "outbound", or "internal"
function parseCategory(category: string): "inbound" | "outbound" | "internal" {
  const value = category.toLowerCase();

  if (value.includes("out")) return "outbound";
  if (value.includes("inter") || value === "within") return "internal";
  if (value.includes("in")) return "inbound";

  throw new Error(
    "Could not resolve category to inbound, outbound or within: " + category
  );
}

// Get an array of transformed services from a Rule object
function getServices(rule: Rule): fwRuleBridgeService[] {
  const services: fwRuleBridgeService[] = [];
  getNestedServices(rule.service, services, "").forEach((value) =>
    services.push(value)
  );
  return services;
}

// Create a fwRuleBridgeService based on a Service object
function createFwRuleBridgeService(
  service: Service,
  description: string
): fwRuleBridgeService {
  const portRange =
    service.port_range || (service.protocol === "ICMP" ? "0" : "");
  const [fromPort, toPort] =
    typeof portRange === "string"
      ? portRange.split("-").map((value) => Number.parseInt(value.trim()))
      : [portRange, portRange];

  return new fwRuleBridgeService(
    fromPort,
    toPort,
    service.protocol,
    description
  );
}

// Check if a service already exists in an array of services
function serviceExists(
  service: fwRuleBridgeService,
  services: fwRuleBridgeService[]
): boolean {
  return services.some(
    (value) =>
      value.description === service.description &&
      value.fromPort === service.fromPort &&
      value.toPort === service.toPort &&
      value.protocol === service.protocol
  );
}

// Recursively transform nested services from Service and ServiceGroup objects
function getNestedServices(
  service: Service | ServiceGroup,
  services: fwRuleBridgeService[],
  descriptionBase: string
): fwRuleBridgeService[] {
  if (service instanceof Service) {
    const newService = createFwRuleBridgeService(
      service,
      service.port_range
        ? `${service.port_range}/${service.protocol}`
        : service.protocol
    );

    if (!serviceExists(newService, services)) return [newService];
    return [];
  } else {
    if (!descriptionBase) descriptionBase = `Group: ${service.name}, `;
    const result: fwRuleBridgeService[] = [];
    service.members.forEach((member) => {
      if (member.member instanceof Service) {
        const newService = createFwRuleBridgeService(
          member.member,
          `${descriptionBase}Description: ${member.description}`
        );

        if (!serviceExists(newService, services)) result.push(newService);
      } else {
        result.push(
          ...getNestedServices(member.member, services, descriptionBase)
        );
      }
    });
    return result;
  }
}
