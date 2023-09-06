export class SecurityGroup {
  ressourceName: string;

  name?: string;
  description?: string;

  tags: { [key: string]: string } = {};

  constructor(ressourceName: string, tags: { [key: string]: string }) {
    this.ressourceName = ressourceName;
    this.tags = tags;
  }
}
