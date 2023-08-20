import { HostGroup } from "./hostGroup";
import { Service } from "./service";

export class Rule {
  name: string;
  category: "inbound" | "outbound" | "internal";
  source: HostGroup;
  target: HostGroup;
  service: Service;
  description: string;
  tags: [{ [key: string]: string }];

  constructor(
    name: string,
    category: "inbound" | "outbound" | "internal",
    source: HostGroup,
    target: HostGroup,
    service: Service,
    description: string,
    tags: [{ [key: string]: string }]
  ) {
    this.name = name;
    this.category = category;
    this.source = source;
    this.target = target;
    this.service = service;
    this.description = description;
    this.tags = tags;
  }
}
