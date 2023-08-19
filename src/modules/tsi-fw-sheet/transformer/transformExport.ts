import { Ruleset } from "../../../model/ruleset";
import { Application } from "../model/application";
import { ServerGroup } from "../model/serverGroup";
import { ServiceGroup } from "../model/serviceGroup";

export function transform(ruleset: Ruleset): {
  application: Application;
  serviceGroups: ServiceGroup[];
  serverGroups: ServerGroup[];
} {
  return {
    application: new Application("", "", []),
    serviceGroups: [],
    serverGroups: [],
  };
}
