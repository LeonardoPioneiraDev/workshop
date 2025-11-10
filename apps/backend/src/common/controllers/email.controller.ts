// apps/backend/src/common/controllers/email.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmailService } from '../services/email.service';

class TestEmailDto {
  to: string;
  subject: string;
  message: string;
}

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('config')
  @ApiOperation({ summary: 'Verificar configuração de e-mail' })
  async getConfig() {
    return this.emailService.getEmailConfig();
  }

  @Post('test')
  @ApiOperation({ summary: 'Enviar e-mail de teste' })
  async sendTestEmail(@Body() testEmailDto: TestEmailDto) {
    console.log('🧪 [EMAIL] Teste de e-mail solicitado:', testEmailDto);
    
    const success = await this.emailService.sendEmail({
      to: testEmailDto.to,
      subject: testEmailDto.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">📧 E-mail de Teste</h2>
          <p>${testEmailDto.message}</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Informações do Teste:</strong></p>
            <ul>
              <li><strong>Enviado em:</strong> ${new Date().toLocaleString('pt-BR')}</li>
              <li><strong>Servidor:</strong> Workshop Backend</li>
              <li><strong>Ambiente:</strong> Development</li>
            </ul>
          </div>
          <p style="font-size: 12px; color: #666;">
            Este é um e-mail de teste do sistema Workshop.
          </p>
        </div>
      `,
    });

    return {
      success,
      message: success ? 'E-mail enviado com sucesso' : 'Falha ao enviar e-mail',
      timestamp: new Date().toISOString(),
      details: {
        to: testEmailDto.to,
        subject: testEmailDto.subject
      }
    };
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Testar conexão SMTP' })
  async testConnection() {
    console.log('🧪 [EMAIL] Teste de conexão SMTP solicitado');
    
    const success = await this.emailService.testConnection();
    
    return {
      success,
      message: success ? 'Conexão SMTP funcionando' : 'Falha na conexão SMTP',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test-reset')
  @ApiOperation({ summary: 'Testar e-mail de reset de senha' })
  async testResetEmail(@Body() body: { email: string }) {
    console.log('🧪 [EMAIL] Teste de e-mail de reset solicitado para:', body.email);
    
    const testToken = 'test_token_' + Date.now();
    const success = await this.emailService.sendPasswordResetEmail(body.email, testToken);
    
    return {
      success,
      message: success ? 'E-mail de reset enviado com sucesso' : 'Falha ao enviar e-mail de reset',
      timestamp: new Date().toISOString(),
      testToken,
      resetUrl: `http://http://10.10.100.176:3033/reset-password?token=${testToken}`
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Status do serviço de e-mail' })
  async getStatus() {
    const config = await this.emailService.getEmailConfig();
    const connectionTest = await this.emailService.testConnection();
    
    return {
      status: connectionTest ? 'online' : 'offline',
      config,
      connectionTest,
      timestamp: new Date().toISOString(),
    };
  }
}