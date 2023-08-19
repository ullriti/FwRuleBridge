import { isValidPortOrPortRange } from "../utils/validators";

export class Service {
  protocol: "TCP" | "UDP" | "ICMP";
  port_range: number | string | undefined;

  constructor(protocol: "TCP" | "UDP" | "ICMP", port_range?: number | string) {
    this.protocol = protocol;

    if (protocol == "ICMP" && port_range) {
      throw new Error("ICMP doesnt allow a port definition");
    }
    if (
      protocol != "ICMP" &&
      (!port_range || !isValidPortOrPortRange(port_range))
    ) {
      throw new Error("Port or Port-Range " + port_range + " is not valid.");
    }

    this.port_range = port_range;
  }
}
