import {
  IValidator,
  IValidatorInfo,
  IValidationResult,
} from "../../IValidator";
import { Rule } from "../../model/rule";
import { Ruleset } from "../../model/ruleset";
import { getService } from "../../utils/formatter";

export default class Validator implements IValidator {
  public info(): IValidatorInfo {
    return {
      name: "RedPort-Validation",
      description: "checks if red-ports are used",
      version: "1.0.0",
    };
  }

  public validate(ruleset: Ruleset): IValidationResult {
    let success = true;
    const messages: string[] = [];
    const failedRules: { rule: Rule; redPorts: string }[] = [];
    const rules = ruleset.rules;

    rules.forEach((rule) => {
      if (rule.service.protocol === "all") {
        success = false;
        failedRules.push({ rule: rule, redPorts: "all" });
        return;
      }
      const [hasRedPort, redPorts] = this.getRedPorts(
        rule.service.fromPort,
        rule.service.toPort,
        rule.service.protocol
      );
      if (hasRedPort) {
        success = false;
        failedRules.push({ rule: rule, redPorts: redPorts });
      }
    });

    if (!success) {
      const zeroPad = (num: number) =>
        String(num).padStart(failedRules.length.toString().length, "0");
      const count = failedRules.length;

      messages.push(
        `RedPort-Validation was not successful for ${count} rule${
          count > 1 ? "s" : ""
        }:`
      );

      failedRules.forEach((entry, index) => {
        messages.push(
          `(${zeroPad(index + 1)}/${count}) ${entry.rule.source.name} => ${
            entry.rule.target.name
          } with ${getService(entry.rule.service)} has Red-Ports: ${
            entry.redPorts
          }`
        );
      });
    }

    return {
      success: success,
      messages: messages,
    };
  }

  private getRedPorts(
    fromPort: number,
    toPort: number,
    protocol: "TCP" | "UDP" | "ICMP"
  ): [boolean, string] {
    if (protocol === "ICMP") return [false, ""];

    if (fromPort === toPort) {
      if (this.isRedPort(fromPort, protocol))
        return [true, fromPort + "/" + protocol];
    } else {
      const findings: string[] = [];
      for (let index = fromPort; index <= toPort; index++) {
        if (this.isRedPort(index, protocol))
          findings.push(index + "/" + protocol);
      }
      if (findings.length > 0) {
        return [true, findings.toString()];
      }
    }

    return [false, ""];
  }

  private isRedPort(port: number, protocol: "TCP" | "UDP"): boolean {
    const redPortList: { port: number; protocol: "TCP" | "UDP" }[] = [
      { port: 7, protocol: "UDP" },
      { port: 9, protocol: "UDP" },
      { port: 11, protocol: "TCP" },
      { port: 11, protocol: "UDP" },
      { port: 21, protocol: "TCP" },
      { port: 23, protocol: "TCP" },
      { port: 23, protocol: "UDP" },
      { port: 42, protocol: "TCP" },
      { port: 42, protocol: "UDP" },
      { port: 69, protocol: "UDP" },
      { port: 79, protocol: "TCP" },
      { port: 79, protocol: "UDP" },
      { port: 107, protocol: "TCP" },
      { port: 107, protocol: "UDP" },
      { port: 512, protocol: "TCP" },
    ];

    const redPort = redPortList.find(
      (entry) => entry.port === port && entry.protocol === protocol
    );
    return redPort ? true : false;
  }
}
