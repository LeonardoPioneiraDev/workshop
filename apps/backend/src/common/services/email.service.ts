// apps/backend/src/email/email.service.ts - VERSÃO UNIFICADA E ROBUSTA
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

// Interface para as configurações SMTP que serão testadas
interface SMTPConfig {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: any; // Allow custom TLS options
  ignoreTLS?: boolean;
  requireTLS?: boolean;
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
}

// Interface para o método genérico de envio de e-mail
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private isConfigured = false; // Flag para indicar se o transporter está configurado com sucesso
  private workingConfig: SMTPConfig | null = null; // Armazena a config que funcionou

  constructor(private configService: ConfigService) {
    this.logger.log('📧 [EMAIL] EmailService constructor chamado');
  }

  async onModuleInit() {
    this.logger.log('📧 [EMAIL] EmailService onModuleInit chamado');
    // Chama o método que tenta conectar com múltiplas configurações
    await this.tryInitializeTransporter();
  }

  /**
   * Define e retorna uma lista de configurações SMTP a serem testadas.
   * Isso aumenta a chance de sucesso em diferentes ambientes de servidor de e-mail.
   */
  private getPossibleSmtpConfigs(): SMTPConfig[] {
    const defaultHost = this.configService.get<string>('SMTP_HOST', 'mail.vpioneira.com.br');
    const defaultPort = parseInt(this.configService.get<string>('SMTP_PORT', '587'), 10);
    const defaultUser = this.configService.get<string>('SMTP_USER', 'suporte@vpioneira.com.br');
    const defaultPass = this.configService.get<string>('SMTP_PASS', '');

    const timeout = parseInt(this.configService.get<string>('EMAIL_TIMEOUT', '60000'), 10);

    return [
      // 1. Configuração padrão para porta 587 (STARTTLS)
      {
        name: 'Padrão - Porta 587 (STARTTLS)',
        host: defaultHost,
        port: 587,
        secure: false, // TLS é negociado após a conexão (STARTTLS)
        auth: { user: defaultUser, pass: defaultPass },
        requireTLS: true,
        tls: { rejectUnauthorized: false }, // Permite certificados auto-assinados/inválidos para teste
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
      },
      // 2. Configuração SSL/TLS para porta 465 (SSL/TLS explícito)
      {
        name: 'SSL/TLS - Porta 465',
        host: defaultHost,
        port: 465,
        secure: true, // Conexão segura desde o início (SSL/TLS)
        auth: { user: defaultUser, pass: defaultPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
      },
      // 3. Configuração sem STARTTLS, ignorando TLS (APENAS PARA DEBUG/CASOS EXCEPCIONAIS)
      {
        name: 'Porta 587 - Ignorar TLS (Não recomendado para Produção)',
        host: defaultHost,
        port: 587,
        secure: false,
        auth: { user: defaultUser, pass: defaultPass },
        ignoreTLS: true, // Não força o uso de TLS
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
      },
      // 4. Configuração com TLSv1.2 (para servidores mais antigos ou específicos)
      {
        name: 'TLSv1.2 - Porta 587',
        host: defaultHost,
        port: 587,
        secure: false,
        auth: { user: defaultUser, pass: defaultPass },
        requireTLS: true,
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2' // Força TLSv1.2
        },
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
      },
      // 5. Configuração para porta 25 (APENAS PARA CASOS LEGADOS/SEMLHERAÇAS)
      {
        name: 'Porta 25 (Não Segura - Legado)',
        host: defaultHost,
        port: 25,
        secure: false,
        auth: { user: defaultUser, pass: defaultPass },
        ignoreTLS: true, // Não força TLS
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
      },
      // 6. Usar a porta configurada no .env (se diferente das anteriores)
      {
        name: `Porta do .env (${defaultPort})`,
        host: defaultHost,
        port: defaultPort,
        secure: defaultPort === 465 || (defaultPort === 587 && this.configService.get<boolean>('SMTP_SECURE', false)),
        auth: { user: defaultUser, pass: defaultPass },
        requireTLS: defaultPort === 587 || (defaultPort !== 465 && !this.configService.get<boolean>('SMTP_IGNORE_TLS', false)),
        tls: {
          rejectUnauthorized: this.configService.get<boolean>('SMTP_REJECT_UNAUTHORIZED', false),
          minVersion: this.configService.get<string>('SMTP_MIN_TLS_VERSION') || 'TLSv1.2',
        },
        ignoreTLS: this.configService.get<boolean>('SMTP_IGNORE_TLS', false),
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
      },
    ];
  }

  /**
   * Tenta inicializar o transporter com várias configurações até encontrar uma que funcione.
   * Isso resolve o problema de "wrong version number" e outros erros de conexão comuns.
   */
  private async tryInitializeTransporter(): Promise<void> {
    const emailEnabled = this.configService.get<boolean>('EMAIL_ENABLED', false);
    if (!emailEnabled) {
      this.logger.warn('�� E-mail desabilitado nas configurações. Transporter não será inicializado.');
      this.isConfigured = false;
      return;
    }

    const configsToTry = this.getPossibleSmtpConfigs();
    this.isConfigured = false;
    this.transporter = null;
    this.workingConfig = null;

    for (const config of configsToTry) {
      // Evita logar a senha
      const logConfig = { ...config, auth: { ...config.auth, pass: '[HIDDEN]' } };
      this.logger.log(`📧 [EMAIL] Tentando configuração: ${logConfig.name} (Host: ${logConfig.host}:${logConfig.port}, Secure: ${logConfig.secure})`);
      
      try {
        const testTransporter = nodemailer.createTransport(config);
        
        // Testa a conexão sem enviar e-mail
        await testTransporter.verify(); 

        this.transporter = testTransporter;
        this.isConfigured = true;
        this.workingConfig = config;
        this.logger.log(`✅ [EMAIL] Transporter configurado e verificado com sucesso usando: ${config.name}`);
        return; // Sai do loop assim que uma configuração funcionar
      } catch (error: any) {
        this.logger.warn(`❌ [EMAIL] Falha com a configuração "${config.name}": ${error.message}`);
        // Ajuda com dicas específicas para o erro
        if (error.code === 'EAUTH') {
          this.logger.warn('💡 Dica: Verifique SMTP_USER e SMTP_PASS no .env para esta configuração.');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
          this.logger.warn('💡 Dica: Erro de timeout/conexão/DNS. Verifique SMTP_HOST e PORT, firewall, ou conectividade de rede.');
        } else if (error.message.includes('wrong version number') || error.message.includes('SSL routines')) {
          this.logger.warn('💡 Dica: Erro de SSL/TLS. Tente outra porta (465) ou verifique as opções TLS (secure, requireTLS, tls.minVersion).');
        }
      }
    }

    this.logger.error('💥 [EMAIL] Todas as configurações SMTP falharam. O serviço de e-mail estará em modo de simulação.');
    this.isConfigured = false;
  }

  /**
   * Método genérico para enviar qualquer e-mail.
   * Inclui lógica de re-tentativa e verificação de configuração.
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const emailEnabled = this.configService.get<boolean>('EMAIL_ENABLED', false);
    if (!emailEnabled) {
      this.logger.warn(`📧 Tentativa de envio para ${options.to} com e-mail desabilitado.`);
      return false;
    }

    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(`📧 Transporter não configurado para envio para ${options.to}. Tentando re-inicializar.`);
      await this.tryInitializeTransporter(); // Tenta re-inicializar em caso de falha posterior
      if (!this.isConfigured || !this.transporter) {
        this.logger.error(`❌ Falha na re-inicialização do transporter. Não foi possível enviar e-mail para ${options.to}.`);
        return false;
      }
    }

    const maxRetries = this.configService.get<number>('EMAIL_RETRY_ATTEMPTS', 3);
    const retryDelay = this.configService.get<number>('EMAIL_RETRY_DELAY', 2000); // milliseconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const mailOptions = {
          from: {
            name: this.configService.get<string>('EMAIL_FROM_NAME', 'Workshop Sistema'),
            address: this.configService.get<string>('EMAIL_FROM_ADDRESS', 'suporte@vpioneira.com.br'),
          },
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        };

        this.logger.log(`📧 Tentativa ${attempt}/${maxRetries} - Enviando e-mail para: ${options.to} usando "${this.workingConfig?.name}"`);
        const result = await this.transporter.sendMail(mailOptions);
        
        this.logger.log(`✅ E-mail enviado com sucesso para ${options.to}. MessageId: ${result.messageId}`);
        return true;
        
      } catch (error: any) {
        this.logger.error(`❌ Tentativa ${attempt}/${maxRetries} falhou para ${options.to}: ${error.message}`);
        // Specific error handling for EAUTH, ETIMEDOUT, etc.
        if (error.code === 'EAUTH') {
          this.logger.warn('💡 Dica: Verifique SMTP_USER e SMTP_PASS no .env. Provável erro de autenticação.');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
          this.logger.warn('💡 Dica: Erro de rede/conexão. Verifique SMTP_HOST e PORT, firewall, ou conectividade.');
        }

        if (attempt < maxRetries) {
          this.logger.log(`⏳ Aguardando ${retryDelay / 1000}s antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    this.logger.error(`❌ Falha definitiva ao enviar e-mail para ${options.to} após ${maxRetries} tentativas.`);
    return false;
  }

  /**
   * Envia o e-mail de boas-vindas com credenciais temporárias.
   * Utiliza o template HTML e texto plano definidos.
   */
  async sendWelcomeEmail(
    email: string,
    username: string,
    temporaryPassword: string,
    fullName: string
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://http://10.10.100.176:3001');
    const firstLoginUrl = `${frontendUrl}/first-login?email=${encodeURIComponent(email)}`;
    const htmlContent = this.generateWelcomeEmailTemplate(fullName, username, temporaryPassword, firstLoginUrl);
    const textContent = this.generatePlainTextContent(fullName, username, temporaryPassword, firstLoginUrl);

    return this.sendEmail({
        to: email,
        subject: this.configService.get<string>('EMAIL_WELCOME_SUBJECT', 'Bem-vindo ao Workshop - Suas credenciais de acesso'),
        html: htmlContent,
        text: textContent,
    });
  }

  /**
   * Envia um e-mail de teste.
   */
  async sendTestEmail(email: string, name: string): Promise<boolean> {
    const htmlContent = `
      <h2>🧪 Teste de E-mail</h2>
      <p>Olá, <strong>${name}</strong>!</p>
      <p>Este é um e-mail de teste do Workshop Sistema da Viação Pioneira.</p>
      <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p><strong>Configuração usada:</strong> ${this.workingConfig?.name || 'N/A'}</p>
      <hr>
      <p><small>Se você recebeu este e-mail, o sistema está funcionando corretamente!</small></p>
    `;
    const textContent = `Teste de E-mail - Workshop Sistema\n\nOlá, ${name}!\n\nEste é um e-mail de teste do Workshop Sistema.\n\nData/Hora: ${new Date().toLocaleString('pt-BR')}`;

    return this.sendEmail({
        to: email,
        subject: this.configService.get<string>('EMAIL_TEST_SUBJECT', 'Teste de E-mail - Workshop Sistema'),
        html: htmlContent,
        text: textContent,
    });
  }
  
  /**
   * Envia um e-mail para recuperação de senha.
   * (Método do arquivo "old")
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://http://10.10.100.176:3001');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    this.logger.log(`📧 Gerando e-mail de reset para: ${to}`);
    this.logger.log(`🔗 URL de reset: ${resetUrl}`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">🔐 Solicitação de Recuperação de Senha</h2>
        <p>Você solicitou a recuperação de senha para sua conta no Workshop.</p>
        <p>Clique no botão abaixo para definir uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            🔑 Recuperar Senha
          </a>
        </div>
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Importante:</strong> Este link expira em 1 hora por motivos de segurança.
          </p>
        </div>
        <p>Se você não solicitou esta recuperação, ignore este e-mail. Sua senha permanecerá inalterada.</p>
        <p style="font-size: 14px; color: #666;">
          <strong>Link direto:</strong> ${resetUrl}
        </p>
        <br>
        <p>Atenciosamente,<br><strong>Equipe Workshop</strong></p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          Por segurança, nunca compartilhe este link com outras pessoas.
        </p>
      </div>
    `;
    const textContent = `
Recuperação de Senha - Workshop

Você solicitou a recuperação de senha para sua conta no Workshop.

Clique no link para definir uma nova senha:
${resetUrl}

Este link expira em 1 hora.

Se você não solicitou esta recuperação, ignore este e-mail.

Atenciosamente,
Equipe Workshop
Por segurança, nunca compartilhe este link.
    `;

    return this.sendEmail({
        to: to,
        subject: this.configService.get<string>('EMAIL_RESET_PASSWORD_SUBJECT', 'Recuperação de Senha - Workshop'),
        html: htmlContent,
        text: textContent,
    });
  }

  /**
   * Envia um e-mail de confirmação de alteração de senha.
   * (Método do arquivo "old")
   */
  async sendPasswordChangedEmail(to: string, name: string): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">✅ Senha Alterada com Sucesso</h2>
        <p>Olá <strong>${name}</strong>,</p>
        <p>Sua senha foi alterada com sucesso em <strong>${new Date().toLocaleString('pt-BR')}</strong>.</p>
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>🔒 Segurança:</strong> Sua conta está protegida com a nova senha.
          </p>
        </div>
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #721c24;">
            <strong>⚠️ Não foi você?</strong> Se você não fez esta alteração, entre em contato conosco imediatamente.
          </p>
        </div>
        <br>
        <p>Atenciosamente,<br><strong>Equipe Workshop</strong></p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          Este é um e-mail de segurança automático.
        </p>
      </div>
    `;
    const textContent = `
