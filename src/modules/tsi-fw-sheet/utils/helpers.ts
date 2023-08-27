import * as ExcelJS from "exceljs";

export function getCellValueString(data: ExcelJS.Row, column: number): string {
  const result = data.getCell(column).value?.toString();
  return result ? result.trim() : "";
}

export function formatDate2String(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${day}.${month}.${year}`;
}

export function parseString2Date(date: string): Date {
  const [day, month, year] = date.split(".");
  return new Date(+year, +month - 1, +day);
}
