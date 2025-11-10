// apps/backend/validate-email-config.js
require('dotenv').config();

function validateEmailConfig() {
  console.log('📧 Validando configurações de e-mail...\n');

  const emailEnabled = process.env.EMAIL_ENABLED === 'true';
  
  if (!emailEnabled) {
    console.log('❌ E-mail está desabilitado');
    return;
  }

  console.log('✅ E-mail habilitado');
  
  const requiredEmailVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM_ADDRESS'
  ];

  const missing = [];
  
  requiredEmailVars.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Variáveis de e-mail não encontradas:');
    missing.forEach(key => console.error(`   - ${key}`));
    return false;
  }

  console.log('📋 Configurações de e-mail:');
  console.log(`   📡 SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`   🔌 SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`   👤 SMTP User: ${process.env.SMTP_USER}`);
  console.log(`   📧 From Address: ${process.env.EMAIL_FROM_ADDRESS}`);
  console.log(`   🔐 Secure: ${process.env.SMTP_SECURE || 'false'}`);
  console.log(`   ⏱️ Timeout: ${process.env.EMAIL_TIMEOUT}ms`);
  console.log(`   🔄 Retry Attempts: ${process.env.EMAIL_RETRY_ATTEMPTS}`);
  console.log(`   🐛 Debug: ${process.env.EMAIL_DEBUG}`);

  console.log('\n🎉 Configurações de e-mail validadas com sucesso!');
  return true;
}

validateEmailConfig();