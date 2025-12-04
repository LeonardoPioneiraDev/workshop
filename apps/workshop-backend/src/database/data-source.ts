import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST', 'localhost'),
  port: configService.get('DATABASE_PORT', 5433),
  username: configService.get('DATABASE_USERNAME', 'workshop_user'),
  password: configService.get('DATABASE_PASSWORD', 'workshop_password'),
  database: configService.get('DATABASE_NAME', 'workshop_db'),
  synchronize: false, // Sempre false para migrations
  logging: false,
  entities: [
    'src/**/*.entity.ts',
    'dist/**/*.entity.js'
  ],
  migrations: [
    'src/database/migrations/*.ts',
    'dist/database/migrations/*.js'
  ],
  subscribers: [
    'src/**/*.subscriber.ts',
    'dist/**/*.subscriber.js'
  ],
});