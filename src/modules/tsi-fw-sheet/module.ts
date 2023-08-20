import { IModule, IModuleInfo } from "../../IModule";
import { loadApplication } from "./import/applicationImporter";
import { transform as transform4import } from "./transformer/transformImport";
import { transform as transform4export } from "./transformer/transformExport";
import { Ruleset } from "../../model/ruleset";
import { ServiceGroupImporter } from "./import/serviceGroupImporter";
import { ServerGroupImporter } from "./import/serverGroupImporter";
import { RuleSetImporter } from "./import/ruleSetImporter";
import { Application } from "./model/application";
import path from "path";
import { writeApplication } from "./export/applicationExporter";
import { writeServerGroups } from "./export/serverGroupExporter";
import { ServerGroup } from "./model/serverGroup";
import { ServiceGroup } from "./model/serviceGroup";
import { writeServiceGroups } from "./export/serviceGroupExporter";
import { writeRuleSet } from "./export/ruleSetExporter";
import * as ExcelJS from "exceljs";
import * as fs from "fs/promises"; // If using Node.js 16 or above

export default class Module implements IModule {
  public info(): IModuleInfo {
    return {
      name: "TSI-FW-Sheet",
      description:
        "used for TSI Firewall Sheets with filetype: Excel-File (.xlsx)",
      version: "1.0.0",
      arguments: "Excel-File (.xlsx)",
    };
  }

  public async import(moduleInput: string): Promise<Ruleset> {
    const application = (await this.load(moduleInput)).application;
    return transform4import(application);
  }

  public async export(ruleset: Ruleset, moduleInput: string) {
    const transformResult = transform4export(ruleset);
    await this.write(
      moduleInput,
      transformResult.application,
      transformResult.serverGroups,
      transformResult.serviceGroups
    );
  }

  public async easyLoopTest(moduleInput: string): Promise<void> {
    const result = await this.load(moduleInput);
    await this.write(
      moduleInput,
      result.application,
      result.serverGroups,
      result.serviceGroups
    );
  }

  public async transformLoopTest(moduleInput: string): Promise<void> {
    const importedRuleset = await this.import(moduleInput);
    await this.export(importedRuleset, moduleInput);
  }

  private async load(moduleInput: string): Promise<{
    application: Application;
    serverGroups: ServerGroup[];
    serviceGroups: ServiceGroup[];
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(moduleInput);

    const result = new ServiceGroupImporter().loadServiceGroups(workbook);
    const serviceGroupList = result.serviceGroupList;

    const result2 = new ServerGroupImporter().loadServerGroups(workbook);
    const serverGroupList = result2.serverGroupList;

    const result3 = new RuleSetImporter().loadRules(
      workbook,
      serviceGroupList,
      result.serviceList,
      serverGroupList,
      result2.ipOrNetowrkList
    );
    const ruleList = result3.ruleList;
    const ipOrNetworkList = result3.updatedIpOrNetworkList;
    const serviceList = result3.updatedServiceList;

    const application = loadApplication(workbook);
    application.ruleset = ruleList;

    console.info(
      "\n====================\n" +
        "Loader Summary: \n" +
        "====================\n" +
        "Application: " +
        application.name +
        "\n" +
        "Classification: " +
        application.classification +
        "\n" +
        "Number of ServiceGroups: " +
        serviceGroupList.length +
        "\n" +
        "Number of Services: " +
        serviceList.length +
        "\n" +
        "Number of ServerGroups: " +
        serverGroupList.length +
        "\n" +
        "Number of IPs or Networks: " +
        ipOrNetworkList.length +
        "\n" +
        "Number of Rules: " +
        ruleList.length +
        "\n" +
        "====================\n"
    );

    return {
      application: application,
      serverGroups: serverGroupList,
      serviceGroups: serviceGroupList,
    };
  }

  private async write(
    moduleInput: string,
    application: Application,
    serverGroups: ServerGroup[],
    serviceGroups: ServiceGroup[]
  ): Promise<void> {
    const templateFilePath = path.join(__dirname, "template.xlsx");
    const templateWorkbook = new ExcelJS.Workbook();
    await templateWorkbook.xlsx.readFile(templateFilePath);

    writeApplication(templateWorkbook, application);
    writeServerGroups(templateWorkbook, serverGroups);
    writeServiceGroups(templateWorkbook, serviceGroups);
    writeRuleSet(templateWorkbook, application.ruleset);

    await templateWorkbook.xlsx.writeFile(moduleInput);
  }
}
