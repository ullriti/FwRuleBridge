import { SingleBar, Presets } from "cli-progress";
import { WorkBook, utils } from "xlsx";
import { Rule } from "../model/rule";
import { ServerGroup } from "../model/serverGroup";
import { ServiceGroup } from "../model/serviceGroup";
import { getColumnValue, getColumnValues } from "../utils/helpers";
import { IpOrNetwork } from "../model/ipOrNetwork";
import { Service } from "../model/service";

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
    workbook: WorkBook,
    serviceGroups: ServiceGroup[],
    serviceList: Service[],
    serverGroups: ServerGroup[],
    ipOrNetworkList: IpOrNetwork[]
  ): {
    ruleList: Rule[];
    updatedServiceList: Service[];
    updatedIpOrNetworkList: IpOrNetwork[];
  } {
    const rulesetSheet = workbook.Sheets["Firewall Ruleset"];
    const rulesetData = utils.sheet_to_json(rulesetSheet, {
      // remove header line
      range: 2,
    });

    // initialize updated lists
    this.updatedIpOrNetworkList = ipOrNetworkList;
    this.updatedServiceList = serviceList;

    // load rules and update Service and IpOrNetwork List
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
    rulesetData: unknown[],
    serverGroups: ServerGroup[],
    serviceGroups: ServiceGroup[]
  ) {
    rulesetData.forEach((data, index, array) => {
      this.progressBar.update(index + 1);

      // skip if source or destination are not defined
      if (
        getColumnValue(data, "Source") === "" ||
        getColumnValue(data, "Destination") === ""
      ) {
        return;
      }

      // load data and get or create referenced objects
      const source = this.loadSourceOrDestination(
        getColumnValue(data, "Source"),
        serverGroups
      );
      const destination = this.loadSourceOrDestination(
        getColumnValue(data, "Destination"),
        serverGroups
      );
      const service = this.getServiceOrServiceGroup(
        getColumnValue(data, "Port, Port-Range or Servicegroup"),
        getColumnValue(data, "Protocol"),
        serviceGroups
      );

      // load simple data
      const date = new Date(getColumnValue(data, "Date"));
      const description = getColumnValue(data, "Description/Comment");
      const comments = getColumnValues(data, "For your own comments");

      // parse comments
      const protocolStack = comments.find((value) =>
        value.match("^Protocol-Stack:.*")
      );
      const category = comments.find((value) => value.match("^Category:.*"));
      const justification = comments.find((value) =>
        value.match("^Justification:.*")
      );
      const securedBy = comments.find((value) => value.match("^Secured-By:.*"));
      const dataClassification = comments.find((value) =>
        value.match("^Data-Classification:.*")
      );

      // create and append rule
      this.ruleList.push(
        new Rule(
          source,
          destination,
          service,
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
    port_range: string,
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
