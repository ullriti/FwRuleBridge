import { isValidIpOrNetwork } from "../utils/validators";

export class IpOrNetwork {
  private ip: string;

  constructor(ip: string) {
    if (!isValidIpOrNetwork(ip)) {
      throw new Error("Value " + ip + " is not a valid IP or Netowrk.");
    }
    this.ip = ip;
  }

  public getIp() {
    return this.ip;
  }
}
