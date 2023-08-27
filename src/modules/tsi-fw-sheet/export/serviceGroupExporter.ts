import * as ExcelJS from "exceljs";
import { ServiceGroup } from "../model/serviceGroup";
import {
  Servicegroups_ColumnNumber as columNumber,
  Servicegroups_RowRange as rowRange,
} from "../utils/xlsxTemplate";
import { formatDate2String } from "../utils/helpers";

export function writeServiceGroups(
  workbook: ExcelJS.Workbook,
  serviceGroupList: ServiceGroup[]
) {
  const worksheet: ExcelJS.Worksheet = workbook.getWorksheet("Servicegroups");
  let row = rowRange.min; // start after header
  serviceGroupList.forEach((value) => {
    // if this is an empty group, then create one line with description
    if (value.members.length === 0) {
      worksheet.getRow(row).getCell(columNumber.servicegroupname).value =
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
      worksheet.getRow(row).getCell(columNumber.servicegroupname).value =
        value.name;
      if (member.member instanceof ServiceGroup) {
        worksheet.getRow(row).getCell(columNumber.port_range).value = "";
        worksheet.getRow(row).getCell(columNumber.protocol).value = "";
        worksheet.getRow(row).getCell(columNumber.membername).value =
          member.member.name;
      } else {
        worksheet.getRow(row).getCell(columNumber.port_range).value =
          member.member.port_range;
        worksheet.getRow(row).getCell(columNumber.protocol).value =
          member.member.protocol;
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
