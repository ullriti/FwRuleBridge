import { IValidator, IValidatorInfo } from "../IValidator";

export default class TestValidator implements IValidator {
  public info(): IValidatorInfo {
    return {
      name: "Test",
      description: "asdasd",
      version: "1.0.0",
    };
  }
}
