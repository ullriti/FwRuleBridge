import * as ExcelJS from "exceljs";

export function getCellValueString(data: ExcelJS.Row, column: number): string {
  const result = data.getCell(column).value?.toString();
  return result ? result.trim() : "";
}

export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}.${month}.${year}`;
}
