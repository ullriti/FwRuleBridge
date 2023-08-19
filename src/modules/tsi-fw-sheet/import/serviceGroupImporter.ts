import { SingleBar, Presets } from "cli-progress";
import { WorkBook, utils } from "xlsx";
import { getColumnValue } from "../utils/helpers";
import { Service } from "../model/service";
import { ServiceGroup } from "../model/serviceGroup";
import { ServiceGroupMember } from "../model/serviceGroupMember";

export class ServiceGroupImporter {
  private serviceGroupList = new Array<ServiceGroup>();
  private serviceList = new Array<Service>();

  private readonly progressBar = new SingleBar(
    {
      format:
        "[{bar}] {percentage}% | Time: {duration_formatted} | {value}/{total}",
    },
    Presets.shades_classic
  );

  public loadServiceGroups(workbook: WorkBook): {
    serviceGroupList: ServiceGroup[];
    serviceList: Service[];
  } {
    const serviceGroupSheet = workbook.Sheets["Servicegroups"];
    const serviceGroupsData = utils.sheet_to_json(serviceGroupSheet, {
      // ignore header line
      range: 2,
    });

    // load serviceGroups and Services
    console.info("Loading ServiceGroups...");
    this.progressBar.start(serviceGroupsData.length, 0);
    try {
      this.load(serviceGroupsData);
    } finally {
      this.progressBar.stop();
    }

    // Set membername for ServiceGroups after all groups are imported
    console.info("Mapping nested ServiceGroups...");
    this.progressBar.start(serviceGroupsData.length, 0);
    try {
      this.mapNestedGroups(serviceGroupsData);
    } finally {
      this.progressBar.stop();
    }

    return {
      serviceGroupList: this.serviceGroupList,
      serviceList: this.serviceList,
    };
  }

  private load(serviceGroupsData: unknown[]) {
    serviceGroupsData.forEach((data: any, index, array) => {
      this.progressBar.update(index + 1);

      // skip if name is empty
      if (getColumnValue(data, "Servicegroupname") === "") {
        return;
      }

      const name = getColumnValue(data, "Servicegroupname");
      const date = new Date(getColumnValue(data, "Date"));
      const description = getColumnValue(data, "Description");
      const protocol = getColumnValue(data, "Protocol");
      const port_range = getColumnValue(data, "Port or Port-Range");

      // ensure ServiceGroup exists
      let result = this.serviceGroupList.find((value) => value.name === name);
      if (!result) {
        result = new ServiceGroup(name, []);
        this.serviceGroupList.push(result);
      }
      const serviceGroup = result;

      // ensure Service exists
      if (protocol) {
        // create Service if not already present
        let result: Service | undefined;
        if (protocol === "ICMP") {
          result = this.serviceList.find(
            (value) => value.protocol === protocol
          );
        } else {
          result = this.serviceList.find(
            (value) =>
              value.protocol === protocol && value.port_range == port_range
          );
        }

        if (!result) {
          result = new Service(protocol, port_range);
          this.serviceList.push(result);
        }
        const service = result;

        // create relation to ServiceGroup
        serviceGroup.members.push(
          new ServiceGroupMember(service, date, description)
        );
      }
    });
  }

  private mapNestedGroups(serviceGroupsData: unknown[]) {
    serviceGroupsData.forEach((data, index) => {
      this.progressBar.update(index + 1);

      const memberName = getColumnValue(data, "Membername");

      // Skip if memberName is not defined
      if (!memberName) {
        return;
      }

      // read serviceGroup name from data
      const name = getColumnValue(data, "Servicegroupname");
      const date = new Date(getColumnValue(data, "Date"));
      const description = getColumnValue(data, "Description");

      // get serviceGroup from list
      const serviceGroup = this.serviceGroupList.find(
        (value) => value.name === name
      );

      // fail if serviceGroup doesnt exist
      if (!serviceGroup) {
        throw new Error(
          "Could not find ServiceGroup " + name + " in serviceGroupList."
        );
      }

      // get nested group by memberName
      const member = this.serviceGroupList.find((sg) => sg.name === memberName);
      if (!member) {
        throw new Error("ServiceGroup " + memberName + " not defined!");
      }

      // add group as member
      serviceGroup.members.push(
        new ServiceGroupMember(member, date, description)
      );
    });
  }
}
