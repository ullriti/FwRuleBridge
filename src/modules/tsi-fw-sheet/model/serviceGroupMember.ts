import { Service } from "./service";
import { ServiceGroup } from "./serviceGroup";

export class ServiceGroupMember {
  member: Service | ServiceGroup;
  date: Date;
  description: string;

  constructor(member: Service | ServiceGroup, date: Date, description: string) {
    this.member = member;
    this.date = date;
    this.description = description;
  }
}
