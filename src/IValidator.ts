export interface IValidatorInfo {
  name: string;
  version: string;
  description: string;
}

export interface IValidator {
  info(): IValidatorInfo;
}
