import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthStatusDto } from './dto/health-status.dto';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check(): Promise<HealthStatusDto> {
    const database = await this.checkDatabase();
    const status = database === 'up' ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database,
    };
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }
}
