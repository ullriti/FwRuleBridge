import { SingleBar, Presets } from "cli-progress";
import * as ExcelJS from "exceljs";
import { getCellValueString } from "../utils/helpers";
import { Service } from "../model/service";
import { ServiceGroup } from "../model/serviceGroup";
import {
  Servicegroups_RowRange as rowRange,
  Servicegroups_ColumnNumber as columnNumber,
} from "../utils/xlsxTemplate";
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

  public loadServiceGroups(workbook: ExcelJS.Workbook): {
    serviceGroupList: ServiceGroup[];
    serviceList: Service[];
  } {
    const serviceGroupSheet = workbook.getWorksheet("Servicegroups");
    const serviceGroupsData = serviceGroupSheet.getRows(
      rowRange.min,
      rowRange.max
    );
    if (!serviceGroupsData)
      throw new Error("Failed to load Rows in Servicegroups");

    // Load serviceGroups and Services
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

  private load(serviceGroupsData: ExcelJS.Row[]) {
    serviceGroupsData.forEach((data, index, array) => {
      this.progressBar.update(index + 1);

      const serviceGroupName = data
        .getCell(columnNumber.Servicegroupname)
        .value?.toString();

      // Skip if name is empty
      if (!serviceGroupName) {
        return;
      }

      const name = serviceGroupName.trim();
      const date = new Date(getCellValueString(data, columnNumber.date));
      const description = getCellValueString(data, columnNumber.description);
      const protocol = getCellValueString(data, columnNumber.protocol);
      const port_range = getCellValueString(data, columnNumber.port_range);

      // Ensure ServiceGroup exists
      let serviceGroup = this.serviceGroupList.find(
        (value) => value.name === name
      );
      if (!serviceGroup) {
        serviceGroup = new ServiceGroup(name, []);
        this.serviceGroupList.push(serviceGroup);
      }

      // Ensure Service exists
      if (protocol) {
        let service: Service | undefined;
        if (protocol === "ICMP") {
          service = this.serviceList.find(
            (value) => value.protocol === protocol
          );
        } else if (protocol === "TCP" || protocol === "UDP") {
          service = this.serviceList.find(
            (value) =>
              value.protocol === protocol && value.port_range == port_range
          );
        } else {
          throw new Error(
            "Protocol " +
              protocol +
              " is not a valid protocol. [TCP, UDP, ICMP]"
          );
        }

        if (!service) {
          service = new Service(protocol, port_range);
          this.serviceList.push(service);
        }

        serviceGroup.members.push(
          new ServiceGroupMember(service, date, description)
        );
      }
    });
  }

  private mapNestedGroups(serviceGroupsData: ExcelJS.Row[]) {
    serviceGroupsData.forEach((data, index) => {
      this.progressBar.update(index + 1);

      const memberName = data
        .getCell(columnNumber.membername)
        .value?.toString()
        .trim();

      // Skip if memberName is not defined
      if (!memberName) {
        return;
      }

      // Read serviceGroup name from data
      const serviceGroupName = getCellValueString(
        data,
        columnNumber.Servicegroupname
      );
      const date = new Date(getCellValueString(data, columnNumber.date));
      const description = getCellValueString(data, columnNumber.description);

      // Get serviceGroup from list
      const serviceGroup = this.serviceGroupList.find(
        (value) => value.name === serviceGroupName
      );

      // Fail if serviceGroup doesn't exist
      if (!serviceGroup) {
        throw new Error(
          "Could not find ServiceGroup " +
            serviceGroupName +
            " in serviceGroupList."
        );
      }

      // Get nested group by memberName
      const member = this.serviceGroupList.find((sg) => sg.name === memberName);
      if (!member) {
        throw new Error("ServiceGroup " + memberName + " not defined!");
      }

      // Add group as member
      serviceGroup.members.push(
        new ServiceGroupMember(member, date, description)
      );
    });
  }
}
