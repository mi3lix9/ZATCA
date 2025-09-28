import { createPrivateKey, createPublicKey } from 'node:crypto';

import forge from 'node-forge';
import { describe, expect, it } from 'vitest';

import { CSRRequest, GenerateCSR } from '../../src';

const COMMON_NAME = 'Salla';
const COUNTRY = 'SA';
const ORGANIZATION = 'Salla Store';
const ORGANIZATIONAL_UNIT = '3311111111';

describe('GenerateCSR', () => {
  it('creates a valid CSR with the expected metadata', () => {
    const request = CSRRequest.make()
      .setUID('311111111101113')
      .setSerialNumber('200000', 'Salla Store', 'Merchant Name')
      .setCommonName(COMMON_NAME)
      .setCountryName(COUNTRY)
      .setOrganizationName(ORGANIZATION)
      .setOrganizationalUnitName(ORGANIZATIONAL_UNIT)
      .setRegisteredAddress('3355  - حي الملك فهد مكة المكرمة 24347 - 7192')
      .setInvoiceType(true, true)
      .setCurrentZatcaEnv('sandbox')
      .setBusinessCategory('company');

    const csr = GenerateCSR.fromRequest(request).initialize().generate();

    expect(csr.getCsrContent()).toContain('BEGIN CERTIFICATE REQUEST');
    expect(csr.getPrivateKey()).toContain('BEGIN EC PRIVATE KEY');

    const csrObject = forge.pki.certificationRequestFromPem(csr.getCsrContent());
    expect(csrObject.verify()).toBe(true);

    const subject = csrObject.subject.attributes.reduce<Record<string, string>>((carry, attribute) => {
      carry[attribute.shortName ?? attribute.name] = attribute.value;
      return carry;
    }, {});

    expect(subject.CN).toBe(COMMON_NAME);
    expect(subject.O).toBe(ORGANIZATION);
    expect(subject.OU).toBe(ORGANIZATIONAL_UNIT);
    expect(subject.C).toBe(COUNTRY);

    const signatureAlgorithm = forge.pki.oids[csrObject.signatureOid];
    expect(signatureAlgorithm).toBe('ecdsa-with-SHA256');

    const csrPublicKey = forge.pki.publicKeyToPem(csrObject.publicKey);
    const derivedPublicKey = createPublicKey(createPrivateKey(csr.getPrivateKey()))
      .export({ type: 'spki', format: 'pem' })
      .toString();

    const normalise = (pem: string) =>
      pem.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '').replace(/\s+/g, '');

    expect(normalise(csrPublicKey)).toBe(normalise(derivedPublicKey));
  });
});
