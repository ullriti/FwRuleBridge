import { WorkBook, WorkSheet } from "xlsx";
import { ServerGroup } from "../model/serverGroup";

export function writeServerGroups(
  workbook: WorkBook,
  serverGroupList: ServerGroup[]
) {
  const worksheet: WorkSheet = workbook.Sheets["Servergroups"];
  let row = 4; // start after header
  serverGroupList.forEach((value) => {
    // if this is an empty group, then create one line with description
    if (value.members.length === 0) {
      worksheet[`B${row}`] = { v: value.name };
      worksheet[`E${row}`] = { v: "add" };
      worksheet[`H${row}`] = { v: new Date().toDateString() };
      worksheet[`I${row}`] = { v: "empty group" };
      row++;
    }

    value.members.forEach((member) => {
      worksheet[`B${row}`] = { v: value.name };
      if (member.member instanceof ServerGroup) {
        worksheet[`C${row}`] = { v: "" };
        worksheet[`D${row}`] = { v: member.member.name };
      } else {
        worksheet[`C${row}`] = { v: member.member.getIp() };
        worksheet[`D${row}`] = { v: "" };
      }
      worksheet[`E${row}`] = { v: "add" };
      worksheet[`H${row}`] = { v: member.date.toDateString() };
      worksheet[`I${row}`] = { v: member.description };
      row++;
    });
  });
}
