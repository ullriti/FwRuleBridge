import { Argument, Command } from "commander";
import path from "path";
import { IModuleInfo } from "../IModule";
import { Bootstrapper } from "../bootstrapper";
import { Ruleset } from "../model/ruleset";
import { Rule } from "../model/rule";
import { HostGroup } from "../model/hostGroup";
import { CidrIpv4 } from "../model/cidrIpv4";
import { IValidatorInfo } from "../IValidator";
import { isValidIp } from "../utils/checker";
import { getService } from "../utils/formatter";

export function init(
  availableModules: IModuleInfo[],
  availableValidators: IValidatorInfo[],
  bootstrapper: Bootstrapper
) {
  const command = new Command()
    .command("hostrules")
    .aliases(["hr"])
    .addArgument(
      new Argument(
        "<inputModule>",
        "module which is used to transform given input to fwRuleBridge model"
      ).choices(availableModules.map((value) => value.name))
    )
    .addArgument(
      new Argument("<input>", "input which is used by the inputModule")
    )
    .addArgument(new Argument("<hostIp>", "IP of the Host"))
    .description(
      "Reads a given input with the inputModule and returns a list of rules which relates to the given Host-IP"
    )
    .summary("get list of rules for a host")
    .showHelpAfterError(true)
    .action(async (inputModule, input, hostIp, command) => {
      await bootstrapper.runModule(inputModule, input, "import");
      getRulesOfHost(hostIp, bootstrapper.getRuleset());
    });

  console.debug(
    "[DEBUG] Command " +
      path.basename(__filename, ".js") +
      " loaded successfully."
  );

  return command;
}

function getRulesOfHost(host: string, ruleset: Ruleset) {
  if (!isValidIp(host)) {
    console.error(`[ERROR] specified IP ${host} is not a valid IP`);
    return;
  }

  const rules = ruleset.rules;
  const findings: { rule: Rule; which: "source" | "target" | "both" }[] = [];

  rules.forEach((rule) => {
    const isSource = containsIp(rule.source, host);
    const isTarget = containsIp(rule.target, host);
    if (isSource && isTarget) findings.push({ rule: rule, which: "both" });
    if (isSource && !isTarget) findings.push({ rule: rule, which: "source" });
    if (!isSource && isTarget) findings.push({ rule: rule, which: "target" });
  });

  if (findings.length === 0) {
    console.info(`[INFO] no rules with IP ${host}`);
  } else {
    console.info(
      `[INFO] Found ${findings.length} rule${
        findings.length === 1 ? "" : "s"
      } for IP ${host}:`
    );

    // print all rules
    const zeroPad = (num: number, places: number) =>
      String(num).padStart(places, "0");
    findings.forEach((finding, index, array) => {
      const isBoth = finding.which === "both";
      const sourceText =
        finding.which === "source" || isBoth
          ? `\x1b[1m\x1b[31m${finding.rule.source.name}\x1b[0m`
          : finding.rule.source.name;
      const targetText =
        finding.which === "target" || isBoth
          ? `\x1b[1m\x1b[31m${finding.rule.target.name}\x1b[0m`
          : finding.rule.target.name;
      console.info(
        `(${zeroPad(index + 1, array.length.toString().length)}/${
          array.length
        }) ` +
          `${sourceText} => ` +
          `${targetText} using ` +
          `${getService(finding.rule.service)} with reason ` +
          `${finding.rule.description}`
      );
    });
  }
}

function containsIp(hostGroup: HostGroup, host: string): boolean {
  let result = false;
  for (let member of hostGroup.members) {
    // if member is a ipOrNetwork, then check if it contains the host
    if (member instanceof CidrIpv4 && hostInNetwork(member.cidrIpv4, host)) {
      result = true;
      break;
    }

    // if member is a HostGroup then start recursion
    if (member instanceof HostGroup) {
      result = containsIp(member, host);
      if (result) break;
    }
  }
  return result;
}

function hostInNetwork(network: string, host: string): boolean {
  if (network.includes("/32")) {
    return network === `${host}/32`;
  }

  const [networkAddress, subnetBits] = network.split("/");
  const subnetMask = (1 << (32 - parseInt(subnetBits))) - 1;
  const invertedSubnetMask = ~subnetMask;

  const networkAddressParts = networkAddress.split(".").map(Number);
  const ipParts = host.split(".").map(Number);

  const networkNumeric =
    (networkAddressParts[0] << 24) |
    (networkAddressParts[1] << 16) |
    (networkAddressParts[2] << 8) |
    networkAddressParts[3];
  const ipNumeric =
    (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];

  return (
    (ipNumeric & invertedSubnetMask) === (networkNumeric & invertedSubnetMask)
  );
}
