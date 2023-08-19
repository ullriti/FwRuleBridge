import { ServiceGroupMember } from "./serviceGroupMember";

export class ServiceGroup {
  name: string;
  members: ServiceGroupMember[];

  public constructor(name: string, members: ServiceGroupMember[]) {
    this.name = name;
    this.members = members;
  }
}
