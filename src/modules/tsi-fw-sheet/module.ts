import { WorkBook, readFile, writeFile } from "xlsx";
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

  public import(moduleInput: string): Ruleset {
    const application = this.load(moduleInput).application;
    return transform4import(application);
  }

  public export(ruleset: Ruleset, moduleInput: string): void {
    const transformResult = transform4export(ruleset);
    this.write(
      moduleInput,
      transformResult.application,
      transformResult.serverGroups,
      transformResult.serviceGroups
    );
  }

  // easy test which loads all values from a Excel file
  // and recreates the file with the loaded values
  public easyLoopTest(moduleInput: string): void {
    const result = this.load(moduleInput);
    this.write(
      moduleInput,
      result.application,
      result.serverGroups,
      result.serviceGroups
    );
  }

  // extended test which loads a excel file,
  // transforms data to fwRuleBridge datamodel,
  // transforms data back to tsi-fw-sheet model
  // and recreates the input file with the transformed data
  public transformLoopTest(moduleInput: string): void {
    this.export(this.import(moduleInput), moduleInput);
  }

  private load(moduleInput: string): {
    application: Application;
    serverGroups: ServerGroup[];
    serviceGroups: ServiceGroup[];
  } {
    const workbook = readFile(moduleInput);

    // load Services and ServiceGroups
    const result = new ServiceGroupImporter().loadServiceGroups(workbook);
    const serviceGroupList = result.serviceGroupList;

    // load IpOrNetworks and ServerGroups
    const result2 = new ServerGroupImporter().loadServerGroups(workbook);
    const serverGroupList = result2.serverGroupList;

    // load rules
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

    // load application
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

  private write(
    moduleInput: string,
    application: Application,
    serverGroups: ServerGroup[],
    serviceGroups: ServiceGroup[]
  ) {
    // Load the template workbook
    const templateFilePath = path.join(__dirname, "template.xlsx");
    const templateWorkbook: WorkBook = readFile(templateFilePath);

    writeApplication(templateWorkbook, application);
    writeServerGroups(templateWorkbook, serverGroups);
    writeServiceGroups(templateWorkbook, serviceGroups);
    writeRuleSet(templateWorkbook, application.ruleset);

    // Write the result workbook to the specified file path
    writeFile(templateWorkbook, moduleInput);
  }
}
