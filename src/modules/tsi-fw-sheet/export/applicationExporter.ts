import { WorkBook, WorkSheet } from "xlsx";
import { Application } from "../model/application";

export function writeApplication(workbook: WorkBook, application: Application) {
  const worksheet: WorkSheet =
    workbook.Sheets["Project Information-Acceptance"];
  worksheet[`B8`] = {
    v: application.name + " (" + application.classification + ")",
  };
}
