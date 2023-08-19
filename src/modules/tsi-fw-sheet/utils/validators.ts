export function isValidIpOrNetwork(ip: string): boolean {
  const ipPattern =
    /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)(\/([0-9]|[1-2][0-9]|3[0-2]))?$/;
  return ipPattern.test(ip);
}

export function isValidPortOrPortRange(portRange: string | number): boolean {
  if (typeof portRange === "number") {
    return 0 < portRange && portRange < 65536;
  }
  return /^(\d+)(-\d+)?$/.test(portRange);
}
