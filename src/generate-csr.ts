import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CSR } from './models/csr';
import { CSRRequest } from './models/csr-request';

export class GenerateCSR {
  private static readonly OPENSSL_CONFIG_TEMPLATE = `# ------------------------------------------------------------------
# Default section for "req" command options -
# ------------------------------------------------------------------
[req]
prompt = no
utf8 = no
distinguished_name = dn
req_extensions = v3_req

[ dn ]

[ v3_req ]
1.3.6.1.4.1.311.20.2 = ASN1:UTF8String:TSTZATCA-Code-Signing
subjectAltName=dirName:subject

[ subject ]
`;

  private readonly data: ReturnType<CSRRequest['toArray']>;
  private tempDir!: string;
  private configPath!: string;

  private constructor(private readonly request: CSRRequest) {
    this.data = request.toArray();
  }

  public static fromRequest(request: CSRRequest): GenerateCSR {
    return new GenerateCSR(request);
  }

  public initialize(): this {
    this.tempDir = mkdtempSync(join(tmpdir(), 'zatca-openssl-'));
    this.configPath = join(this.tempDir, 'csr.conf');

    let config = GenerateCSR.OPENSSL_CONFIG_TEMPLATE;
    if (this.request.isSimulationEnv()) {
      config = config.replace('ASN1:UTF8String:TSTZATCA-Code-Signing', 'ASN1:PRINTABLESTRING:PREZATCA-Code-Signing');
    } else if (this.request.isProduction()) {
      config = config.replace('ASN1:UTF8String:TSTZATCA-Code-Signing', 'ASN1:PRINTABLESTRING:ZATCA-Code-Signing');
    }

    const subjectBlock = Object.entries(this.data.subject)
      .map(([key, value]) => `${key} = ${value}`)
      .join('\n');

    writeFileSync(this.configPath, `${config}\n${subjectBlock}\n`, 'utf8');
    return this;
  }

  public generate(): CSR {
    const keyPath = join(this.tempDir, 'private-key.pem');
    const csrPath = join(this.tempDir, 'request.csr');

    const dn = this.data.dn;
    const subj = `/CN=${dn.CN}/O=${dn.organizationName}/OU=${dn.organizationalUnitName}/C=${dn.C}`;

    try {
      execFileSync(
        'openssl',
        [
          'req',
          '-new',
          '-newkey',
          'ec',
          '-pkeyopt',
          'ec_paramgen_curve:secp256k1',
          '-pkeyopt',
          'ec_param_enc:named_curve',
          '-sha256',
          '-nodes',
          '-config',
          this.configPath,
          '-subj',
          subj,
          '-keyout',
          keyPath,
          '-out',
          csrPath
        ],
        { stdio: 'ignore' }
      );
    } catch (error) {
      throw new Error('Error generating CSR: ensure OpenSSL is installed.');
    }

    const csr = readFileSync(csrPath, 'utf8');
    const privateKey = readFileSync(keyPath, 'utf8');

    this.cleanup();

    return new CSR(csr, privateKey);
  }

  private cleanup(): void {
    if (!this.tempDir) {
      return;
    }

    try {
      rmSync(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      // ignore cleanup errors
    }
  }
}
