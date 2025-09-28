import { Certificate } from '../helpers/certificate';

export class Invoice {
  constructor(
    private readonly invoice: string,
    private readonly hash: string,
    private readonly qrCode: string,
    private readonly certificate: Certificate
  ) {}

  public getInvoice(): string {
    return this.invoice;
  }

  public getHash(): string {
    return this.hash;
  }

  public getQRCode(): string {
    return this.qrCode;
  }

  public getCertificate(): Certificate {
    return this.certificate;
  }
}
