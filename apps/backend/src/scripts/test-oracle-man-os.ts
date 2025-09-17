// src/scripts/test-oracle-man-os.ts
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OracleModule } from '../database/oracle/oracle.module';
import { OracleService } from '../database/oracle/services/oracle.service';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar .env ANTES de criar o módulo
dotenv.config({ path: resolve(__dirname, '../../.env') });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    OracleModule,
  ],
})
class TestModule {}

async function testManOs() {
  console.log('=== Teste de Conexão Oracle - Tabela MAN_OS ===\n');
  
  // Verificar variáveis antes de iniciar
  console.log('Verificando variáveis de ambiente:');
  console.log('ORACLE_CONNECTION_STRING:', process.env.ORACLE_CONNECTION_STRING || '❌ VAZIO');
  console.log('ORACLE_USER:', process.env.ORACLE_USER || '❌ VAZIO');
  console.log('');

  const app = await NestFactory.createApplicationContext(TestModule);
  const oracle = app.get(OracleService);

  try {
    // 1. Conectar
    console.log('🔌 Conectando ao Oracle...');
    await oracle.connect();
    console.log('✅ Conectado com sucesso!\n');

    // 2. Informações da conexão
    console.log('📊 Informações da Conexão:');
    const info = await oracle.getConnectionInfo();
    console.table(info);
    console.log('');

    // 3. Query na tabela MAN_OS
    console.log('🔍 Consultando tabela MAN_OS...');
    const query = `SELECT * FROM man_os WHERE dataaberturaos = '29-APR-2025'`;
    console.log('Query:', query);
    
    const results = await oracle.query(query);
    console.log(`\n✅ Total de registros encontrados: ${results.length}`);

    // 4. Mostrar primeiros registros
    if (results.length > 0) {
      console.log('\n📋 Primeiros 5 registros:');
      console.table(results.slice(0, 5));
      
      // Mostrar estrutura de um registro
      console.log('\n🔧 Estrutura do registro (campos disponíveis):');
      console.log(Object.keys(results[0]));
    }

    // 5. Testar query com data diferente
    console.log('\n🔍 Testando query com data de hoje...');
    const today = new Date().toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/(\w+) (\d+), (\d+)/, '$2-$1-$3').toUpperCase();
    
    console.log('Data formatada:', today);
    const todayResults = await oracle.query(
      `SELECT COUNT(*) as TOTAL FROM man_os WHERE dataaberturaos = :data`,
      { data: today }
    );
    console.log('Registros de hoje:', todayResults[0].TOTAL);

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await oracle.disconnect();
    await app.close();
  }
}

// Executar
testManOs().catch(console.error);