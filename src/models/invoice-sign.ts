import { GenerateQrCode } from '../generate-qr-code';
import { Certificate } from '../helpers/certificate';
import { UblExtension } from '../helpers/ubl-extension';
import { UXML } from '../helpers/uxml';
import { Invoice } from './invoice';

export class InvoiceSign {
  private xmlDom!: UXML;
  private digitalSignature!: string;
  private invoiceHash!: string;

  constructor(private readonly xmlInvoice: string, private readonly certificate: Certificate) {}

  public sign(): Invoice {
    this.xmlDom = UXML.fromString(this.xmlInvoice);

    this.xmlDom.removeByXpath('ext:UBLExtensions');
    this.xmlDom.removeByXpath('cac:Signature');
    this.xmlDom.removeParentByXpath('cac:AdditionalDocumentReference/cbc:ID[.=\'QR\']');

    const canonical = this.xmlDom.asXML();
    this.invoiceHash = Buffer.from(canonical, 'utf8').toString('base64');

    this.digitalSignature = Buffer.from(
      this.certificate.getPrivateKey().sign(Buffer.from(canonical, 'utf8'))
    ).toString('base64');

    const ublExtension = new UblExtension()
      .setCertificate(this.certificate)
      .setInvoiceHash(this.invoiceHash)
      .setDigitalSignature(this.digitalSignature)
      .populateUblSignature();

    const qrCode = GenerateQrCode.fromArray(
      this.xmlDom.toTagsArray(this.certificate, this.invoiceHash, this.digitalSignature)
    ).toBase64();

    const signedInvoice = this.xmlInvoice
      .replace('<cbc:ProfileID>', `<ext:UBLExtensions>${ublExtension}</ext:UBLExtensions>\n    <cbc:ProfileID>`)
      .replace(
        '<cac:AccountingSupplierParty>',
        `${this.getQRNode(qrCode)}\n    <cac:AccountingSupplierParty>`
      );

    return new Invoice(signedInvoice, this.invoiceHash, qrCode, this.certificate);
  }

  private getQRNode(qrCode: string): string {
    return `    <cac:AdditionalDocumentReference>
        <cbc:ID>QR</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${qrCode}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>
    <cac:Signature>
        <cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>
        <cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod>
    </cac:Signature>`;
  }
}
