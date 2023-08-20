import { isValidIpOrNetwork } from "../utils/validators";

export class IpOrNetwork {
  private ip: string;

  constructor(ip: string) {
    if (!ip.includes(".")) ip = this.transformNumber2Ip(ip);
    if (!isValidIpOrNetwork(ip)) {
      throw new Error("Value " + ip + " is not a valid IP or Netowrk.");
    }
    this.ip = ip;
  }

  public getIp() {
    return this.ip;
  }

  private transformNumber2Ip(ip: string): string {
    let ipNumber = Number.parseInt(ip);
    const octet4 = ipNumber % 1000;
    ipNumber = Math.floor(ipNumber / 1000);
    const octet3 = ipNumber % 1000;
    ipNumber = Math.floor(ipNumber / 1000);
    const octet2 = ipNumber % 1000;
    ipNumber = Math.floor(ipNumber / 1000);
    const octet1 = ipNumber % 1000;

    return octet1 + "." + octet2 + "." + octet3 + "." + octet4;
  }
}
