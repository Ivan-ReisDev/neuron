import { ApiProperty } from '@nestjs/swagger';

export class HealthStatusDto {
  @ApiProperty({
    description: 'Estado geral da aplicação',
    enum: ['ok', 'degraded'],
    example: 'ok',
  })
  status!: 'ok' | 'degraded';

  @ApiProperty({
    description: 'Timestamp ISO 8601 da verificação',
    example: '2026-05-02T12:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Tempo em segundos desde o boot do processo',
    example: 1234.56,
  })
  uptime!: number;

  @ApiProperty({
    description: 'Estado da conexão com o banco de dados',
    enum: ['up', 'down'],
    example: 'up',
  })
  database!: 'up' | 'down';
}
