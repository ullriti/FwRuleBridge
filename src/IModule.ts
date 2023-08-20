import { Ruleset } from "./model/ruleset";

export interface IModuleInfo {
  name: string;
  version: string;
  description: string;
  arguments: string;
}

export interface IModule {
  info(): IModuleInfo;
  import(moduleArguments: string): Promise<Ruleset>;
  export(ruleset: Ruleset, moduleArguments: string): Promise<void>;
}
