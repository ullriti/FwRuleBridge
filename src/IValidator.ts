import { Ruleset } from "./model/ruleset";

export interface IValidatorInfo {
  name: string;
  version: string;
  description: string;
}

export interface IValidationResult {
  success: boolean;
  messages: string[];
}

export interface IValidator {
  info(): IValidatorInfo;
  validate(ruleset: Ruleset): IValidationResult;
}
