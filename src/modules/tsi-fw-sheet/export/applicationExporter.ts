import * as ExcelJS from "exceljs";
import { Application } from "../model/application";
import { ProjectInformationCell } from "../utils/xlsxTemplate";

export function writeApplication(
  workbook: ExcelJS.Workbook,
  application: Application
) {
  const worksheet: ExcelJS.Worksheet = workbook.getWorksheet(
    "Project Information-Acceptance"
  );
  const cell = worksheet.getCell(ProjectInformationCell);
  cell.value = application.name + " (" + application.classification + ")";
}
