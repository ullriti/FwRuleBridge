import { fail } from "assert";
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
      name: "Tag-Validation",
      description: "validates if recommended tags are defined",
      version: "1.0.0",
    };
  }

  public validate(ruleset: Ruleset): IValidationResult {
    let success = true;
    const messages: string[] = [];
    const failedRules: { rule: Rule; missingTags: string }[] = [];
    const rules = ruleset.rules;

    const tagList = [
      "Protocol-Stack",
      "Justification",
      "Secured-By",
      "Data-Classification",
    ];

    rules.forEach((rule) => {
      if (Object.keys(rule.tags).length > 0) {
        const missingTags: string[] = [];
        tagList.forEach((tag) => {
          const ruleTag = rule.tags[tag];
          if (ruleTag) {
            if (ruleTag.match(/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/)) {
              missingTags.push(tag);
            }
          } else {
            missingTags.push(tag);
          }
        });
        if (missingTags.length > 0) {
          success = false;
          failedRules.push({ rule: rule, missingTags: missingTags.toString() });
        }
      } else {
        success = false;
        failedRules.push({ rule: rule, missingTags: tagList.toString() });
      }
    });

    if (!success) {
      const zeroPad = (num: number) =>
        String(num).padStart(failedRules.length.toString().length, "0");
      const count = failedRules.length;

      messages.push(
        `Tag-Validation was not successful for ${count} rule${
          count > 1 ? "s" : ""
        }:`
      );

      failedRules.forEach((entry, index) => {
        messages.push(
          `(${zeroPad(index + 1)}/${count}) ${entry.rule.source.name} => ${
            entry.rule.target.name
          } with ${getService(entry.rule.service)} missing Tags: ${
            entry.missingTags
          }`
        );
      });
    }

    return {
      success: success,
      messages: messages,
    };
  }
}
