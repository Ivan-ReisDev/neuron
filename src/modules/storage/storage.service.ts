import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { R2_CLIENT } from './providers/r2.provider';
import { CompressionService } from './services/compression.service';
import { FileRepository } from './repository/file.repository';
import { FileType } from './enums/file-type.enum';
import { File } from './repository/file.entity';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from 'src/shared/dto/paginated-response.dto';
import { STORAGE_MESSAGES } from 'src/shared/constants/exception-messages';

@Injectable()
export class StorageService {
  private readonly bucketName: string;
  private readonly signedUrlExpiration: number;

  constructor(
    @Inject(R2_CLIENT) private readonly r2Client: S3Client,
    private readonly compressionService: CompressionService,
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME')!;
    this.signedUrlExpiration =
      this.configService.get<number>('R2_SIGNED_URL_EXPIRATION') || 3600;
  }

  async upload(
    file: Express.Multer.File,
    userId: string,
    folder?: string,
  ): Promise<File> {
    const fileType = this.resolveFileType(file.mimetype);
    const targetFolder = folder || this.defaultFolder(fileType);

    let buffer = file.buffer;
    let mimeType = file.mimetype;

    if (this.compressionService.shouldCompress(file.mimetype)) {
      const compressed = await this.compressionService.compressImage(
        file.buffer,
      );
      buffer = compressed.buffer;
      mimeType = compressed.mimeType;
    }

    const ext =
      mimeType === 'image/webp' ? '.webp' : extname(file.originalname);
    const key = `${targetFolder}/${randomUUID()}${ext}`;

    try {
      await this.r2Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );
    } catch {
      throw new InternalServerErrorException(STORAGE_MESSAGES.UPLOAD_FAILED);
    }

    return this.fileRepository.create({
      key,
      originalName: file.originalname,
      mimeType,
      size: buffer.length,
      type: fileType,
      userId,
    });
  }

  async getSignedUrl(id: string): Promise<{ url: string; expiresIn: number }> {
    const file = await this.fileRepository.findById(id);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: file.key,
    });

    const url = await getSignedUrl(this.r2Client, command, {
      expiresIn: this.signedUrlExpiration,
    });

    return { url, expiresIn: this.signedUrlExpiration };
  }

  async delete(id: string): Promise<void> {
    const file = await this.fileRepository.findById(id);

    try {
      await this.r2Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: file.key,
        }),
      );
    } catch {
      throw new InternalServerErrorException(STORAGE_MESSAGES.DELETE_FAILED);
    }

    await this.fileRepository.remove(id);
  }

  async findById(id: string): Promise<File> {
    return this.fileRepository.findById(id);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<File>> {
    return this.fileRepository.findAll(query);
  }

  private resolveFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType === 'application/pdf') return FileType.PDF;
    return FileType.OTHER;
  }

  private defaultFolder(type: FileType): string {
    switch (type) {
      case FileType.IMAGE:
        return 'images';
      case FileType.PDF:
        return 'documents';
      default:
        return 'files';
    }
  }
}
