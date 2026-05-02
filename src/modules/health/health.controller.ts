import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthStatusDto } from './dto/health-status.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifica saúde da API e dependências' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API operacional',
    type: HealthStatusDto,
  })
  async check(): Promise<HealthStatusDto> {
    return this.healthService.check();
  }
}
