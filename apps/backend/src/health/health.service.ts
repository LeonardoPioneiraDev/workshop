import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getHealthStatus() {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    try {
      const database = await this.checkDatabase();

      return {
        status: database.status === 'ok' ? 'ok' : 'error',
        timestamp,
        uptime: `${Math.floor(uptime)}s`,
        services: {
          database: database.status,
        },
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'error',
        timestamp,
        uptime: `${Math.floor(uptime)}s`,
        error: error.message,
      };
    }
  }

  async checkDatabase() {
    try {
      if (!this.dataSource.isInitialized) {
        return {
          status: 'error',
          message: 'Database not initialized',
        };
      }

      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        responseTime: `${responseTime}ms`,
        connection: 'active',
        database: this.dataSource.options.database,
        type: this.dataSource.options.type,
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
