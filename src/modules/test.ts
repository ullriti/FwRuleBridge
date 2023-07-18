import { IModule, IModuleInfo } from "../IModule";

export default class TestModule implements IModule {
  public info(): IModuleInfo {
    return {
      name: "Test",
      description: "this is a test module",
      version: "1.0.0",
      inputType: "want to get a Test-File",
    };
  }
}