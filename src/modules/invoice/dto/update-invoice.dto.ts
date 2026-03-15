import { PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiPropertyOptional({
    description: 'Data do pagamento (ISO)',
    example: '2026-04-10T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
