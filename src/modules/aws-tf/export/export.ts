import { AwsInstance } from "../model/AwsInstance";
import { SecurityGroup } from "../model/SecurityGroup";
import { SecurityGroupRule } from "../model/SecurityGroupRule";

export async function writeTfFiles(
  output: string,
  instanceList: AwsInstance[],
  securityGroupList: SecurityGroup[],
  sgRuleList: SecurityGroupRule[]
) {
  console.info("Print Export-Date which should be written to " + output);
  console.info(instanceList);
  console.info(securityGroupList);
  console.info(sgRuleList);
}
