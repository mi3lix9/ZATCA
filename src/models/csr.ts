export class CSR {
  constructor(private readonly csrContent: string, private readonly privateKey: string) {}

  public getCsrContent(): string {
    return this.csrContent;
  }

  public getPrivateKey(): string {
    return this.privateKey;
  }
}
