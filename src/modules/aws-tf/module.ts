import { IModule, IModuleInfo } from "../../IModule";
import { Ruleset } from "../../model/ruleset";
import path from "path";
import { SecurityGroup } from "./model/SecurityGroup";
import { writeApplication } from "../tsi-fw-sheet/export/applicationExporter";
import { writeRuleSet } from "../tsi-fw-sheet/export/ruleSetExporter";
import { writeServerGroups } from "../tsi-fw-sheet/export/serverGroupExporter";
import { writeServiceGroups } from "../tsi-fw-sheet/export/serviceGroupExporter";
import { loadApplication } from "../tsi-fw-sheet/import/applicationImporter";
import { RuleSetImporter } from "../tsi-fw-sheet/import/ruleSetImporter";
import { ServerGroupImporter } from "../tsi-fw-sheet/import/serverGroupImporter";
import { ServiceGroupImporter } from "../tsi-fw-sheet/import/serviceGroupImporter";
import { Application } from "../tsi-fw-sheet/model/application";
import { ServerGroup } from "../tsi-fw-sheet/model/serverGroup";
import { ServiceGroup } from "../tsi-fw-sheet/model/serviceGroup";
import { AwsInstance } from "./model/AwsInstance";
import { SecurityGroupRule } from "./model/SecurityGroupRule";

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
    const data = await this.load(moduleInput);
    return transform4import(
      data.instanceList,
      data.securityGroupList,
      data.sgRuleList
    );
  }

  public async export(ruleset: Ruleset, moduleInput: string) {
    const transformResult = transform4export(ruleset);
    await this.write(
      moduleInput,
      transformResult.instanceList,
      transformResult.securityGroupList,
      transformResult.sgRuleList
    );
  }

  public async easyLoopTest(moduleInput: string): Promise<void> {
    const result = await this.load(moduleInput);
    await this.write(
      moduleInput,
      result.instanceList,
      result.securityGroupList,
      result.sgRuleList
    );
  }

  public async transformLoopTest(moduleInput: string): Promise<void> {
    const importedRuleset = await this.import(moduleInput);
    await this.export(importedRuleset, moduleInput);
  }

  private async load(moduleInput: string): Promise<{
    instanceList: AwsInstance[];
    securityGroupList: SecurityGroup[];
    sgRuleList: SecurityGroupRule[];
  }> {
    const instanceList = new Array<AwsInstance>();
    const securityGroupList = new Array<SecurityGroup>();
    const sgRuleList = new Array<SecurityGroupRule>();

    return {
      instanceList: instanceList,
      securityGroupList: securityGroupList,
      sgRuleList: sgRuleList,
    };
  }

  private async write(
    moduleInput: string,
    instanceList: AwsInstance[],
    securityGroupList: SecurityGroup[],
    sgRuleList: SecurityGroupRule[]
  ): Promise<void> {}
}
