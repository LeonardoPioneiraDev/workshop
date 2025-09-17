// src/scripts/diagnose-oracle.ts
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as dns from 'dns';
import { promisify } from 'util';
import * as net from 'net';

dotenv.config({ path: join(__dirname, '../../.env') });

const lookup = promisify(dns.lookup);

async function diagnoseOracleConnection() {
  console.log('🔍 Diagnóstico de Conexão Oracle\n');

  const connectString = process.env.ORACLE_CONNECT_STRING || '';
  console.log(`String de Conexão: ${connectString}\n`);

  // Tentar extrair host e porta
  let host = '';
  let port = '';

  // Padrão 1: hostname:porta/servico
  const pattern1 = /^([^:]+):(\d+)\/(.+)$/;
  const match1 = connectString.match(pattern1);
  
  if (match1) {
    host = match1[1];
    port = match1[2];
  } else {
    // Padrão 2: (DESCRIPTION=...HOST=hostname)(PORT=porta)...
    const hostMatch = connectString.match(/HOST=([^)]+)/);
    const portMatch = connectString.match(/PORT=(\d+)/);
    
    if (hostMatch && portMatch) {
      host = hostMatch[1];
      port = portMatch[1];
    }
  }

  if (!host || !port) {
    console.error('❌ Não foi possível extrair host e porta da string de conexão');
    console.log('Formatos válidos:');
    console.log('  - hostname:1521/servico');
    console.log('  - (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=hostname)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=servico)))');
    return;
  }

  console.log(`📍 Host detectado: ${host}`);
  console.log(`📍 Porta detectada: ${port}\n`);

  // Teste 1: Resolução DNS
  console.log('1️⃣ Testando resolução DNS...');
  try {
    const result = await lookup(host);
    console.log(`✅ Host resolvido para IP: ${result.address}`);
  } catch (error) {
    console.error(`❌ Falha na resolução DNS: ${error.message}`);
    console.log('\n💡 Possíveis soluções:');
    console.log('  - Verifique se o hostname está correto');
    console.log('  - Tente usar o IP direto ao invés do hostname');
    console.log('  - Verifique se você está conectado à VPN (se necessário)');
    return;
  }

  // Teste 2: Conectividade TCP
  console.log('\n2️⃣ Testando conectividade TCP...');
  const testConnection = () => {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        console.log(`✅ Conexão TCP estabelecida com ${host}:${port}`);
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        console.error(`❌ Timeout ao conectar em ${host}:${port}`);
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
      
      socket.on('error', (err) => {
        console.error(`❌ Erro de conexão: ${err.message}`);
        socket.destroy();
        reject(err);
      });
      
      socket.connect(parseInt(port), host);
    });
  };

  try {
    await testConnection();
  } catch (error) {
    console.log('\n💡 Possíveis soluções:');
    console.log('  - Verifique se a porta está correta (geralmente 1521)');
    console.log('  - Verifique se o firewall está bloqueando a conexão');
    console.log('  - Confirme se o Oracle está rodando no servidor');
    console.log('  - Verifique se você tem permissão de acesso ao servidor');
    return;
  }

  // Teste 3: Variáveis de ambiente
  console.log('\n3️⃣ Verificando variáveis de ambiente...');
  console.log(`ORACLE_USER: ${process.env.ORACLE_USER ? '✅ Definido' : '❌ Não definido'}`);
  console.log(`ORACLE_PASSWORD: ${process.env.ORACLE_PASSWORD ? '✅ Definido' : '❌ Não definido'}`);
  console.log(`ORACLE_CONNECT_STRING: ${process.env.ORACLE_CONNECT_STRING ? '✅ Definido' : '❌ Não definido'}`);

  console.log('\n✅ Diagnóstico concluído!');
  console.log('\nSe todos os testes passaram, o problema pode ser:');
  console.log('  - Nome do serviço Oracle incorreto');
  console.log('  - Credenciais incorretas');
  console.log('  - Configuração do listener Oracle no servidor');
}

diagnoseOracleConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Erro no diagnóstico:', error);
    process.exit(1);
  });