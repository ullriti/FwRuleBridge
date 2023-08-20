import { CidrIpv4 } from "./cidrIpv4";

export class HostGroup {
  name: string;
  external: boolean;
  members: (CidrIpv4 | HostGroup)[];
  tags: [{ [key: string]: string }];

  constructor(
    name: string,
    external: boolean,
    members: (HostGroup | CidrIpv4)[],
    tags: [{ [key: string]: string }]
  ) {
    this.name = name;
    this.external = external;
    this.members = members;
    this.tags = tags;
  }
}
