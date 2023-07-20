import { Ruleset } from "./model/ruleset";

export interface IModuleInfo {
  name: string;
  version: string;
  description: string;
  inputType: string;
}

export interface ModuleResult {
  success: boolean;
  message: string;
  data?: Ruleset;
}

export interface IModule {
  info(): IModuleInfo;
  import(moduleInput: string): ModuleResult;
}
