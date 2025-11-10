import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check geral' })
  @ApiResponse({ status: 200, description: 'Status da aplicação' })
  async check() {
    return this.healthService.getHealthStatus();
  }

  @Public()
  @Get('database')
  @ApiOperation({ summary: 'Health check do banco PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Status do banco de dados' })
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }
}
