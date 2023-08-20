import { Application } from "../model/application";
import * as ExcelJS from "exceljs";
import { ProjectInformationCell } from "../utils/xlsxTemplate";

export function loadApplication(workbook: ExcelJS.Workbook): Application {
  const worksheet = workbook.getWorksheet("Project Information-Acceptance");
  const cellValue = worksheet.getCell(ProjectInformationCell).value;
  if (cellValue) {
    const applicationName = cellValue.toString().split("(")[0].trim();

    // return empty classification if not defined
    if (cellValue.toString().split("(")[1]) {
      const classification = cellValue
        .toString()
        .split("(")[1]
        .split(")")[0]
        .trim();
      return new Application(applicationName, classification, []);
    } else {
      return new Application(applicationName, "", []);
    }
  } else {
    throw new Error(
      "Could not load application informations. Cell B8 contains nothing"
    );
  }
}
