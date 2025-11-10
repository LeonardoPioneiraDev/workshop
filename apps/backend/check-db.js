const { Client } = require('pg');
require('dotenv').config();

async function checkDatabase() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5433,
    user: process.env.DATABASE_USERNAME || 'workshop',
    password: process.env.DATABASE_PASSWORD || 'workshop123',
    database: process.env.DATABASE_NAME || 'workshop_db',
  });

  try {
    console.log('Ì¥å Verificando conex√£o com o banco...');
    await client.connect();
    console.log('‚úÖ Conex√£o estabelecida!');

    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('‚úÖ Tabela users existe');
      
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`Ì±• Total de usu√°rios: ${userCount.rows[0].count}`);
      
      // Verificar se as colunas de reset existem
      const resetColumns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        AND column_name IN ('password_reset_token', 'temporary_password', 'is_temporary_password');
      `);
      
      console.log(`ÔøΩÔøΩ Colunas de reset: ${resetColumns.rows.length}/3`);
      
    } else {
      console.log('‚ùå Tabela users n√£o existe');
    }

  } catch (error) {
    console.error('‚ùå Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
