import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendEmailDto {
  @ApiProperty({
    description: 'E-mail do destinatário',
    example: 'recrutador@empresa.com',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiPropertyOptional({
    description:
      'Assunto do e-mail (padrão: Currículo Desenvolvedor Full-Stack)',
    example: 'Currículo de Ivan Reis',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description: 'Nome do template a ser utilizado',
    example: 'recruiter',
  })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiPropertyOptional({
    description: 'Dados dinâmicos para o template',
    example: { name: 'Maria' },
  })
  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>;
}
