import * as ExcelJS from "exceljs";
import { Rule } from "../model/rule";
import { ServerGroup } from "../model/serverGroup";
import { ServiceGroup } from "../model/serviceGroup";
import { IpOrNetwork } from "../model/ipOrNetwork";
import { Service } from "../model/service";
import {
  Ruleset_ColumnNumber as columNumber,
  Ruleset_RowRange as rowRange,
} from "../utils/xlsxTemplate";
import { formatDate } from "../utils/helpers";

export function writeRuleSet(workbook: ExcelJS.Workbook, ruleset: Rule[]) {
  const worksheet: ExcelJS.Worksheet =
    workbook.getWorksheet("Firewall Ruleset");
  let row = rowRange.min;
  ruleset.forEach((value) => {
    worksheet.getRow(row).getCell(columNumber.source).value = getGroupOrValue(
      value.source
    );
    worksheet.getRow(row).getCell(columNumber.destination).value =
      getGroupOrValue(value.target);
    setService(value.service, row, worksheet);
    worksheet.getRow(row).getCell(columNumber.action).value = "add";
    worksheet.getRow(row).getCell(columNumber.date).value = formatDate(
      value.date
    );
    worksheet.getRow(row).getCell(columNumber.description).value =
      value.description;
    worksheet.getRow(row).getCell(columNumber.protocolStack).value =
      "Protocol-Stack: " + value.protocolStack;
    worksheet.getRow(row).getCell(columNumber.category).value =
      "Category: " + value.category;
    worksheet.getRow(row).getCell(columNumber.justification).value =
      "Justification: " + value.justification;
    worksheet.getRow(row).getCell(columNumber.securedBy).value =
      "Secured-By: " + value.securedBy;
    worksheet.getRow(row).getCell(columNumber.dataClassification).value =
      "Data-Classification: " + value.dataClassification;
    row++;
  });
}

function getGroupOrValue(value: ServerGroup | IpOrNetwork): string {
  if (value instanceof ServerGroup) {
    return value.name;
  }
  return value.getIp();
}

function setService(
  value: Service | ServiceGroup,
  row: number,
  worksheet: ExcelJS.Worksheet
) {
  if (value instanceof ServiceGroup) {
    worksheet.getRow(row).getCell(columNumber.portOrMember).value = value.name;
    worksheet.getRow(row).getCell(columNumber.protocol).value = "";
  } else {
    worksheet.getRow(row).getCell(columNumber.portOrMember).value =
      value.port_range;
    worksheet.getRow(row).getCell(columNumber.protocol).value = value.protocol;
  }
}
