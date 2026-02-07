import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTicketDto } from './create-ticket.dto';
import { TicketStatus } from '../enums/ticket-status.enum';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiPropertyOptional({
    description: 'Status do ticket',
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
  })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;
}
