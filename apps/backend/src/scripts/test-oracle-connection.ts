import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OracleModule } from '../database/oracle/oracle.module';
import { OracleService } from '../database/oracle/services/oracle.service';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OracleModule,
  ],
})
class TestModule {}

async function testOracleConnection() {
  console.log('=== Teste de Conexão Oracle ===\n');

  const app = await NestFactory.createApplicationContext(TestModule);
  const oracleService = app.get(OracleService);

  try {
    // Teste 1: Conexão básica
    console.log('1. Testando conexão...');
    const isConnected = await oracleService.testConnection();
    console.log(`   ✓ Conexão: ${isConnected ? 'OK' : 'FALHOU'}\n`);

    // Teste 2: Consulta à tabela MAN_OS com filtro de data
    console.log('2. Executando query na tabela MAN_OS para a data 29-APR-2025...');
    const result = await oracleService.executeQuery(`
      SELECT *
      FROM man_os
      WHERE dataaberturaos = TO_DATE('29-APR-2025', 'DD-MON-YYYY')
    `);
    console.log('   ✓ Resultado (primeiros 5 registros):');
    if (result.length > 0) {
      result.slice(0, 5).forEach((row, index) => {
        console.log(`     Registro ${index + 1}:`, row);
      });
      if (result.length > 5) {
        console.log(`     ... e mais ${result.length - 5} registros.`);
      }
    } else {
      console.log('     Nenhum registro encontrado para esta data.');
    }
    console.log('\n');

    // Teste 3: Listar tabelas do usuário


    // Teste 4: Informações de uma tabela específica (se você souber o nome)
    // Descomente e ajuste o nome da tabela quando souber
    /*
    console.log('\n4. Detalhes da tabela NOME_DA_TABELA:');
    const columns = await oracleService.getTableInfo('NOME_DA_TABELA');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}(${col.DATA_LENGTH}) ${col.NULLABLE === 'N' ? 'NOT NULL' : ''}`);
    });
    */

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

// Executar o teste
testOracleConnection().catch(console.error);