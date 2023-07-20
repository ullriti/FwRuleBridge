import { IValidator, IValidatorInfo, ValidationResult } from "../IValidator";

export default class TestValidator implements IValidator {
  validate(): ValidationResult {
    throw new Error("Method not implemented.");
  }

  public info(): IValidatorInfo {
    return {
      name: "Test",
      description: "asdasd",
      version: "1.0.0",
    };
  }
}
