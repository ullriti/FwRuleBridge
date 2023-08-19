import { WorkBook, WorkSheet } from "xlsx";
import { Rule } from "../model/rule";
import { ServerGroup } from "../model/serverGroup";
import { ServiceGroup } from "../model/serviceGroup";
import { IpOrNetwork } from "../model/ipOrNetwork";
import { Service } from "../model/service";

export function writeRuleSet(workbook: WorkBook, ruleset: Rule[]) {
  const worksheet: WorkSheet = workbook.Sheets["Firewall Ruleset"];
  let row = 4; // start after header
  ruleset.forEach((value) => {
    worksheet[`A${row}`] = { v: getGroupOrValue(value.source) };
    worksheet[`B${row}`] = { v: getGroupOrValue(value.target) };
    setService(value.service, row, worksheet);
    worksheet[`E${row}`] = { v: "add" };
    worksheet[`H${row}`] = { v: value.date.toDateString() };
    worksheet[`J${row}`] = { v: value.description };
    worksheet[`K${row}`] = { v: "Protocol-Stack: " + value.protocolStack };
    worksheet[`L${row}`] = { v: "Category: " + value.category };
    worksheet[`M${row}`] = { v: "Justification: " + value.justification };
    worksheet[`N${row}`] = { v: "Secured-By: " + value.securedBy };
    worksheet[`O${row}`] = {
      v: "Data-Classification: " + value.dataClassification,
    };
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
  worksheet: WorkSheet
) {
  if (value instanceof ServiceGroup) {
    worksheet[`C${row}`] = { v: value.name };
    worksheet[`D${row}`] = { v: "" };
  } else {
    worksheet[`C${row}`] = { v: value.port_range };
    worksheet[`D${row}`] = { v: value.protocol };
  }
}
