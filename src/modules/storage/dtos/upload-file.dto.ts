import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiPropertyOptional({
    description: 'Pasta no bucket (ex: images, documents)',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
