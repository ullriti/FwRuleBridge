export class CidrIpv4 {
  cidrIpv4: string;
  description: string;

  constructor(cidrIpv4: string, description: string) {
    this.cidrIpv4 = this.transformIP2CIDR(cidrIpv4);
    this.description = description;
  }

  private transformIP2CIDR(ip: string): string {
    const ipv4Regex: RegExp =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const cidrRegex: RegExp =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/;

    if (ip.match(ipv4Regex)) {
      return ip + "/32";
    } else if (ip.match(cidrRegex)) {
      return ip;
    } else {
      throw new Error(
        "Value " + ip + " is not a valid IPv4 or matchs CIDR-Notation"
      );
    }
  }
}
