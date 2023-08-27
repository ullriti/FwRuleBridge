import {
  IValidator,
  IValidatorInfo,
  IValidationResult,
} from "../../IValidator";
import { Ruleset } from "../../model/ruleset";

export default class Validator implements IValidator {
  public info(): IValidatorInfo {
    return {
      name: "HugeClearances-Validation",
      description: "checks if to huge clearances are defined",
      version: "1.0.0",
    };
  }

  public validate(rulset: Ruleset): IValidationResult {
    return {
      success: true,
      messages: ["nothing to do"],
    };
  }
}
