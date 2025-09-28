import { z } from 'zod';

const UID_SCHEMA = z
  .string()
  .length(15, 'The Organization Identifier must be 15 digits, starting and ending with 3 ')
  .refine((value) => value.startsWith('3') && value.endsWith('3'), {
    message: 'The Organization Identifier must be 15 digits, starting and ending with 3 '
  });

const COUNTRY_SCHEMA = z
  .string()
  .length(2, 'The Country name must be two characters only');

const ENVIRONMENTS = ['sandbox', 'simulation', 'production'] as const;

export type ZatcaEnvironment = (typeof ENVIRONMENTS)[number];

export class CSRRequest {
  public static readonly SANDBOX: ZatcaEnvironment = 'sandbox';
  public static readonly SIMULATION: ZatcaEnvironment = 'simulation';
  public static readonly PRODUCTION: ZatcaEnvironment = 'production';

  private serialNumber!: string;
  private invoiceType = '1100';
  private commonName!: string;
  private organizationName!: string;
  private organizationalUnitName!: string;
  private countryName!: string;
  private uid!: string;
  private registeredAddress!: string;
  private businessCategory = 'company';
  private currentEnv: ZatcaEnvironment = CSRRequest.SANDBOX;

  public static make(): CSRRequest {
    return new CSRRequest();
  }

  public setSerialNumber(solutionName: string, version: string, serialNumber: string): this {
    this.serialNumber = `1-${solutionName}|2-${version}|3-${serialNumber}`;
    return this;
  }

  public setInvoiceType(taxInvoice: boolean, simplified: boolean): this {
    this.invoiceType = `${Number(taxInvoice)}${Number(simplified)}00`;
    return this;
  }

  public setCommonName(value: string): this {
    this.commonName = value;
    return this;
  }

  public setOrganizationName(value: string): this {
    this.organizationName = value;
    return this;
  }

  public setOrganizationalUnitName(value: string): this {
    if (this.uid && this.uid[10] === '1' && value.length !== 10) {
      throw new Error('The Organization Unit Name must be 10 digits when UID 11th digit equals 1');
    }

    this.organizationalUnitName = value;
    return this;
  }

  public setCountryName(value: string): this {
    COUNTRY_SCHEMA.parse(value);
    this.countryName = value;
    return this;
  }

  public setUID(value: string): this {
    UID_SCHEMA.parse(value);
    this.uid = value;
    return this;
  }

  public setRegisteredAddress(value: string): this {
    this.registeredAddress = value;
    return this;
  }

  public setBusinessCategory(value: string): this {
    this.businessCategory = value;
    return this;
  }

  public setCurrentZatcaEnv(value: ZatcaEnvironment): this {
    if (!ENVIRONMENTS.includes(value)) {
      throw new Error('Unsupported ZATCA environment.');
    }

    this.currentEnv = value;
    return this;
  }

  public isSandboxEnv(): boolean {
    return this.currentEnv === CSRRequest.SANDBOX;
  }

  public isSimulationEnv(): boolean {
    return this.currentEnv === CSRRequest.SIMULATION;
  }

  public isProduction(): boolean {
    return this.currentEnv === CSRRequest.PRODUCTION;
  }

  public toArray(): {
    dn: Record<string, string>;
    subject: Record<string, string>;
  } {
    return {
      dn: {
        CN: this.commonName,
        organizationName: this.organizationName,
        organizationalUnitName: this.organizationalUnitName,
        C: this.countryName
      },
      subject: {
        SN: this.serialNumber,
        UID: this.uid,
        title: this.invoiceType,
        registeredAddress: this.registeredAddress,
        businessCategory: this.businessCategory
      }
    };
  }

  public getSerialNumber(): string {
    return this.serialNumber;
  }

  public getCommonName(): string {
    return this.commonName;
  }

  public getOrganizationName(): string {
    return this.organizationName;
  }

  public getOrganizationalUnitName(): string {
    return this.organizationalUnitName;
  }

  public getUID(): string {
    return this.uid;
  }

  public getInvoiceType(): string {
    return this.invoiceType;
  }

  public getRegisteredAddress(): string {
    return this.registeredAddress;
  }

  public getBusinessCategory(): string {
    return this.businessCategory;
  }

  public getCountry(): string {
    return this.countryName;
  }
}
