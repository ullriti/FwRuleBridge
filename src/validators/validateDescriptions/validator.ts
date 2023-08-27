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
      name: "Description-Validation",
      description: "validates if descriptions are defined",
      version: "1.0.0",
    };
  }

  public validate(ruleset: Ruleset): IValidationResult {
    let success = true;
    const messages: string[] = [];
    const failedRules: Rule[] = [];
    const rules = ruleset.rules;

    rules.forEach((rule) => {
      if (rule.description) {
        if (
          rule.description.match(/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/) ||
          rule.description === ""
        ) {
          success = false;
          failedRules.push(rule);
        }
      } else {
        success = false;
        failedRules.push(rule);
      }
    });

    if (!success) {
      const zeroPad = (num: number) =>
        String(num).padStart(failedRules.length.toString().length, "0");
      const count = failedRules.length;

      messages.push(
        `Description-Validation was not successful for ${count} rule${
          count > 1 ? "s" : ""
        }:`
      );

      failedRules.forEach((rule, index) => {
        messages.push(
          `(${zeroPad(index + 1)}/${count}) ${rule.source.name} => ${
            rule.target.name
          } with ${getService(rule.service)}`
        );
      });
    }

    return {
      success: success,
      messages: messages,
    };
  }
}
