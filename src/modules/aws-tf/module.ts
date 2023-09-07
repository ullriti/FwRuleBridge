import { IModule, IModuleInfo } from "../../IModule";
import { Ruleset } from "../../model/ruleset";
import { SecurityGroup } from "./model/SecurityGroup";
import { AwsInstance } from "./model/AwsInstance";
import { SecurityGroupRule } from "./model/SecurityGroupRule";

import { loadTfFiles } from "./import/import";
import { writeTfFiles } from "./export/export";

import { transform as transform4import } from "./transformer/transformImport";
import { transform as transform4export } from "./transformer/transformExport";

export default class Module implements IModule {
  public info(): IModuleInfo {
    return {
      name: "AWS-TF",
      description: "used for AWS Terraform Code with filetype: *.tf",
      version: "1.0.0",
      arguments: "path to folder with Terraform code",
    };
  }

  public async import(moduleInput: string): Promise<Ruleset> {
    const [instanceList, securityGroupList, sgRuleList] = await loadTfFiles(
      moduleInput
    );
    return transform4import(instanceList, securityGroupList, sgRuleList);
  }

  public async export(ruleset: Ruleset, moduleInput: string) {
    const transformResult = transform4export(ruleset);
    await writeTfFiles(
      moduleInput,
      transformResult.instanceList,
      transformResult.securityGroupList,
      transformResult.sgRuleList
    );
  }

  public async easyLoopTest(moduleInput: string): Promise<void> {
    const [instanceList, securityGroupList, sgRuleList] = await loadTfFiles(
      moduleInput
    );
    await writeTfFiles(
      moduleInput,
      instanceList,
      securityGroupList,
      sgRuleList
    );
  }

  public async transformLoopTest(moduleInput: string): Promise<void> {
    const importedRuleset = await this.import(moduleInput);
    await this.export(importedRuleset, moduleInput);
  }
}
