// apps/backend/test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('📧 Testando configurações de e-mail...\n');

  const emailEnabled = process.env.EMAIL_ENABLED === 'true';
  
  if (!emailEnabled) {
    console.log('❌ E-mail está desabilitado no .env');
    return;
  }

  try {
    // Criar transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: parseInt(process.env.EMAIL_TIMEOUT || '30000'),
      greetingTimeout: parseInt(process.env.EMAIL_TIMEOUT || '30000'),
      socketTimeout: parseInt(process.env.EMAIL_TIMEOUT || '30000'),
    });

    console.log('🔧 Transporter criado com sucesso');

    // Verificar conexão
    console.log('🔍 Verificando conexão SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP verificada com sucesso!');

    // Enviar e-mail de teste (opcional)
    const sendTest = process.argv.includes('--send');
    if (sendTest) {
      const testEmail = process.env.SMTP_USER; // Enviar para o próprio e-mail

      console.log(`📤 Enviando e-mail de teste para ${testEmail}...`);
      
      const result = await transporter.sendMail({
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Workshop Backend',
          address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER,
        },
        to: testEmail,
        subject: 'Teste de E-mail - Workshop Backend',
        html: `
          <h2>🎉 Teste de E-mail Bem-sucedido!</h2>
          <p>Este é um e-mail de teste do Workshop Backend.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Servidor SMTP:</strong> ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</p>
          <hr>
          <p><small>Se você recebeu este e-mail, suas configurações estão funcionando corretamente!</small></p>
        `,
      });

      console.log('✅ E-mail de teste enviado com sucesso!');
      console.log(`📧 Message ID: ${result.messageId}`);
    } else {
      console.log('💡 Para enviar um e-mail de teste, execute: npm run email:test -- --send');
    }

    console.log('\n🎉 Teste de e-mail concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro no teste de e-mail:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('💡 Dica: Verifique suas credenciais SMTP_USER e SMTP_PASS');
    } else if (error.code === 'ECONNECTION') {
      console.error('💡 Dica: Verifique SMTP_HOST e SMTP_PORT');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Dica: Verifique se o servidor SMTP está acessível');
    }
  }
}

testEmail();