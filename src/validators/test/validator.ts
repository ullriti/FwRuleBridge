import {
  IValidator,
  IValidatorInfo,
  IValidationResult,
} from "../../IValidator";
import { Ruleset } from "../../model/ruleset";

export default class TestValidator implements IValidator {
  public info(): IValidatorInfo {
    return {
      name: "Test",
      description: "asdasd",
      version: "1.0.0",
    };
  }

  public validate(rulset: Ruleset): IValidationResult {
    throw new Error("Method not implemented.");
  }
}
