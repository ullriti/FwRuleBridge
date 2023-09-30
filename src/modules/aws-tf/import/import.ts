import { convertFiles } from "@cdktf/hcl2json";
import { SecurityGroup } from "../model/SecurityGroup";
import { AwsInstance } from "../model/AwsInstance";
import { SecurityGroupRule } from "../model/SecurityGroupRule";

const instanceList: AwsInstance[] = [];
const securityGroupList: SecurityGroup[] = [];
const sgRuleList: SecurityGroupRule[] = [];

export async function loadTfFiles(
  inputDir: string
): Promise<
  [
    instanceList: AwsInstance[],
    SecurityGroupList: SecurityGroup[],
    sgRuleList: SecurityGroupRule[]
  ]
> {
  const json = await convertFiles(inputDir);
  const instances = json["resource"]["aws_instance"];
  const securityGroups = json["resource"]["aws_security_group"];
  const ingressRules = json["resource"]["aws_vpc_security_group_ingress_rule"];
  const egressRules = json["resource"]["aws_vpc_security_group_egress_rule"];

  if (!instances) console.warn("[WARN] no aws_instances found!");
  if (!securityGroups) console.warn("[WARN] no aws_security_group found!");
  if (!ingressRules)
    console.warn("[WARN] no aws_vpc_security_group_ingress_rule found!");
  if (!egressRules)
    console.warn("[WARN] no aws_vpc_security_group_egress_rule found!");

  importSecurityGroups(securityGroups || []);
  importAwsInstances(instances || []);
  importRules("ingress", ingressRules || []);
  importRules("egress", egressRules || []);

  return [instanceList, securityGroupList, sgRuleList];
}

function importSecurityGroups(securityGroups: { [x: string]: any[] }) {
  const keys = Object.keys(securityGroups);
  keys.forEach((key) => {
    const name = key;
    const attributes = securityGroups[key][0];
    const newSG = new SecurityGroup(name, attributes?.tags);
    newSG.name = attributes?.name;
    newSG.description = attributes?.description;
    securityGroupList.push(newSG);
  });
}

function importAwsInstances(instances: { [x: string]: any[] }) {
  const keys = Object.keys(instances);
  keys.forEach((key) => {
    const name = key;
    const attributes = instances[key][0];
    const security_groups = (attributes.security_groups || []).map(
      (value: string) => value.split("{")[1].split("}")[0]
    );
    security_groups.push(
      ...(attributes.vpc_security_group_ids || []).map(
        (value: string) => value.split("{")[1].split("}")[0]
      )
    );
    const newInstance = new AwsInstance(
      name,
      attributes.private_ip,
      security_groups
    );
    instanceList.push(newInstance);
  });
}

function importRules(
  type: "ingress" | "egress",
  rules: { [x: string]: any[] }
) {
  const keys = Object.keys(rules);
  keys.forEach((key) => {
    const name = key;
    const attributes = rules[key][0];
    const security_group_id = attributes.security_group_id;
    const security_group = securityGroupList.find(
      (sg) => sg.ressourceName === security_group_id.split(".")[1]
    );
    if (!security_group)
      throw new Error("Security Group with ID not found: " + security_group_id);

    const protocol = attributes.ip_protocol;
    const tags = attributes.tags || [];

    const newRule = new SecurityGroupRule(
      name,
      type,
      security_group,
      protocol,
      tags
    );

    newRule.cidrIpv4 = attributes?.cidr_ipv4;
    newRule.description = attributes?.description;
    newRule.fromPort = attributes?.from_port;
    newRule.toPort = attributes?.to_port;
    newRule.prefixListId = attributes?.prefix_list_id;
    newRule.referencedSecurityGroupId =
      attributes?.referenced_security_group_id;

    sgRuleList.push(newRule);
  });
}
