# ZATCA TypeScript Toolkit

A TypeScript implementation of the utilities required to work with the ZATCA (Fatoora) e-invoicing mandate. The library exposes helpers for generating TLV-based QR codes, preparing certificate signing requests (CSR), and scaffolding invoice signatures.

## Installation

```bash
npm install zatca-ts
```

## Usage

### QR Code generation

```ts
import { GenerateQrCode, Tag, Tags } from 'zatca-ts';

const payload = GenerateQrCode.fromArray([
  new Tags.Seller('Salla'),
  new Tags.TaxNumber('1234567891'),
  new Tags.InvoiceDate('2021-07-12T14:25:09Z'),
  new Tags.InvoiceTotalAmount('100.00'),
  new Tags.InvoiceTaxAmount('15.00')
]);

const base64 = payload.toBase64();
const dataUrl = await payload.render();
```

### CSR generation

```ts
import { CSRRequest, GenerateCSR } from 'zatca-ts';

const request = CSRRequest.make()
  .setUID('311111111101113')
  .setSerialNumber('200000', 'Salla Store', 'Merchant Name')
  .setCommonName('Salla')
  .setCountryName('SA')
  .setOrganizationName('Salla Store')
  .setOrganizationalUnitName('3311111111')
  .setRegisteredAddress('3355  - حي الملك فهد مكة المكرمة 24347 - 7192')
  .setInvoiceType(true, true)
  .setCurrentZatcaEnv('sandbox')
  .setBusinessCategory('company');

const csr = GenerateCSR.fromRequest(request).initialize().generate();
console.log(csr.getCsrContent());
console.log(csr.getPrivateKey());
```

### Invoice signing scaffold

```ts
import { Certificate, InvoiceSign } from 'zatca-ts';

const xmlInvoice = '<Invoice>...</Invoice>';
const certificate = new Certificate('CERTIFICATE_IN_BASE64', 'PRIVATE_KEY_IN_BASE64');

const signed = new InvoiceSign(xmlInvoice, certificate).sign();
console.log(signed.getInvoice());
console.log(signed.getHash());
console.log(signed.getQRCode());
```

## Building

```bash
npm run build
```

This compiles the TypeScript sources to the `dist/` directory.

## License

This project is released under the MIT License.
