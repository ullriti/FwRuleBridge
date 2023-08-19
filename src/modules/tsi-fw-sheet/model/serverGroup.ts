import { ServerGroupMember } from "./serverGroupMember";

export class ServerGroup {
  name: string;
  members: ServerGroupMember[];

  constructor(name: string, members: ServerGroupMember[]) {
    this.name = name;
    this.members = members;
  }
}
