export interface IModuleInfo {
  name: string;
  version: string;
  description: string;
  inputType: string;
}

export interface IModule {
  info(): IModuleInfo;
}
