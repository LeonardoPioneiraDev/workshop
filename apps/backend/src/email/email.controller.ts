// apps/backend/src/email/email.controller.ts (criar este arquivo)
import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmailService } from './email.service';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('test-connection')
  @ApiOperation({ summary: 'Testar conexão SMTP' })
  async testConnection() {
    try {
      const isConnected = await this.emailService.testConnection();
      return {
        success: isConnected,
        message: isConnected ? 'Conexão SMTP OK' : 'Falha na conexão SMTP',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('test-send')
  @ApiOperation({ summary: 'Testar envio de e-mail' })
  async testSend(@Body() body: { email: string; name: string }) {
    try {
      const result = await this.emailService.sendWelcomeEmail(
        body.email,
        'teste',
        'senha123',
        body.name
      );
      
      return {
        success: result,
        message: result ? 'E-mail enviado com sucesso' : 'Falha no envio',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}