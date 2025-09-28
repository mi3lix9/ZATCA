import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import xpath from 'xpath';
import { createHash } from 'node:crypto';
import { Certificate } from './certificate';
import {
  CertificateSignature,
  InvoiceDate,
  InvoiceDigitalSignature,
  InvoiceHash,
  InvoiceTaxAmount,
  InvoiceTotalAmount,
  PublicKey,
  Seller,
  TaxNumber
} from '../tags';
import { Tag } from '../tag';

export class UXML {
  private constructor(private readonly document: Document, private readonly elementNode: Element, private readonly namespaces: Record<string, string>) {}

  public static fromString(xml: string): UXML {
    const parser = new DOMParser({ errorHandler: { warning: () => void 0, error: (msg) => { throw new Error(msg); } } });
    const document = parser.parseFromString(xml, 'text/xml');
    const element = document.documentElement;
    if (!element) {
      throw new Error('Failed to parse XML string');
    }

    const namespaces = UXML.collectNamespaces(element);
    return new UXML(document, element, namespaces);
  }

  private static collectNamespaces(element: Element): Record<string, string> {
    const namespaces: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i += 1) {
      const attr = element.attributes.item(i);
      if (!attr) continue;
      if (attr.name === 'xmlns') {
        namespaces[''] = attr.value;
      } else if (attr.name.startsWith('xmlns:')) {
        namespaces[attr.name.substring(6)] = attr.value;
      }
    }
    return namespaces;
  }

  private evaluate(expression: string): Node[] {
    const evaluator = xpath.useNamespaces(this.namespaces);
    const nodes = evaluator(expression, this.elementNode) as Node[];
    return Array.isArray(nodes) ? nodes : [];
  }

  public getAll(expression: string): UXML[] {
    return this.evaluate(expression)
      .filter((node): node is Element => node.nodeType === 1)
      .map((node) => new UXML(this.document, node, this.namespaces));
  }

  public get(expression: string): UXML | undefined {
    return this.getAll(expression)[0];
  }

  public remove(): void {
    if (this.elementNode.parentNode) {
      this.elementNode.parentNode.removeChild(this.elementNode);
    }
  }

  public removeByXpath(expression: string): this {
    const node = this.get(expression);
    node?.remove();
    return this;
  }

  public removeParentByXpath(expression: string): this {
    const node = this.get(expression);
    if (node?.elementNode.parentNode && node.elementNode.parentNode.nodeType === 1) {
      node.elementNode.parentNode.parentNode?.removeChild(node.elementNode.parentNode);
    }
    return this;
  }

  public add(name: string, value: string | null = null, attrs: Record<string, string> = {}): UXML {
    const [prefix, localName] = name.includes(':') ? name.split(':', 2) : ['', name];
    const namespace = prefix ? this.namespaces[prefix] : undefined;
    const element = namespace
      ? this.document.createElementNS(namespace, name)
      : this.document.createElement(localName);

    if (value !== null) {
      element.textContent = value;
    }

    Object.entries(attrs).forEach(([key, attrValue]) => {
      element.setAttribute(key, attrValue);
    });

    this.elementNode.appendChild(element);
    return new UXML(this.document, element, this.namespaces);
  }

  public element(): Element {
    return this.elementNode;
  }

  public asText(): string {
    return (this.elementNode.textContent ?? '').trim();
  }

  public asXML(): string {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(this.elementNode);
  }

  public clone(): UXML {
    const xml = this.asXML();
    return UXML.fromString(xml);
  }

  public toTagsArray(certificate: Certificate, invoiceHash?: string, digitalSignature?: string): Tag[] {
    const hash = invoiceHash ?? this.getXmlHash();
    const signature = digitalSignature ?? Buffer.from(certificate.getPrivateKey().sign(Buffer.from(hash, 'base64'))).toString('base64');

    const issueDate = this.get('cbc:IssueDate')?.asText() ?? '';
    const issueTimeRaw = this.get('cbc:IssueTime')?.asText() ?? '';
    const issueTime = issueTimeRaw.toUpperCase().includes('Z') ? issueTimeRaw : `${issueTimeRaw}Z`;

    const tags: Tag[] = [
      new Seller(this.get('cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName')?.asText() ?? ''),
      new TaxNumber(this.get('cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cbc:CompanyID')?.asText() ?? ''),
      new InvoiceDate(`${issueDate}T${issueTime}`),
      new InvoiceTotalAmount(this.get('cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount')?.asText() ?? ''),
      new InvoiceTaxAmount(this.get('cac:TaxTotal')?.asText() ?? ''),
      new InvoiceHash(hash),
      new InvoiceDigitalSignature(signature),
      new PublicKey(Buffer.from(certificate.getPlainPublicKey(), 'base64').toString('utf8'))
    ];

    const invoiceTypeNode = this.get('cbc:InvoiceTypeCode');
    const invoiceTypeAttr = invoiceTypeNode?.element().getAttribute('name') ?? '';
    if (invoiceTypeAttr.startsWith('02')) {
      tags.push(new CertificateSignature(certificate.getCertificateSignature()));
    }

    return tags;
  }

  public getXmlHash(): string {
    const clone = this.clone();
    clone.removeByXpath('ext:UBLExtensions');
    clone.removeByXpath('cac:Signature');
    clone.removeParentByXpath('cac:AdditionalDocumentReference/cbc:ID[.=\'QR\']');

    const canonical = clone.asXML();
    const digest = createHash('sha256').update(canonical, 'utf8').digest('base64');
    return digest;
  }
}
