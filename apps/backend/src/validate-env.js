// apps/backend/validate-env.js
require('dotenv').config();

function validateEnv() {
  console.log('🔍 Validando configurações do .env...\n');

  const required = [
    'NODE_ENV',
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'JWT_SECRET'
  ];

  const missing = [];
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Variáveis obrigatórias não encontradas:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }

  console.log('✅ Configurações básicas validadas');
  
  // Validações específicas
  const nodeEnv = process.env.NODE_ENV;
  const emailEnabled = process.env.EMAIL_ENABLED === 'true';
  const oracleEnabled = process.env.ORACLE_ENABLED === 'true';
  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';
  
  console.log('\n📋 Resumo das configurações:');
  console.log(`   🌍 Ambiente: ${nodeEnv}`);
  console.log(`   🗄️  Banco: PostgreSQL (${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT})`);
  console.log(`   📧 E-mail: ${emailEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
  console.log(`   🔶 Oracle: ${oracleEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
  console.log(`   📚 Swagger: ${swaggerEnabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
  console.log(`   🔐 JWT Expiry: ${process.env.JWT_EXPIRES_IN}`);
  console.log(`   🛡️  BCrypt Rounds: ${process.env.BCRYPT_ROUNDS}`);

  if (nodeEnv === 'production') {
    console.log('\n⚠️  ATENÇÃO: Ambiente de PRODUÇÃO detectado!');
    console.log('   - Verifique se JWT_SECRET é suficientemente forte');
    console.log('   - Considere desabilitar SWAGGER_ENABLED');
    console.log('   - Verifique configurações de CORS');
  }

  console.log('\n🎉 Validação concluída com sucesso!');
}

validateEnv();