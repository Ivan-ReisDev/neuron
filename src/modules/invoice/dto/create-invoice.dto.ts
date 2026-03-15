import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Descrição da fatura' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Valor da fatura', example: 150.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Data de vencimento (ISO)',
    example: '2026-04-15',
  })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiProperty({ description: 'ID do usuário que receberá a fatura' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
