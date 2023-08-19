import { WorkBook, WorkSheet } from "xlsx";
import { ServiceGroup } from "../model/serviceGroup";

export function writeServiceGroups(
  workbook: WorkBook,
  serviceGroupList: ServiceGroup[]
) {
  const worksheet: WorkSheet = workbook.Sheets["Servicegroups"];
  let row = 4; // start after header
  serviceGroupList.forEach((value) => {
    // if this is an empty group, then create one line with description
    if (value.members.length === 0) {
      worksheet[`B${row}`] = { v: value.name };
      worksheet[`G${row}`] = { v: "add" };
      worksheet[`J${row}`] = { v: new Date().toDateString() };
      worksheet[`L${row}`] = { v: "empty group" };
      row++;
    }

    value.members.forEach((member) => {
      worksheet[`B${row}`] = { v: value.name };
      if (member.member instanceof ServiceGroup) {
        worksheet[`C${row}`] = { v: "" };
        worksheet[`D${row}`] = { v: "" };
        worksheet[`E${row}`] = { v: member.member.name };
      } else {
        worksheet[`C${row}`] = { v: member.member.port_range };
        worksheet[`D${row}`] = { v: member.member.protocol };
        worksheet[`E${row}`] = { v: "" };
      }
      worksheet[`G${row}`] = { v: "add" };
      worksheet[`J${row}`] = { v: member.date.toDateString() };
      worksheet[`L${row}`] = { v: member.description };
      row++;
    });
  });
}
