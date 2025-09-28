import { Buffer } from 'node:buffer';

/**
 * Represents a TLV tag entry.
 */
export class Tag {
  private readonly tag: number;
  private readonly value: string;

  constructor(tag: number, value: string) {
    if (!Number.isInteger(tag) || tag < 0 || tag > 255) {
      throw new RangeError('Tag identifier must be an integer between 0 and 255.');
    }

    this.tag = tag;
    this.value = value;
  }

  public getTag(): number {
    return this.tag;
  }

  public getValue(): string {
    return this.value;
  }

  public getLength(): number {
    return Buffer.byteLength(this.value, 'utf8');
  }

  public toBuffer(): Buffer {
    const valueBuffer = Buffer.from(this.value, 'utf8');
    const tagBuffer = this.toHex(this.tag);
    const lengthBuffer = this.toHex(valueBuffer.length);

    return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
  }

  public toString(): string {
    return this.toBuffer().toString('binary');
  }

  private toHex(value: number): Buffer {
    const hex = value.toString(16).padStart(2, '0');
    return Buffer.from(hex, 'hex');
  }
}

export type TagLike = Tag | Buffer;
