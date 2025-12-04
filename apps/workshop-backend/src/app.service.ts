import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getAppInfo() {
    return {
      name: 'Workshop Backend',
      version: '1.0.0',
      description: 'Sistema de Autenticação PostgreSQL',
      environment: this.configService.get('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
    };
  }
}
