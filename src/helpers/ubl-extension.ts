import { Certificate } from './certificate';
import { UXML } from './uxml';

export class UblExtension {
  private certificate!: Certificate;
  private invoiceHash!: string;
  private digitalSignature!: string;

  public setCertificate(certificate: Certificate): this {
    this.certificate = certificate;
    return this;
  }

  public setInvoiceHash(invoiceHash: string): this {
    this.invoiceHash = invoiceHash;
    return this;
  }

  public setDigitalSignature(digitalSignature: string): this {
    this.digitalSignature = digitalSignature;
    return this;
  }

  public populateUblSignature(): string {
    const signingTime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const xml = UXML.fromString('<ext:UBLExtension xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"></ext:UBLExtension>');

    xml.add('ext:ExtensionURI', 'urn:oasis:names:specification:ubl:dsig:enveloped:xades');
    const content = xml.add('ext:ExtensionContent');
    const signatures = content.add('sig:UBLDocumentSignatures', null, {
      'xmlns:sig': 'urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2',
      'xmlns:sac': 'urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2',
      'xmlns:sbc': 'urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2'
    });

    const signatureInfo = signatures.add('sac:SignatureInformation');
    signatureInfo.add('cbc:ID', 'urn:oasis:names:specification:ubl:signature:1');
    signatureInfo.add('sbc:ReferencedSignatureID', 'urn:oasis:names:specification:ubl:signature:Invoice');

    const signature = signatureInfo.add('ds:Signature', null, {
      'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      Id: 'signature'
    });

    const signedInfo = signature.add('ds:SignedInfo');
    signedInfo.add('ds:CanonicalizationMethod', null, {
      Algorithm: 'http://www.w3.org/2006/12/xml-c14n11'
    });
    signedInfo.add('ds:SignatureMethod', null, {
      Algorithm: 'http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256'
    });

    const reference = signedInfo.add('ds:Reference', null, {
      Id: 'invoiceSignedData',
      URI: ''
    });

    const transforms = reference.add('ds:Transforms');
    transforms.add('ds:Transform', null, {
      Algorithm: 'http://www.w3.org/TR/1999/REC-xpath-19991116'
    }).add('ds:XPath', 'not(//ancestor-or-self::ext:UBLExtensions)');
    transforms.add('ds:Transform', null, {
      Algorithm: 'http://www.w3.org/TR/1999/REC-xpath-19991116'
    }).add('ds:XPath', 'not(//ancestor-or-self::cac:Signature)');
    transforms.add('ds:Transform', null, {
      Algorithm: 'http://www.w3.org/TR/1999/REC-xpath-19991116'
    }).add('ds:XPath', 'not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID=\'QR\'])');
    transforms.add('ds:Transform', null, {
      Algorithm: 'http://www.w3.org/2006/12/xml-c14n11'
    });

    reference.add('ds:DigestMethod', null, {
      Algorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
    });
    reference.add('ds:DigestValue', this.invoiceHash);

    const digestValue = signedInfo.add('ds:Reference', null, {
      Type: 'http://www.w3.org/2000/09/xmldsig#SignatureProperties',
      URI: '#xadesSignedProperties'
    });
    digestValue.add('ds:DigestMethod', null, {
      Algorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
    });
    digestValue.add('ds:DigestValue', this.certificate.getHash());

    signature.add('ds:SignatureValue', this.digitalSignature);

    const keyInfo = signature.add('ds:KeyInfo');
    const x509Data = keyInfo.add('ds:X509Data');
    x509Data.add('ds:X509Certificate', this.certificate.getPlainCertificate());

    const dsObject = signature.add('ds:Object');
    const qualifying = dsObject.add('xades:QualifyingProperties', null, {
      'xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
      Target: 'signature'
    });
    const signedProperties = qualifying
      .add('xades:SignedProperties', null, {
        'xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
        Id: 'xadesSignedProperties'
      })
      .add('xades:SignedSignatureProperties');

    signedProperties.add('xades:SigningTime', signingTime);
    const signingCertificate = signedProperties.add('xades:SigningCertificate');
    const cert = signingCertificate.add('xades:Cert');
    const certDigest = cert.add('xades:CertDigest');
    certDigest.add('ds:DigestMethod', null, {
      Algorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
    });
    certDigest.add('ds:DigestValue', this.certificate.getHash());

    const issuerSerial = cert.add('xades:IssuerSerial');
    issuerSerial.add('ds:X509IssuerName', this.certificate.getFormattedIssuerDN());
    issuerSerial.add('ds:X509SerialNumber', this.certificate.getSerialNumber());

    return xml.asXML();
  }
}
