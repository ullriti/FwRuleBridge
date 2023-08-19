import { IpOrNetwork } from "./ipOrNetwork";
import { ServerGroup } from "./serverGroup";
import { Service } from "./service";
import { ServiceGroup } from "./serviceGroup";

export class Rule {
  source: IpOrNetwork | ServerGroup;
  target: IpOrNetwork | ServerGroup;
  service: Service | ServiceGroup;

  date: Date;
  description: string;
  protocolStack: string;
  category: string;
  justification: string;
  securedBy: string;
  dataClassification: string;

  constructor(
    source: IpOrNetwork | ServerGroup,
    target: IpOrNetwork | ServerGroup,
    service: Service | ServiceGroup,
    date: Date,
    description: string,
    protocolStack: string,
    category: string,
    justification: string,
    securedBy: string,
    data_classification: string
  ) {
    this.source = source;
    this.target = target;
    this.service = service;
    this.date = date;
    this.description = description;
    this.protocolStack = protocolStack;
    this.category = category;
    this.justification = justification;
    this.securedBy = securedBy;
    this.dataClassification = data_classification;
  }
}
