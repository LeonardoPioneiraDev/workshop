// apps/backend/check-db.js
const { Client } = require('pg');
require('dotenv').config();

async function checkDatabase() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5433,
    username: process.env.DATABASE_USERNAME || 'workshop',
    password: process.env.DATABASE_PASSWORD || 'workshop123',
    database: process.env.DATABASE_NAME || 'workshop_db',
  });

  try {
    console.log('🔌 Verificando conexão com o banco...');
    await client.connect();
    console.log('✅ Conexão estabelecida!');

    // Verificar se a tabela users existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('✅ Tabela users existe');
      
      // Verificar colunas
      const columns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        AND column_name IN (
          'password_reset_token',
          'temporary_password',
          'is_temporary_password',
          'email_verified'
        );
      `);
      
      const hasPasswordReset = columns.rows.some(row => row.column_name === 'password_reset_token');
      const hasTemporaryPassword = columns.rows.some(row => row.column_name === 'temporary_password');
      
      console.log(`🔑 Colunas de reset de senha: ${hasPasswordReset ? '✅' : '❌'}`);
      console.log(`⏰ Colunas de senha temporária: ${hasTemporaryPassword ? '✅' : '❌'}`);
      
      if (!hasPasswordReset || !hasTemporaryPassword) {
        console.log('⚠️  Execute: npm run migrate');
      }
      
      // Contar usuários
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`👥 Total de usuários: ${userCount.rows[0].count}`);
      
    } else {
      console.log('❌ Tabela users não existe');
      console.log('⚠️  Execute o TypeORM para criar as tabelas básicas');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
    console.log('🔧 Verifique se:');
    console.log('   - PostgreSQL está rodando');
    console.log('   - As credenciais no .env estão corretas');
    console.log('   - O banco workshop_db existe');
  } finally {
    await client.end();
  }
}

checkDatabase();