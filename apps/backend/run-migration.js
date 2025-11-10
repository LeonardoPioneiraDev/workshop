const { Client } = require('pg');
require('dotenv').config();

const migrationSQL = `
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS temporary_password VARCHAR(255),
ADD COLUMN IF NOT EXISTS temporary_password_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
CREATE INDEX IF NOT EXISTS idx_users_temporary_password_expires ON users(temporary_password_expires);
`;

async function runMigration() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5433,
    user: process.env.DATABASE_USERNAME || 'workshop',
    password: process.env.DATABASE_PASSWORD || 'workshop123',
    database: process.env.DATABASE_NAME || 'workshop_db',
  });

  try {
    console.log('Ì¥å Conectando ao banco de dados...');
    await client.connect();
    console.log('‚úÖ Conectado com sucesso!');

    console.log('Ì∫Ä Executando migra√ß√£o...');
    await client.query(migrationSQL);
    console.log('‚úÖ Migra√ß√£o executada com sucesso!');

  } catch (error) {
    console.error('‚ùå Erro na migra√ß√£o:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Ì¥å Conex√£o fechada');
  }
}

runMigration();
