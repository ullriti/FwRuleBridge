import { Application } from "../model/application";
import { WorkBook, utils } from "xlsx";
import { getColumnValue } from "../utils/helpers";

export function loadApplication(workbook: WorkBook) {
  const worksheet = workbook.Sheets["Project Information-Acceptance"];
  const value: string = worksheet[`B8`].v;
  const applicationName = value.split("(")[0].trim();
  const classification = value.split("(")[1].split(")")[0].trim();
  return new Application(applicationName, classification, []);
}
