import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { Certificate, InvoiceSign } from '../../src';

const CERTIFICATE =
  'MIID3jCCA4SgAwIBAgITEQAAOAPF90Ajs/xcXwABAAA4AzAKBggqhkjOPQQDAjBiMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxEzARBgoJkiaJk/IsZAEZFgNnb3YxFzAVBgoJkiaJk/IsZAEZFgdleHRnYXp0MRswGQYDVQQDExJQUlpFSU5WT0lDRVNDQTQtQ0EwHhcNMjQwMTExMDkxOTMwWhcNMjkwMTA5MDkxOTMwWjB1MQswCQYDVQQGEwJTQTEmMCQGA1UEChMdTWF4aW11bSBTcGVlZCBUZWNoIFN1cHBseSBMVEQxFjAUBgNVBAsTDVJpeWFkaCBCcmFuY2gxJjAkBgNVBAMTHVRTVC04ODY0MzExNDUtMzk5OTk5OTk5OTAwMDAzMFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEoWCKa0Sa9FIErTOv0uAkC1VIKXxU9nPpx2vlf4yhMejy8c02XJblDq7tPydo8mq0ahOMmNo8gwni7Xt1KT9UeKOCAgcwggIDMIGtBgNVHREEgaUwgaKkgZ8wgZwxOzA5BgNVBAQMMjEtVFNUfDItVFNUfDMtZWQyMmYxZDgtZTZhMi0xMTE4LTliNTgtZDlhOGYxMWU0NDVmMR8wHQYKCZImiZPyLGQBAQwPMzk5OTk5OTk5OTAwMDAzMQ0wCwYDVQQMDAQxMTAwMREwDwYDVQQaDAhSUlJEMjkyOTEaMBgGA1UEPwwRU3VwcGx5IGFjdGl2aXRpZXMwHQYDVR0OBBYEFEX+YvmmtnYoDf9BGbKo7ocTKYK1MB8GA1UdIwQYMBaAFJvKqqLtmqwskIFzVvpP2PxT+9NnMHsGCCsGAQUFBwEBBG8wbTBrBggrBgEFBQcwAoZfaHR0cDovL2FpYTQuemF0Y2EuZ292LnNhL0NlcnRFbnJvbGwvUFJaRUludm9pY2VTQ0E0LmV4dGdhenQuZ292LmxvY2FsX1BSWkVJTlZPSUNFU0NBNC1DQSgxKS5jcnQwDgYDVR0PAQH/BAQDAgeAMDwGCSsGAQQBgjcVBwQvMC0GJSsGAQQBgjcVCIGGqB2E0PsShu2dJIfO+xnTwFVmh/qlZYXZhD4CAWQCARIwHQYDVR0lBBYwFAYIKwYBBQUHAwMGCCsGAQUFBwMCMCcGCSsGAQQBgjcVCgQaMBgwCgYIKwYBBQUHAwMwCgYIKwYBBQUHAwIwCgYIKoZIzj0EAwIDSAAwRQIhALE/ichmnWXCUKUbca3yci8oqwaLvFdHVjQrveI9uqAbAiA9hC4M8jgMBADPSzmd2uiPJA6gKR3LE03U75eqbC/rXA==';
const PRIVATE_KEY =
  'MHQCAQEEIP0tXvA0mhzTBgjZaAGt+V3tWIr79nG/gs56jKFJb6gboAcGBSuBBAAKoUQDQgAE+39UxFUCaF5p51RTvwXL+YODEpITlTdI27S72pSPJEAjQs2jBb1sLS/xg8/y5555+d19KoLmLo6gMrxvINXaHw==';
const SERIAL_NUMBER = '379112742831380471835263969587287663520528387';

describe('Certificate helper', () => {
  it('parses certificate metadata correctly', () => {
    const certificate = new Certificate(CERTIFICATE, PRIVATE_KEY);
    const x509 = certificate.getCertificate();

    expect(certificate.getSerialNumber()).toBe(SERIAL_NUMBER);
    expect(certificate.getSignatureAlgorithm()).toBe('ecdsa-with-SHA256');
    expect(certificate.getFormattedIssuerDN()).toContain('CN=PRZEINVOICESCA4-CA');

    const now = Date.now();
    expect(now).toBeGreaterThanOrEqual(new Date(x509.validFrom).getTime());
    expect(now).toBeLessThan(new Date(x509.validTo).getTime());
  });
});

describe('Invoice signing', () => {
  it('embeds the signing artefacts back into the XML invoice', () => {
    const xmlInvoice = readFileSync(join(__dirname, 'files/simplified_invoice.xml'), 'utf8');

    const signInfo = new InvoiceSign(xmlInvoice, new Certificate(CERTIFICATE, PRIVATE_KEY)).sign();

    expect(signInfo.getInvoice()).toContain(signInfo.getHash());
    expect(signInfo.getInvoice()).toContain(signInfo.getQRCode());

    const signedCertificate = signInfo.getCertificate();
    expect(signInfo.getInvoice()).toContain(signedCertificate.getPlainCertificate());
    expect(signInfo.getInvoice()).toContain(signedCertificate.getHash());
  });
});
