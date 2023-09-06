export class AwsInstance {
  ressourceName: string;
  privateIp: string;
  vpcSecurityGroupIds: string[] = [];

  constructor(
    ressourceName: string,
    privateIp: string,
    vpcSecurityGroupIds: string[]
  ) {
    this.ressourceName = ressourceName;
    this.privateIp = privateIp;
    this.vpcSecurityGroupIds.push(...vpcSecurityGroupIds);
  }
}
