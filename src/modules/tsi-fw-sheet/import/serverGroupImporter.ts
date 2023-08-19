import { SingleBar, Presets } from "cli-progress";
import { WorkBook, utils } from "xlsx";
import { ServerGroup } from "../model/serverGroup";
import { getColumnValue } from "../utils/helpers";
import { IpOrNetwork } from "../model/ipOrNetwork";
import { ServerGroupMember } from "../model/serverGroupMember";

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

  public loadServerGroups(workbook: WorkBook): {
    serverGroupList: ServerGroup[];
    ipOrNetowrkList: IpOrNetwork[];
  } {
    const serverGroupSheet = workbook.Sheets["Servergroups"];
    const serverGroupsData = utils.sheet_to_json(serverGroupSheet, {
      // ignore header line
      range: 2,
    });

    // load serverGroups and IPorNetworks
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

  private load(serverGroupsData: unknown[]) {
    serverGroupsData.forEach((data: any, index, array) => {
      this.progressBar.update(index + 1);

      // skip if name is empty
      if (getColumnValue(data, "Servergroupname") === "") {
        return;
      }

      const name = getColumnValue(data, "Servergroupname");
      const date = new Date(getColumnValue(data, "Date"));
      const description = getColumnValue(data, "Description");

      // ensure ServerGroup exists
      let result = this.serverGroupList.find((value) => value.name === name);
      if (!result) {
        result = new ServerGroup(name, []);
        this.serverGroupList.push(result);
      }
      const serverGroup = result;

      // if IpOrNetowrk is defined, then create or set IpOrNetwork
      // and create relation to ServerGroup
      const ip = getColumnValue(data, "IP-Address or IP-Network");
      if (ip) {
        // create IpOrNetwork if not already present
        let result = this.ipOrNetworkList.find((value) => value.getIp() === ip);

        if (!result) {
          result = new IpOrNetwork(ip);
          this.ipOrNetworkList.push(result);
        }
        const ipOrNetwork = result;

        // create relation to ServerGroup
        serverGroup.members.push(
          new ServerGroupMember(ipOrNetwork, date, description)
        );
      }
    });
  }

  private mapNestedGroups(serverGroupsData: unknown[]) {
    serverGroupsData.forEach((data, index) => {
      this.progressBar.update(index + 1);

      const memberName = getColumnValue(data, "Membername");

      // Skip if memberName is not defined
      if (!memberName) {
        return;
      }

      // read serverGroup name from data
      const name = getColumnValue(data, "Servergroupname");
      const date = new Date(getColumnValue(data, "Date"));
      const description = getColumnValue(data, "Description");

      // get serverGroup from list
      const serverGroup = this.serverGroupList.find(
        (value) => value.name === name
      );

      // fail if serverGroup doesnt exist
      if (!serverGroup) {
        throw new Error(
          "Could not find ServerGroup " + name + " in serverGroupList."
        );
      }

      // get nested group by memberName
      const member = this.serverGroupList.find((sg) => sg.name === memberName);
      if (!member) {
        throw new Error("ServerGroup " + memberName + " not defined!");
      }

      // add group as member
      serverGroup.members.push(
        new ServerGroupMember(member, date, description)
      );
    });
  }
}
