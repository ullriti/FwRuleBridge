export class Service {
  fromPort: number;
  toPort: number;
  protocol: "TCP" | "UDP" | "ICMP" | "all";
  description: string;

  constructor(
    fromPort: number,
    toPort: number,
    protocol: "TCP" | "UDP" | "ICMP" | "all",
    description: string
  ) {
    this.fromPort = fromPort;
    this.toPort = toPort;
    this.protocol = protocol;
    this.description = description;
  }
}
