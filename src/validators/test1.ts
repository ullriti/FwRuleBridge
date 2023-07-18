import { IValidatorInfo } from "../IValidatorInfo";

export class Validator {
  public info(): IValidatorInfo {
    return {
      name: "Test",
      description: "asdasd",
      version: "1.0.0",
    };
  }
}
