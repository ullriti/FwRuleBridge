import { ServerGroup } from "./serverGroup";
import { IpOrNetwork } from "./ipOrNetwork";

export class ServerGroupMember {
  member: IpOrNetwork | ServerGroup;
  date: Date;
  description: string;

  constructor(
    member: IpOrNetwork | ServerGroup,
    date: Date,
    description: string
  ) {
    this.member = member;
    this.date = date;
    this.description = description;
  }
}
