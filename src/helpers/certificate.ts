import { createHash, createPrivateKey, KeyObject, sign as signData, X509Certificate } from 'node:crypto';

function normalisePem(value: string, type: 'CERTIFICATE' | 'PRIVATE KEY'): string {
  if (value.includes('-----BEGIN')) {
    return value;
  }

  const lines = value.match(/.{1,64}/g) ?? [];
  return [`-----BEGIN ${type}-----`, ...lines, `-----END ${type}-----`].join('\n');
}

export class Certificate {
  private readonly plainCertificate: string;
  private readonly certificate: X509Certificate;
  private readonly privateKey: KeyObject;
  private secretKey?: string;

  constructor(certificate: string, privateKey: string) {
    this.plainCertificate = certificate.replace(/\r?\n/g, '');
    this.certificate = new X509Certificate(normalisePem(certificate, 'CERTIFICATE'));
    this.privateKey = createPrivateKey(normalisePem(privateKey, 'PRIVATE KEY'));
  }

  public getPlainCertificate(): string {
    return this.plainCertificate;
  }

  public getCertificate(): X509Certificate {
    return this.certificate;
  }

  public setSecretKey(secret: string | undefined): this {
    this.secretKey = secret;
    return this;
  }

  public getSecretKey(): string | undefined {
    return this.secretKey;
  }

  public getAuthorizationHeader(): string {
    if (!this.secretKey) {
      throw new Error('Secret key is not set.');
    }

    const token = Buffer.from(
      `${Buffer.from(this.getPlainCertificate(), 'utf8').toString('base64')}:${this.secretKey}`,
      'utf8'
    ).toString('base64');

    return `Basic ${token}`;
  }

  public getHash(): string {
    const digest = createHash('sha256').update(this.plainCertificate, 'utf8').digest('base64');
    return digest;
  }

  public getPrivateKey(): { sign: (data: Buffer) => Buffer } {
    return {
      sign: (data: Buffer) => signData('sha256', data, this.privateKey)
    };
  }

  public getPlainPublicKey(): string {
    const pem = this.certificate.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    return pem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\r?\n/g, '');
  }

  public getCertificateSignature(): string {
    const signature = this.certificate.signature;
    return signature.subarray(1).toString('base64');
  }

  public getFormattedIssuerDN(): string {
    const issuer = this.certificate.issuer
      .split(',')
      .map((part) => part.trim().replace('0.9.2342.19200300.100.1.25', 'DC'))
      .reverse();
    return issuer.join(', ');
  }

  public getSerialNumber(): string {
    const hex = this.certificate.serialNumber;
    return BigInt(`0x${hex}`).toString();
  }

  public getSignatureAlgorithm(): string {
    return this.certificate.signatureAlgorithm;
  }
}
