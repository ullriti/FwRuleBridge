import * as ExcelJS from "exceljs";
import { ServerGroup } from "../model/serverGroup";
import {
  Servergroups_ColumnNumber as columNumber,
  Servergroups_RowRange as rowRange,
} from "../utils/xlsxTemplate";
import { formatDate2String } from "../utils/helpers";

export function writeServerGroups(
  workbook: ExcelJS.Workbook,
  serverGroupList: ServerGroup[]
) {
  const worksheet: ExcelJS.Worksheet = workbook.getWorksheet("Servergroups");
  let row = rowRange.min; // start after header
  serverGroupList.forEach((value) => {
    // if this is an empty group, then create one line with description
    if (value.members.length === 0) {
      worksheet.getRow(row).getCell(columNumber.servergroupname).value =
        value.name;
      worksheet.getRow(row).getCell(columNumber.action).value = "add";
      worksheet.getRow(row).getCell(columNumber.date).value = formatDate2String(
        new Date()
      );
      worksheet.getRow(row).getCell(columNumber.description).value =
        "EMPTY GROUP!";
      row++;
    }

    value.members.forEach((member) => {
      worksheet.getRow(row).getCell(columNumber.servergroupname).value =
        value.name;
      if (member.member instanceof ServerGroup) {
        worksheet.getRow(row).getCell(columNumber.ipOrNetwork).value = "";
        worksheet.getRow(row).getCell(columNumber.membername).value =
          member.member.name;
      } else {
        worksheet.getRow(row).getCell(columNumber.ipOrNetwork).value =
          member.member.getIp();
        worksheet.getRow(row).getCell(columNumber.membername).value = "";
      }
      worksheet.getRow(row).getCell(columNumber.action).value = "add";
      worksheet.getRow(row).getCell(columNumber.date).value = formatDate2String(
        member.date
      );
      worksheet.getRow(row).getCell(columNumber.description).value =
        member.description;
      row++;
    });
  });
}
