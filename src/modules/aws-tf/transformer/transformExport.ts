import { CidrIpv4 as fwRuleBridgeCidrIpv4 } from "../../../model/cidrIpv4";
import { HostGroup as fwRuleBridgeHostGroup } from "../../../model/hostGroup";
import { Rule as fwRuleBridgeRule } from "../../../model/rule";
import { Ruleset as fwRuleBridgeRuleset } from "../../../model/ruleset";
import { Service as fwRuleBridgeService } from "../../../model/service";
import { AwsInstance } from "../model/AwsInstance";
import { SecurityGroup } from "../model/SecurityGroup";
import { SecurityGroupRule } from "../model/SecurityGroupRule";

const instanceList: AwsInstance[] = [];
const securityGroupList: SecurityGroup[] = [];
const sgRuleList: SecurityGroupRule[] = [];

export function transform(ruleset: fwRuleBridgeRuleset): {
  instanceList: AwsInstance[];
  securityGroupList: SecurityGroup[];
  sgRuleList: SecurityGroupRule[];
} {
  const rules = ruleset.rules;

  // alle Regeln nacheinander laden und anhand der Regeln die Listen erstellen
  // Application Name und Classification als Tags schreiben
  // AWS Instance Ressource Namen stehen in der CIDR Description
  // Host-Group Namen === Security-Group Name
  // Validierung das nicht zu viele Security-Groupen pro Host definiert werden

  return {
    instanceList: instanceList,
    securityGroupList: securityGroupList,
    sgRuleList: sgRuleList,
  };
}
