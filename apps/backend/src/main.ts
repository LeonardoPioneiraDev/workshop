// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as compression from 'compression';
import * as express from 'express';
import helmet from 'helmet';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // Criar aplicação com configurações otimizadas
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Registrar interceptors e filtros globalmente
  app.useGlobalInterceptors(new TimeoutInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Aplicar compressão para reduzir tamanho das respostas
  app.use(compression());
  
  // Adicionar segurança básica
  app.use(helmet());
  
  // Configuração de CORS
  app.enableCors({
    origin: [
      'http://localhost:5274',
      'http://localhost:5273',
      'http://10.10.100.176:5273',
      'http://frontend:5273',
      'http://cco.vpioneira.com.br',
      'http://10.10.100.79:5273',
      'http://frontend:5273',
      'http://cco.vpioneira.com.br:5273', 
    ],
    methods: ['GET', 'POST'],
    //credentials: true,
  });
  
  // Validação de dados de entrada
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Aumentar limites de payload
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Configurar porta e host
  const port = process.env.PORT || 3024;
  const host = process.env.HOST || '0.0.0.0';
  
  // Iniciar servidor com timeout aumentado
  const server = await app.listen(port, host);
  server.setTimeout(60000); // 60 segundos
  
  console.log(`Application is running on:`);
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- Network: http://${host === '0.0.0.0' ? '10.10.100.176' : host}:${port}`);
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
//  console.error('Uncaught Exception:', error);
});

bootstrap().catch(err => {
 // console.error('Failed to start application:', err);
});