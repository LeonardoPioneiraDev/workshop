// src/scripts/check-env.ts
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar .env do diretório correto
const envPath = resolve(__dirname, '../../.env');
console.log('Caminho do .env:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Erro ao carregar .env:', result.error);
} else {
  console.log('✅ .env carregado com sucesso');
}

console.log('\n=== Variáveis Oracle ===');
console.log('ORACLE_USER:', process.env.ORACLE_USER || '❌ NÃO DEFINIDO');
console.log('ORACLE_PASSWORD:', process.env.ORACLE_PASSWORD ? '✅ DEFINIDO' : '❌ NÃO DEFINIDO');
console.log('ORACLE_CONNECTION_STRING:', process.env.ORACLE_CONNECTION_STRING || '❌ NÃO DEFINIDO');
console.log('ORACLE_CLIENT_PATH:', process.env.ORACLE_CLIENT_PATH || '❌ NÃO DEFINIDO');