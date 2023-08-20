import { SingleBar, Presets } from "cli-progress";
import * as ExcelJS from "exceljs";
import { Rule } from "../model/rule";
import { ServerGroup } from "../model/serverGroup";
import { ServiceGroup } from "../model/serviceGroup";
import { getCellValueString } from "../utils/helpers";
import { IpOrNetwork } from "../model/ipOrNetwork";
import { Service } from "../model/service";
import {
  Ruleset_RowRange as rowRange,
  Ruleset_ColumnNumber as columnNumber,
} from "../utils/xlsxTemplate";

export class RuleSetImporter {
  private ruleList = new Array<Rule>();
  private updatedServiceList = new Array<Service>();
  private updatedIpOrNetworkList = new Array<IpOrNetwork>();

  private readonly progressBar = new SingleBar(
    {
      format:
        "[{bar}] {percentage}% | Time: {duration_formatted} | {value}/{total}",
    },
    Presets.shades_classic
  );

  public loadRules(
    workbook: ExcelJS.Workbook,
    serviceGroups: ServiceGroup[],
    serviceList: Service[],
    serverGroups: ServerGroup[],
    ipOrNetworkList: IpOrNetwork[]
  ): {
    ruleList: Rule[];
    updatedServiceList: Service[];
    updatedIpOrNetworkList: IpOrNetwork[];
  } {
    const rulesetSheet = workbook.getWorksheet("Firewall Ruleset");
    const rulesetData = rulesetSheet.getRows(rowRange.min, rowRange.max);
    if (!rulesetData)
      throw new Error("Failed to load Rows in Firewall Ruleset");

    // Initialize updated lists
    this.updatedIpOrNetworkList = ipOrNetworkList;
    this.updatedServiceList = serviceList;

    // Load rules and update Service and IpOrNetwork List
    console.info("Loading Firewall Rules...");
    this.progressBar.start(rulesetData.length, 0);
    try {
      this.load(rulesetData, serverGroups, serviceGroups);
    } finally {
      this.progressBar.stop();
    }

    return {
      ruleList: this.ruleList,
      updatedServiceList: this.updatedServiceList,
      updatedIpOrNetworkList: this.updatedIpOrNetworkList,
    };
  }

  private load(
    rulesetData: ExcelJS.Row[],
    serverGroups: ServerGroup[],
    serviceGroups: ServiceGroup[]
  ) {
    rulesetData.forEach((data, index, array) => {
      this.progressBar.update(index + 1);

      const source = data.getCell(columnNumber.source).value?.toString().trim();
      const destination = data
        .getCell(columnNumber.destination)
        .value?.toString()
        .trim();

      // Skip if name is empty
      if (!source || !destination) {
        return;
      }

      const sourceObject = this.loadSourceOrDestination(source, serverGroups);
      const destinationObject = this.loadSourceOrDestination(
        destination,
        serverGroups
      );

      let portRange: string | number = getCellValueString(
        data,
        columnNumber.portOrMember
      );
      portRange.match("^[1-9][0-9]*$")
        ? (portRange = Number.parseInt(portRange))
        : "";

      const protocol = getCellValueString(data, columnNumber.protocol);
      const serviceOrGroup = this.getServiceOrServiceGroup(
        portRange,
        protocol,
        serviceGroups
      );

      // load simple data
      const date = new Date(getCellValueString(data, columnNumber.date));
      const description = getCellValueString(data, columnNumber.description);

      // read comments
      const protocolStack = this.getComment(data, columnNumber.protocolStack);
      const category = this.getComment(data, columnNumber.category);
      const justification = this.getComment(data, columnNumber.justification);
      const securedBy = this.getComment(data, columnNumber.securedBy);
      const dataClassification = this.getComment(
        data,
        columnNumber.dataClassification
      );

      // create and append rule
      this.ruleList.push(
        new Rule(
          sourceObject,
          destinationObject,
          serviceOrGroup,
          date,
          description,
          protocolStack,
          category,
          justification,
          securedBy,
          dataClassification
        )
      );
    });
  }

  private getComment(data: ExcelJS.Row, column: number) {
    const result = getCellValueString(data, column).split(":")[1];
    return result ? result.trim() : "";
  }

  private loadSourceOrDestination(
    value: string,
    serverGroups: ServerGroup[]
  ): IpOrNetwork | ServerGroup {
    const sg = serverGroups.find((sg) => sg.name === value);

    // check if value is an serverGroup
    // if yes, return serverGroup
    // if not, create and return IpOrNetwork object
    if (sg) {
      return sg;
    }
    return new IpOrNetwork(value);
  }

  private getServiceOrServiceGroup(
    port_range: string | number,
    protocol: string,
    serviceGroupList: ServiceGroup[]
  ): Service | ServiceGroup {
    // if protocol is empty, then ServiceGroup name is defined in port_range
    if (!protocol || protocol === "") {
      const result = serviceGroupList.find(
        (value) => value.name === port_range
      );

      // fail if serviceGroup doesnt exist
      if (!result) {
        throw new Error("ServiceGroup " + port_range + " not found.");
      }
      return result;
    }

    if (protocol === "TCP" || protocol === "UDP" || protocol === "ICMP") {
      // check fi service already exist
      let result: Service | undefined;
      if (protocol === "ICMP") {
        result = this.updatedServiceList.find(
          (value) => value.protocol === protocol
        );
      } else {
        result = this.updatedServiceList.find(
          (value) =>
            value.protocol === protocol && value.port_range == port_range
        );
      }

      // create service if it doesnt exist
      if (!result) {
        result = new Service(protocol, port_range);
        this.updatedServiceList.push(result);
      }

      return result;
    } else {
      throw new Error("Protocol " + protocol + "not valid!");
    }
  }
}
