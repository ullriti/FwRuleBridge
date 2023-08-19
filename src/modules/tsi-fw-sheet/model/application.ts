import { Rule } from "./rule";

export class Application {
  name: string;
  classification: string;
  ruleset: Rule[];

  constructor(name: string, classification: string, ruleset: Rule[]) {
    this.name = name;
    this.classification = classification;
    this.ruleset = ruleset;
  }
}
