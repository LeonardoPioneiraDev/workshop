// test-juridico-corrigido.js
const axios = require('axios');

// ✅ CONFIGURAÇÃO CORRIGIDA PARA O SEU SERVIDOR
const CONFIG = {
  baseURL: 'http://10.10.100.176:3333', // ✅ Servidor confirmado ativo
  timeout: 25000,
  headers: {
    //'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};
// ✅ CORES PARA CONSOLE
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// ✅ LOGGER
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.blue}🎯 ${msg}${colors.reset}`),
  subtitle: (msg) => console.log(`${colors.magenta}�� ${msg}${colors.reset}`)
};

// ✅ TESTADOR CORRIGIDO
class JuridicoTesterFinal {
  constructor() {
    this.results = { total: 0, success: 0, failed: 0, tests: [] };
    this.startTime = Date.now();
  }

  async test(method, endpoint, data = null, description = '') {
    this.results.total++;
    
    try {
      log.info(`${method} ${endpoint} - ${description}`);
      
      // ✅ CONFIGURAÇÃO ESPECÍFICA POR MÉTODO
      const config = {
        method: method.toLowerCase(),
        url: `${CONFIG.baseURL}${endpoint}`,
        timeout: CONFIG.timeout,
        headers: {
          'Accept': 'application/json'
        }
      };
      
      // ✅ APENAS ADICIONAR Content-Type E DATA PARA MÉTODOS QUE PRECISAM
      if (['post', 'put', 'patch'].includes(method.toLowerCase()) && data) {
        config.headers['Content-Type'] = 'application/json';
        config.data = data;
      }
      
      const response = await axios(config);
      
      this.results.success++;
      this.results.tests.push({
        endpoint,
        method,
        status: response.status,
        success: true,
        description,
        dataSize: JSON.stringify(response.data).length
      });
      
      log.success(`${response.status} - ${description || endpoint}`);
      this.showDataSummary(response.data, endpoint);
      
      return response.data;
      
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        endpoint,
        method,
        status: error.response?.status || 'TIMEOUT',
        success: false,
        description,
        error: error.message
      });
      
      log.error(`${error.response?.status || 'TIMEOUT'} - ${description || endpoint}: ${error.message}`);
      return null;
    }
  }

  showDataSummary(data, endpoint) {
    if (!data) return;
    
    try {
      if (Array.isArray(data)) {
        console.log(`   📊 Array: ${data.length} itens`);
        if (data.length > 0) {
          const firstItem = data[0];
          if (typeof firstItem === 'object') {
            const keys = Object.keys(firstItem);
            console.log(`   🔍 Estrutura: [${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}]`);
          }
        }
      } else if (typeof data === 'object') {
        const keys = Object.keys(data);
        console.log(`   📊 Objeto: ${keys.length} propriedades`);
        
        // ✅ INFORMAÇÕES ESPECÍFICAS POR TIPO DE ENDPOINT
        if (endpoint.includes('dashboard')) {
          if (data.resumoExecutivo) {
            console.log(`   💰 Total Multas: ${data.resumoExecutivo.totalMultas?.toLocaleString()}`);
            console.log(`   💵 Valor Total: R$ ${data.resumoExecutivo.valorTotal?.toLocaleString()}`);
            console.log(`   📈 Taxa Pagamento: ${data.resumoExecutivo.taxaPagamento}%`);
          }
        } else if (endpoint.includes('multas')) {
          if (data.count !== undefined) console.log(`   🔢 Total: ${data.count}`);
          if (data.fromCache !== undefined) console.log(`   💾 Cache: ${data.fromCache ? 'SIM' : 'NÃO'}`);
        } else if (endpoint.includes('health')) {
          if (data.status) console.log(`   💚 Status: ${data.status}`);
          if (data.database) console.log(`   🗄️ Database: ${data.database.status || 'OK'}`);
        }
        
        // ✅ INFORMAÇÕES GERAIS
        if (data.message) console.log(`   💬 ${data.message}`);
        if (data.success !== undefined) console.log(`   ✅ Success: ${data.success}`);
        if (data.timestamp) console.log(`   ⏰ ${new Date(data.timestamp).toLocaleTimeString()}`);
      }
    } catch (e) {
      console.log(`   �� Dados recebidos (${typeof data})`);
    }
    
    console.log(''); // Linha em branco
  }

  async runFinalTest() {
    log.title('TESTE FINAL DO SISTEMA JURÍDICO');
    console.log(`🌐 Base URL: ${CONFIG.baseURL}`);
    console.log(`⏱️  Timeout: ${CONFIG.timeout}ms\n`);
    
    // ✅ TESTE 1: VERIFICAÇÃO BÁSICA
    log.subtitle('1. Verificação Básica do Sistema');
    await this.test('GET', '/health', null, 'Health Check Principal');
    await this.test('GET', '/health/database', null, 'Health Check Database');
    await this.test('GET', '/', null, 'Página Principal');
    
    // ✅ TESTE 2: ORACLE
    log.subtitle('2. Oracle Database');
    await this.test('GET', '/oracle/health', null, 'Oracle Health Check');
    await this.test('GET', '/oracle/test', null, 'Oracle Connection Test');
    
    // ✅ TESTE 3: JURÍDICO CORE
    log.subtitle('3. Jurídico - Core System');
    await this.test('GET', '/departamentos/juridico/dashboard', null, 'Dashboard Principal');
    await this.test('GET', '/departamentos/juridico/multas?limit=5', null, 'Multas (5)');
    await this.test('GET', '/departamentos/juridico/info', null, 'Informações do Sistema');
    
    // ✅ TESTE 4: ANALYTICS
    log.subtitle('4. Jurídico - Analytics');
    await this.test('GET', '/departamentos/juridico/analytics/dashboard', null, 'Dashboard Analytics');
    await this.test('GET', '/departamentos/juridico/analytics/rankings', null, 'Rankings');
    await this.test('GET', '/departamentos/juridico/analytics/tendencias', null, 'Tendências');
    
    // ✅ TESTE 5: GESTÃO
    log.subtitle('5. Jurídico - Gestão');
    await this.test('GET', '/departamentos/juridico/gestao/monitoramento', null, 'Monitoramento');
    await this.test('GET', '/departamentos/juridico/gestao/sync/status', null, 'Status Sync');
    await this.test('GET', '/departamentos/juridico/gestao/saude', null, 'Saúde do Sistema');
    
    // ✅ TESTE 6: ALERTAS
    log.subtitle('6. Jurídico - Alertas');
    await this.test('GET', '/departamentos/juridico/alertas', null, 'Lista de Alertas');
    await this.test('GET', '/departamentos/juridico/alertas/estatisticas', null, 'Estatísticas');
    
    // ✅ TESTE 7: DASHBOARD TEMPO REAL
    log.subtitle('7. Jurídico - Dashboard Tempo Real');
    await this.test('GET', '/departamentos/juridico/dashboard/tempo-real', null, 'Tempo Real');
    await this.test('GET', '/departamentos/juridico/dashboard/kpis', null, 'KPIs');
    await this.test('GET', '/departamentos/juridico/dashboard/jobs', null, 'Jobs');
    
    // ✅ TESTE 8: ORACLE SERVICES
    log.subtitle('8. Oracle Services');
    await this.test('GET', '/juridico/infracoes?limit=3', null, 'Infrações (3)');
    await this.test('GET', '/juridico/agentes?limit=3', null, 'Agentes (3)');
    await this.test('GET', '/juridico/veiculos?limit=3', null, 'Veículos (3)');
    await this.test('GET', '/juridico/multas?limit=3', null, 'Multas Oracle (3)');
    
    // ✅ TESTE 9: EMAIL
    log.subtitle('9. Sistema de Email');
    await this.test('GET', '/email/test-connection', null, 'Teste Conexão Email');
    await this.test('GET', '/email/status', null, 'Status Email');
    
    this.showFinalReport();
  }

  showFinalReport() {
    const duration = Date.now() - this.startTime;
    const successRate = ((this.results.success / this.results.total) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(70));
    log.title('RELATÓRIO FINAL DE TESTES');
    console.log('='.repeat(70));
    
    console.log(`${colors.bright}📊 ESTATÍSTICAS GERAIS:${colors.reset}`);
    console.log(`   ✅ Sucessos: ${colors.green}${this.results.success}${colors.reset}`);
    console.log(`   ❌ Falhas: ${colors.red}${this.results.failed}${colors.reset}`);
    console.log(`   📊 Total: ${this.results.total}`);
    console.log(`   ⏱️  Duração: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   📈 Taxa de Sucesso: ${colors.bright}${successRate}%${colors.reset}`);
    
    // ✅ RESULTADO FINAL
    if (successRate === '100.0') {
      console.log(`\n${colors.green}🎉 PERFEITO! TODOS OS TESTES PASSARAM!${colors.reset}`);
      console.log(`${colors.green}🚀 SISTEMA JURÍDICO 100% OPERACIONAL!${colors.reset}`);
    } else if (successRate >= '80.0') {
      console.log(`\n${colors.yellow}⚠️  SISTEMA MAJORITARIAMENTE OPERACIONAL (${successRate}%)${colors.reset}`);
    } else {
      console.log(`\n${colors.red}❌ SISTEMA COM PROBLEMAS (${successRate}%)${colors.reset}`);
    }
    
    // ✅ ENDPOINTS COM SUCESSO
    const successfulTests = this.results.tests.filter(t => t.success);
    if (successfulTests.length > 0) {
      console.log(`\n${colors.bright}✅ ENDPOINTS FUNCIONANDO:${colors.reset}`);
      successfulTests.slice(0, 5).forEach(test => {
        console.log(`   • ${test.method} ${test.endpoint} - ${test.status}`);
      });
      if (successfulTests.length > 5) {
        console.log(`   • ... e mais ${successfulTests.length - 5} endpoints`);
      }
    }
    
    // ✅ ENDPOINTS COM FALHA
    const failedTests = this.results.tests.filter(t => !t.success);
    if (failedTests.length > 0) {
      console.log(`\n${colors.bright}❌ ENDPOINTS COM PROBLEMAS:${colors.reset}`);
      failedTests.slice(0, 5).forEach(test => {
        console.log(`   • ${test.method} ${test.endpoint} - ${test.status}`);
      });
      if (failedTests.length > 5) {
        console.log(`   • ... e mais ${failedTests.length - 5} endpoints`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log(`${colors.bright}${colors.blue}🎯 TESTE CONCLUÍDO!${colors.reset}`);
    console.log('='.repeat(70));
  }
}

// 🚀 FUNÇÃO PRINCIPAL
async function main() {
  console.log(`${colors.bright}${colors.magenta}⚖️ WORKSHOP - TESTE FINAL DO SISTEMA JURÍDICO${colors.reset}\n`);
  
  const tester = new JuridicoTesterFinal();
  await tester.runFinalTest();
}

// ✅ EXECUTAR
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}💥 Erro: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { JuridicoTesterFinal, main };