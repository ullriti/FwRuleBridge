import { Ruleset } from "../../../model/ruleset";
import { Application } from "../model/application";
import { Rule } from "../model/rule";

export function transform(application: Application): Ruleset {
  return new Ruleset();
}
