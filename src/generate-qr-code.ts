import QRCode, { QRCodeToDataURLOptions } from 'qrcode';
import { Tag } from './tag';

export class GenerateQrCode {
  private constructor(private readonly tags: Tag[]) {
    if (tags.length === 0) {
      throw new Error('malformed data structure');
    }
  }

  public static fromArray(tags: ReadonlyArray<Tag | null | undefined>): GenerateQrCode {
    const validTags = tags.filter((tag): tag is Tag => tag instanceof Tag);
    if (validTags.length === 0) {
      throw new Error('malformed data structure');
    }

    return new GenerateQrCode(validTags);
  }

  public toTLV(): Buffer {
    return Buffer.concat(this.tags.map((tag) => tag.toBuffer()));
  }

  public toBase64(): string {
    return this.toTLV().toString('base64');
  }

  public async render(options: QRCodeToDataURLOptions = {}, file?: string): Promise<string> {
    const data = this.toBase64();
    if (file) {
      await QRCode.toFile(file, data, options);
      return file;
    }

    return QRCode.toDataURL(data, options);
  }
}
