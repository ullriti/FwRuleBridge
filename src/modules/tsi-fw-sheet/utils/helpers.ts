export function getColumnValue(row: any, keyword: string) {
  const key = Object.keys(row).find((k) => k.includes(keyword));
  if (key) {
    return row[key];
  } else {
    return undefined;
  }
}

export function getColumnValues(row: any, keyword: string): any[] {
  const keys = Object.keys(row).filter((k) => k.includes(keyword));
  return keys.map((key) => row[key]);
}
