// src/scripts/test-direct.ts
import * as oracledb from 'oracledb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar .env
dotenv.config({ path: resolve(__dirname, '../../.env') });

async function testDirect() {
  // Verificar variáveis
  console.log('=== Verificando Variáveis de Ambiente ===');
  console.log('ORACLE_USER:', process.env.ORACLE_USER);
  console.log('ORACLE_CONNECTION_STRING:', process.env.ORACLE_CONNECTION_STRING);
  console.log('ORACLE_CLIENT_PATH:', process.env.ORACLE_CLIENT_PATH);
  console.log('');

  if (!process.env.ORACLE_CONNECTION_STRING) {
    console.error('❌ ORACLE_CONNECTION_STRING não está definida no .env!');
    console.log('\nVerifique se o arquivo .env contém:');
    console.log('ORACLE_CONNECTION_STRING=seu_host:porta/seu_servico');
    return;
  }

  let connection;

  try {
    // Inicializar Oracle Client
    if (process.env.ORACLE_CLIENT_PATH) {
      oracledb.initOracleClient({ 
        libDir: process.env.ORACLE_CLIENT_PATH 
      });
    }

    // Conectar
    console.log('🔌 Conectando...');
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER!,
      password: process.env.ORACLE_PASSWORD!,
      connectString: process.env.ORACLE_CONNECTION_STRING!,
    });

    console.log('✅ Conectado com sucesso!\n');

    // Query
    const result = await connection.execute(
      `SELECT * FROM man_os WHERE dataaberturaos = '29-APR-2025'`,
      {},
      { 
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        fetchArraySize: 100 
      }
    );

    console.log(`Total de registros: ${result.rows?.length || 0}`);
    
    if (result.rows && result.rows.length > 0) {
      console.log('\nPrimeiros 3 registros:');
      console.table(result.rows.slice(0, 3));
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n👋 Conexão fechada');
    }
  }
}

testDirect();