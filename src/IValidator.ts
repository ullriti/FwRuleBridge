import { Ruleset } from "./model/ruleset";

export interface IValidatorInfo {
  name: string;
  version: string;
  description: string;
}

export interface ValidationResult {
  success: boolean;
  message: string;
}

export interface IValidator {
  info(): IValidatorInfo;
  validate(ruleset: Ruleset): ValidationResult;
}
