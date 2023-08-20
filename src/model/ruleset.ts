import { Rule } from "./rule";

export class Ruleset {
  name: string;
  rules: Rule[];
  tags: { [key: string]: string };

  constructor(name: string, rules: Rule[], tags: { [key: string]: string }) {
    this.name = name;
    this.rules = rules;
    this.tags = tags;
  }
}
