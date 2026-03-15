import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

const COMPRESSIBLE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_WIDTH = 1920;
const WEBP_QUALITY = 80;

@Injectable()
export class CompressionService {
  shouldCompress(mimeType: string): boolean {
    return COMPRESSIBLE_TYPES.includes(mimeType);
  }

  async compressImage(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (metadata.width && metadata.width > MAX_WIDTH) {
      image.resize(MAX_WIDTH, null, { withoutEnlargement: true });
    }

    const compressedBuffer = await image
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    return {
      buffer: compressedBuffer,
      mimeType: 'image/webp',
    };
  }
}