Senha Alterada com Sucesso - Workshop

Olá ${name},

Sua senha foi alterada com sucesso em ${new Date().toLocaleString('pt-BR')}.

Segurança: Sua conta está protegida com a nova senha.

Não foi você? Se você não fez esta alteração, entre em contato conosco imediatamente.

Atenciosamente,
Equipe Workshop
Este é um e-mail de segurança automático.
    `;

    return this.sendEmail({
        to: to,
        subject: this.configService.get<string>('EMAIL_PASSWORD_CHANGED_SUBJECT', 'Senha Alterada - Workshop'),
        html: htmlContent,
        text: textContent,
    });
  }

  /**
   * Testa a conexão SMTP usando a configuração que funcionou na inicialização.
   * Se nenhuma configuração funcionou, tenta novamente todas as configurações.
   */
  async testConnection(): Promise<boolean> {
    if (this.isConfigured && this.transporter) {
      try {
        await this.transporter.verify();
        this.logger.log('✅ Conexão de e-mail testada com sucesso com o transporter atual.');
        return true;
      } catch (error: any) {
        this.logger.error('❌ Transporter previamente configurado falhou no teste:', error.message);
        this.logger.warn('⚠️ Tentando inicializar novamente todas as configurações...');
        await this.tryInitializeTransporter(); // Tenta re-inicializar
        return this.isConfigured; // Retorna o novo status
      }
    } else {
      this.logger.warn('📧 Transporter não estava configurado. Tentando inicializar agora...');
      await this.tryInitializeTransporter(); // Tenta inicializar pela primeira vez ou re-inicializar
      return this.isConfigured;
    }
  }

  /**
   * Retorna as configurações de e-mail ativas.
   * (Método do arquivo "old")
   */
  async getEmailConfig(): Promise<any> {
    return {
      emailEnabled: this.configService.get<boolean>('EMAIL_ENABLED'),
      smtpHost: this.configService.get<string>('SMTP_HOST'),
      smtpPort: this.configService.get<number>('SMTP_PORT'),
      smtpUser: this.configService.get<string>('SMTP_USER'),
      smtpSecure: this.configService.get<boolean>('SMTP_SECURE'), // Note: this might not reflect the actual 'secure' state from workingConfig
      smtpTls: this.configService.get<boolean>('SMTP_TLS'), // This is likely a custom config variable from .env
      hasPassword: !!this.configService.get<string>('SMTP_PASS'),
      passwordLength: this.configService.get<string>('SMTP_PASS')?.length || 0,
      fromAddress: this.configService.get<string>('EMAIL_FROM_ADDRESS'),
      fromName: this.configService.get<string>('EMAIL_FROM_NAME'),
      frontendUrl: this.configService.get<string>('FRONTEND_URL'),
      transporterConfigured: this.isConfigured, // Use the internal flag
      workingConfigName: this.workingConfig?.name || 'N/A', // Expose which config worked
      emailTimeout: this.configService.get<number>('EMAIL_TIMEOUT'),
      retryAttempts: this.configService.get<number>('EMAIL_RETRY_ATTEMPTS'),
      retryDelay: this.configService.get<number>('EMAIL_RETRY_DELAY'),
    };
  }

  // ===============================================
  // �� MÉTODOS AUXILIARES PRIVADOS (Templates de E-mail)
  // ===============================================
  private logEmailContent(email: string, username: string, temporaryPassword: string, fullName: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://http://10.10.100.176:3001');
    const firstLoginUrl = `${frontendUrl}/first-login?email=${encodeURIComponent(email)}`;

    this.logger.log('✨ ===============================================');
    this.logger.log('📧 CREDENCIAIS DE ACESSO GERADAS');
    this.logger.log('✨ ===============================================');
    this.logger.log(`👤 Nome: ${fullName}`);
    this.logger.log(`📧 E-mail: ${email}`);
    this.logger.log(`�� Username: ${username}`);
    this.logger.log(`🔓 Senha Temporária: ${temporaryPassword}`);
    this.logger.log(`🔗 Link de Primeiro Acesso: ${firstLoginUrl}`);
    this.logger.log('✨ ===============================================');
  }

  private generateWelcomeEmailTemplate(
    fullName: string,
    username: string,
    temporaryPassword: string,
    firstLoginUrl: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Workshop</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #eab308 50%, #0f172a 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 10px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .credentials-box { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #eab308; border-radius: 10px; padding: 25px; margin: 25px 0; }
        .credential-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .credential-value { font-family: 'Courier New', monospace; background-color: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-weight: 600; color: #0f172a; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; }
        .footer { background-color: #0f172a; color: white; padding: 25px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚛 Workshop Sistema</h1>
            <p>Viação Pioneira Ltda</p>
        </div>
        <div class="content">
            <h2>Olá, ${fullName}! ✨</h2>
            <p>Seja bem-vindo(a) ao <strong>Workshop Sistema</strong> da Viação Pioneira!</p>
            
            <div class="credentials-box">
                <h3>🔑 Suas Credenciais de Acesso</h3>
                <div class="credential-item">
                    <span>👤 Nome de Usuário:</span>
                    <span class="credential-value">${username}</span>
                </div>
                <div class="credential-item">
                    <span>🔐 Senha Temporária:</span>
                    <span class="credential-value">${temporaryPassword}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${firstLoginUrl}" class="cta-button">🚀 Fazer Primeiro Acesso</a>
            </div>
            
            <p><strong>⚠️ Importante:</strong> Esta senha temporária expira em 24 horas. No primeiro acesso, você deverá criar uma nova senha.</p>
        </div>
        <div class="footer">
            <p><strong>Workshop Sistema</strong> - Viação Pioneira Ltda</p>
            <p>�� suporte@vpioneira.com.br | �� (61) 99999-9999</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generatePlainTextContent(
    fullName: string,
    username: string,
    temporaryPassword: string,
    firstLoginUrl: string
  ): string {
    return `
Bem-vindo ao Workshop Sistema - Viação Pioneira

Olá, ${fullName}!

Suas credenciais de acesso:
Nome de Usuário: ${username}
Senha Temporária: ${temporaryPassword}

Link de primeiro acesso: ${firstLoginUrl}

IMPORTANTE: Esta senha temporária expira em 24 horas.

Workshop Sistema - Viação Pioneira Ltda
    `;
  }
}