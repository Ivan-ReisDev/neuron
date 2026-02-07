import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { TicketPriority } from '../enums/ticket-priority.enum';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Título do ticket',
    example: 'Erro ao acessar o painel',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do ticket',
    example: 'Ao clicar no botão de login, a página retorna erro 500.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Nível de prioridade do ticket',
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
  })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'Lista de URLs relacionadas ao ticket',
    example: ['https://exemplo.com/screenshot.png'],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  links?: string[];
}
