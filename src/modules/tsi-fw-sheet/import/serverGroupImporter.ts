import { SingleBar, Presets } from "cli-progress";
import * as ExcelJS from "exceljs";
import { ServerGroup } from "../model/serverGroup";
import { getCellValueString } from "../utils/helpers";
import { IpOrNetwork } from "../model/ipOrNetwork";
import {
  Servergroups_RowRange as rowRange,
  Servergroups_ColumnNumber as columnNumber,
} from "../utils/xlsxTemplate";
import { ServerGroupMember } from "../model/serverGroupMember";
import { equal } from "assert";

export class ServerGroupImporter {
  private serverGroupList = new Array<ServerGroup>();
  private ipOrNetworkList = new Array<IpOrNetwork>();

  private readonly progressBar = new SingleBar(
    {
      format:
        "[{bar}] {percentage}% | Time: {duration_formatted} | {value}/{total}",
    },
    Presets.shades_classic
  );

  public loadServerGroups(workbook: ExcelJS.Workbook): {
    serverGroupList: ServerGroup[];
    ipOrNetowrkList: IpOrNetwork[];
  } {
    const serverGroupSheet = workbook.getWorksheet("Servergroups");
    const serverGroupsData = serverGroupSheet.getRows(
      rowRange.min,
      rowRange.max
    );
    if (!serverGroupsData)
      throw new Error("Failed to load Rows in Servergroups");

    // Load serverGroups and IPorNetworks
    console.info("Loading ServerGroups...");
    this.progressBar.start(serverGroupsData.length, 0);
    try {
      this.load(serverGroupsData);
    } finally {
      this.progressBar.stop();
    }

    // Set membername for ServerGroups after all groups are imported
    console.info("Mapping nested ServerGroups...");
    this.progressBar.start(serverGroupsData.length, 0);
    try {
      this.mapNestedGroups(serverGroupsData);
    } finally {
      this.progressBar.stop();
    }

    return {
      serverGroupList: this.serverGroupList,
      ipOrNetowrkList: this.ipOrNetworkList,
    };
  }

  private load(serverGroupsData: ExcelJS.Row[]) {
    serverGroupsData.forEach((data, index, array) => {
      this.progressBar.update(index + 1);

      const servergroupName = data
        .getCell(columnNumber.servergroupname)
        .value?.toString()
        .trim();

      // skip if name is empty
      if (!servergroupName) {
        return;
      }

      const name = servergroupName;
      const date = new Date(getCellValueString(data, columnNumber.date));
      const description = getCellValueString(data, columnNumber.description);

      // Ensure ServerGroup exists
      let serverGroup = this.serverGroupList.find(
        (value) => value.name === name
      );
      if (!serverGroup) {
        serverGroup = new ServerGroup(name, []);
        this.serverGroupList.push(serverGroup);
      }

      // If IpOrNetwork is defined, then create or set IpOrNetwork
      // and create relation to ServerGroup
      const ip = getCellValueString(data, columnNumber.ipOrNetwork);
      const action = getCellValueString(data, columnNumber.action);
      if (ip) {
        const index1 = this.ipOrNetworkList.findIndex(
          (value) => value.getIp() === ip
        );
        let ipOrNetwork: IpOrNetwork;

        if (action === "remove" && !index1) {
          throw new Error(
            "Should remove ServerGroup entry but doesnt exist: " +
              ip +
              "in group " +
              serverGroup.name
          );
        }

        if (index1 === -1) {
          ipOrNetwork = new IpOrNetwork(ip);
          this.ipOrNetworkList.push(ipOrNetwork);
        } else if (action === "remove") {
          // remove as member of the servergroup
          const index2 = serverGroup.members.findIndex(
            (member) => member.member === ipOrNetwork
          );
          serverGroup.members.splice(index2, 1);
          return;
        } else {
          ipOrNetwork = this.ipOrNetworkList[index1];
        }

        // add member if not exist
        const test = serverGroup.members.find(
          (member) => member.member === ipOrNetwork
        );
        if (test) {
          return;
        } else {
          serverGroup.members.push(
            new ServerGroupMember(ipOrNetwork, date, description)
          );
        }
      }
    });
  }

  private mapNestedGroups(serverGroupsData: ExcelJS.Row[]) {
    serverGroupsData.forEach((data, index) => {
      this.progressBar.update(index + 1);

      const memberName = data
        .getCell(columnNumber.membername)
        .value?.toString()
        .trim();

      // Skip if memberName is not defined
      if (!memberName) {
        return;
      }

      // Read serverGroup name from data
      const servergroupName = getCellValueString(
        data,
        columnNumber.servergroupname
      );
      const date = new Date(getCellValueString(data, columnNumber.date));
      const description = getCellValueString(data, columnNumber.description);
      const action = getCellValueString(data, columnNumber.action);

      // Get serverGroup and index from list
      const serverGroup = this.serverGroupList.find(
        (value) => value.name === servergroupName
      );

      // Fail if serverGroup doesn't exist
      if (!serverGroup) {
        throw new Error(
          "Could not find ServerGroup " +
            servergroupName +
            " in serverGroupList."
        );
      }

      // Get nested group by memberName
      const member = this.serverGroupList.find((sg) => sg.name === memberName);
      if (!member) {
        throw new Error("ServerGroup " + memberName + " not defined!");
      }

      // remove member from group
      if (action === "remove") {
        const memberIndex = serverGroup.members.findIndex(
          (sg) =>
            sg.member instanceof ServerGroup && sg.member.name === memberName
        );
        serverGroup.members.splice(memberIndex, 1);
        return;
      }

      // add member if not exist
      if (!serverGroup.members.find((entry) => entry.member === member)) {
        serverGroup.members.push(
          new ServerGroupMember(member, date, description)
        );
      }
    });
  }
}
