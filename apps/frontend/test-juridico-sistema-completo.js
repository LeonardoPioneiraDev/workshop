// test-juridico-sistema-completo.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ✅ CONFIGURAÇÕES
const CONFIG = {
  baseURL: 'http://localhost:3333',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
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
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// ✅ UTILITÁRIOS
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.blue}🎯 ${msg}${colors.reset}`),
  subtitle: (msg) => console.log(`${colors.magenta}�� ${msg}${colors.reset}`)
};

// ✅ CLASSE PRINCIPAL DE TESTE
class JuridicoSystemTester {
  constructor() {
    this.client = axios.create(CONFIG);
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      tests: []
    };
    this.startTime = Date.now();
  }

  // 🔧 MÉTODO AUXILIAR PARA FAZER REQUISIÇÕES
  async makeRequest(method, endpoint, data = null, description = '') {
    this.results.total++;
    
    try {
      log.info(`Testando: ${method.toUpperCase()} ${endpoint}`);
      
      const config = {
        method: method.toLowerCase(),
        url: endpoint,
        timeout: CONFIG.timeout
      };
      
      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = data;
      }
      
      const response = await this.client(config);
      
      this.results.success++;
      this.results.tests.push({
        endpoint,
        method: method.toUpperCase(),
        status: response.status,
        success: true,
        description,
        responseTime: response.headers['x-response-time'] || 'N/A',
        dataSize: JSON.stringify(response.data).length
      });
      
      log.success(`${response.status} - ${description || endpoint}`);
      
      // ✅ MOSTRAR DADOS RESUMIDOS
      if (response.data) {
        this.showDataSummary(response.data, endpoint);
      }
      
      return response.data;
      
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        endpoint,
        method: method.toUpperCase(),
        status: error.response?.status || 'TIMEOUT',
        success: false,
        description,
        error: error.message
      });
      
      log.error(`${error.response?.status || 'TIMEOUT'} - ${description || endpoint}: ${error.message}`);
      return null;
    }
  }

  // 📊 MOSTRAR RESUMO DOS DADOS
  showDataSummary(data, endpoint) {
    if (!data) return;
    
    try {
      if (Array.isArray(data)) {
        console.log(`   📊 Array com ${data.length} itens`);
        if (data.length > 0) {
          console.log(`   🔍 Primeiro item:`, JSON.stringify(data[0]).substring(0, 100) + '...');
        }
      } else if (typeof data === 'object') {
        const keys = Object.keys(data);
        console.log(`   📊 Objeto com ${keys.length} propriedades: [${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}]`);
        
        // ✅ MOSTRAR DADOS ESPECÍFICOS POR TIPO DE ENDPOINT
        if (endpoint.includes('dashboard')) {
          console.log(`   📈 Dashboard: ${data.message || 'Dados carregados'}`);
        } else if (endpoint.includes('multas')) {
          console.log(`   �� Multas: ${data.count || data.total || 'N/A'} registros`);
        } else if (endpoint.includes('analytics')) {
          console.log(`   📊 Analytics: ${data.success ? 'Dados processados' : 'Erro nos dados'}`);
        } else if (endpoint.includes('sync')) {
          console.log(`   🔄 Sync: ${data.success ? 'Operacional' : 'Com problemas'}`);
        }
      }
    } catch (e) {
      console.log(`   📊 Dados: ${typeof data} (${JSON.stringify(data).length} chars)`);
    }
  }

  // 🧪 TESTES DO SISTEMA PRINCIPAL
  async testMainSystem() {
    log.title('SISTEMA PRINCIPAL - HEALTH & INFO');
    
    await this.makeRequest('GET', '/health', null, 'Health Check Geral');
    await this.makeRequest('GET', '/health/database', null, 'Health Check Database');
    await this.makeRequest('GET', '/', null, 'Página Principal');
    await this.makeRequest('GET', '/ping', null, 'Ping Test');
    await this.makeRequest('GET', '/system-info', null, 'Informações do Sistema');
    await this.makeRequest('GET', '/endpoints', null, 'Lista de Endpoints');
  }

  // ⚖️ TESTES DO DEPARTAMENTO JURÍDICO - CORE
  async testJuridicoCore() {
    log.title('DEPARTAMENTO JURÍDICO - CORE');
    
    await this.makeRequest('GET', '/departamentos/juridico/dashboard', null, 'Dashboard Principal');
    await this.makeRequest('GET', '/departamentos/juridico/processos', null, 'Processos Jurídicos');
    await this.makeRequest('GET', '/departamentos/juridico/contratos', null, 'Contratos');
    await this.makeRequest('GET', '/departamentos/juridico/multas', null, 'Multas (Cache)');
    await this.makeRequest('GET', '/departamentos/juridico/cache/info', null, 'Informações do Cache');
    await this.makeRequest('GET', '/departamentos/juridico/info', null, 'Informações Gerais');
  }

  // 📊 TESTES DE ANALYTICS
  async testJuridicoAnalytics() {
    log.title('DEPARTAMENTO JURÍDICO - ANALYTICS');
    
    await this.makeRequest('GET', '/departamentos/juridico/analytics/dashboard', null, 'Dashboard Analytics');
    await this.makeRequest('GET', '/departamentos/juridico/analytics/rankings', null, 'Rankings e Classificações');
    await this.makeRequest('GET', '/departamentos/juridico/analytics/tendencias', null, 'Análise de Tendências');
  }

  // ⚙️ TESTES DE GESTÃO E ADMINISTRAÇÃO
  async testJuridicoGestao() {
    log.title('DEPARTAMENTO JURÍDICO - GESTÃO');
    
    await this.makeRequest('GET', '/departamentos/juridico/gestao/monitoramento', null, 'Monitoramento do Sistema');
    await this.makeRequest('GET', '/departamentos/juridico/gestao/sync/status', null, 'Status da Sincronização');
    await this.makeRequest('GET', '/departamentos/juridico/gestao/dashboard', null, 'Dashboard de Gestão');
    await this.makeRequest('GET', '/departamentos/juridico/gestao/saude', null, 'Relatório de Saúde');
    await this.makeRequest('GET', '/departamentos/juridico/gestao/integridade', null, 'Verificação de Integridade');
    await this.makeRequest('GET', '/departamentos/juridico/gestao/sync/relatorio', null, 'Relatório de Sincronização');
  }

  // 🚨 TESTES DE ALERTAS
  async testJuridicoAlertas() {
    log.title('DEPARTAMENTO JURÍDICO - ALERTAS');
    
    await this.makeRequest('GET', '/departamentos/juridico/alertas', null, 'Lista de Alertas');
    await this.makeRequest('GET', '/departamentos/juridico/alertas/estatisticas', null, 'Estatísticas de Alertas');
    
    // ✅ CRIAR UM ALERTA DE TESTE
    const alertaTest = {
      tipo: 'INFO',
      titulo: 'Teste de Alerta via Script',
      descricao: 'Este é um alerta criado pelo script de teste',
      categoria: 'SISTEMA',
      prioridade: 'BAIXA'
    };
    
    await this.makeRequest('POST', '/departamentos/juridico/alertas', alertaTest, 'Criar Alerta de Teste');
  }

  // 📈 TESTES DE DASHBOARD TEMPO REAL
  async testJuridicioDashboard() {
    log.title('DEPARTAMENTO JURÍDICO - DASHBOARD TEMPO REAL');
    
    await this.makeRequest('GET', '/departamentos/juridico/dashboard', null, 'Dashboard Principal');
    await this.makeRequest('GET', '/departamentos/juridico/dashboard/tempo-real', null, 'Dados em Tempo Real');
    await this.makeRequest('GET', '/departamentos/juridico/dashboard/kpis', null, 'KPIs do Sistema');
    await this.makeRequest('GET', '/departamentos/juridico/dashboard/jobs', null, 'Status dos Jobs');
    await this.makeRequest('GET', '/departamentos/juridico/dashboard/sistema', null, 'Informações do Sistema');
    await this.makeRequest('GET', '/departamentos/juridico/dashboard/widget/multas', null, 'Widget de Multas');
    await this.makeRequest('GET', '/departamentos/juridico/dashboard/widget/agentes', null, 'Widget de Agentes');
  }

  // 🔧 TESTES DE CONFIGURAÇÕES
  async testJuridicoConfiguracoes() {
    log.title('DEPARTAMENTO JURÍDICO - CONFIGURAÇÕES');
    
    await this.makeRequest('GET', '/departamentos/juridico/configuracoes', null, 'Todas as Configurações');
    await this.makeRequest('GET', '/departamentos/juridico/configuracoes/categoria/sistema', null, 'Configurações de Sistema');
    await this.makeRequest('GET', '/departamentos/juridico/configuracoes/categoria/alertas', null, 'Configurações de Alertas');
    await this.makeRequest('GET', '/departamentos/juridico/configuracoes/chave/sincronizacaoAutomatica', null, 'Config Sincronização');
  }

  // 🔄 TESTES DE SINCRONIZAÇÃO
  async testJuridicoSync() {
    log.title('DEPARTAMENTO JURÍDICO - SINCRONIZAÇÃO');
    
    await this.makeRequest('GET', '/juridico/sync/status', null, 'Status da Sincronização');
    // ⚠️ Não executar sync automático para não sobrecarregar
    // await this.makeRequest('POST', '/juridico/sync/executar', null, 'Executar Sincronização');
  }

  // 🔶 TESTES DOS SERVICES ORACLE - INFRAÇÕES
  async testOracleInfracoes() {
    log.title('ORACLE SERVICES - INFRAÇÕES');
    
    await this.makeRequest('GET', '/juridico/infracoes?limit=10', null, 'Lista de Infrações (10)');
    await this.makeRequest('GET', '/juridico/infracoes/stats/frequentes', null, 'Infrações Mais Frequentes');
    await this.makeRequest('GET', '/juridico/infracoes/stats/geral', null, 'Estatísticas Gerais');
    await this.makeRequest('GET', '/juridico/infracoes/meta/grupos', null, 'Grupos de Infrações');
    await this.makeRequest('GET', '/juridico/infracoes/meta/orgaos', null, 'Órgãos Autuadores');
    await this.makeRequest('GET', '/juridico/infracoes/classificacao/gravidade', null, 'Classificação por Gravidade');
    await this.makeRequest('GET', '/juridico/infracoes/dashboard/resumo', null, 'Dashboard de Infrações');
    await this.makeRequest('GET', '/juridico/infracoes/comparativo/grupos', null, 'Comparativo entre Grupos');
    await this.makeRequest('GET', '/juridico/infracoes/analytics/tipos-multa', null, 'Analytics de Tipos de Multa');
  }

  // 👥 TESTES DOS SERVICES ORACLE - AGENTES
  async testOracleAgentes() {
    log.title('ORACLE SERVICES - AGENTES AUTUADORES');
    
    await this.makeRequest('GET', '/juridico/agentes?limit=10', null, 'Lista de Agentes (10)');
    await this.makeRequest('GET', '/juridico/agentes/stats/top-agentes', null, 'Top Agentes');
    await this.makeRequest('GET', '/juridico/agentes/stats/geral', null, 'Estatísticas Gerais');
    await this.makeRequest('GET', '/juridico/agentes/dashboard/resumo', null, 'Dashboard de Agentes');
    await this.makeRequest('GET', '/juridico/agentes/comparativo/produtividade', null, 'Comparativo de Produtividade');
  }

  // 🚗 TESTES DOS SERVICES ORACLE - VEÍCULOS
  async testOracleVeiculos() {
    log.title('ORACLE SERVICES - VEÍCULOS');
    
    await this.makeRequest('GET', '/juridico/veiculos?limit=10', null, 'Lista de Veículos (10)');
    await this.makeRequest('GET', '/juridico/veiculos/stats/mais-multas', null, 'Veículos com Mais Multas');
    await this.makeRequest('GET', '/juridico/veiculos/stats/geral', null, 'Estatísticas Gerais');
    await this.makeRequest('GET', '/juridico/veiculos/dashboard/frota', null, 'Dashboard da Frota');
  }

  // 📄 TESTES DOS SERVICES ORACLE - MULTAS
  async testOracleMultas() {
    log.title('ORACLE SERVICES - MULTAS');
    
    await this.makeRequest('GET', '/juridico/multas?limit=10', null, 'Lista de Multas (10)');
    await this.makeRequest('GET', '/juridico/multas/stats/geral', null, 'Estatísticas Gerais');
    await this.makeRequest('GET', '/juridico/multas/situacao/vencidas', null, 'Multas Vencidas');
    await this.makeRequest('GET', '/juridico/multas/situacao/recurso', null, 'Multas em Recurso');
    await this.makeRequest('GET', '/juridico/multas/dashboard/resumo', null, 'Dashboard de Multas');
    
    // ✅ BUSCA AVANÇADA
    const buscaAvancada = {
      filtros: {
        dataEmissaoInicio: '2024-01-01',
        dataEmissaoFim: '2024-12-31',
        limite: 5
      }
    };
    
    await this.makeRequest('POST', '/juridico/multas/busca/avancada', buscaAvancada, 'Busca Avançada de Multas');
  }

  // 🔶 TESTES DO ORACLE GERAL
  async testOracleGeneral() {
    log.title('ORACLE - TESTES GERAIS');
    
    await this.makeRequest('GET', '/oracle/health', null, 'Oracle Health Check');
    await this.makeRequest('GET', '/oracle/test', null, 'Oracle Connection Test');
  }

  // 📧 TESTES DE EMAIL
  async testEmailSystem() {
    log.title('SISTEMA DE EMAIL');
    
    await this.makeRequest('GET', '/email/test-connection', null, 'Teste de Conexão Email');
    await this.makeRequest('GET', '/email/config', null, 'Configurações de Email');
    await this.makeRequest('GET', '/email/status', null, 'Status do Email');
  }

  // 📊 GERAR RELATÓRIO FINAL
  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    log.title('RELATÓRIO FINAL DE TESTES');
    
    console.log(`\n${colors.bright}📊 ESTATÍSTICAS GERAIS:${colors.reset}`);
    console.log(`   ✅ Sucessos: ${colors.green}${this.results.success}${colors.reset}`);
    console.log(`   ❌ Falhas: ${colors.red}${this.results.failed}${colors.reset}`);
    console.log(`   📊 Total: ${this.results.total}`);
    console.log(`   ⏱️  Duração: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   📈 Taxa de Sucesso: ${((this.results.success / this.results.total) * 100).toFixed(1)}%`);
    
    console.log(`\n${colors.bright}📋 RESUMO POR CATEGORIA:${colors.reset}`);
    
    const categories = {};
    this.results.tests.forEach(test => {
      const category = this.getCategoryFromEndpoint(test.endpoint);
      if (!categories[category]) {
        categories[category] = { success: 0, failed: 0, total: 0 };
      }
      categories[category].total++;
      if (test.success) {
        categories[category].success++;
      } else {
        categories[category].failed++;
      }
    });
    
    Object.entries(categories).forEach(([category, stats]) => {
      const successRate = ((stats.success / stats.total) * 100).toFixed(1);
      const status = successRate === '100.0' ? '✅' : successRate >= '80.0' ? '⚠️' : '❌';
      console.log(`   ${status} ${category}: ${stats.success}/${stats.total} (${successRate}%)`);
    });
    
    // ✅ SALVAR RELATÓRIO EM ARQUIVO
    this.saveReportToFile(duration);
    
    console.log(`\n${colors.bright}${colors.green}🎉 TESTE COMPLETO FINALIZADO!${colors.reset}`);
  }

  // 📁 SALVAR RELATÓRIO EM ARQUIVO
  saveReportToFile(duration) {
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${(duration / 1000).toFixed(2)}s`,
      summary: {
        total: this.results.total,
        success: this.results.success,
        failed: this.results.failed,
        successRate: `${((this.results.success / this.results.total) * 100).toFixed(1)}%`
      },
      tests: this.results.tests
    };
    
    const filename = `juridico-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    
    console.log(`\n📁 Relatório salvo em: ${colors.cyan}${filename}${colors.reset}`);
  }

  // 🏷️ CATEGORIZAR ENDPOINTS
  getCategoryFromEndpoint(endpoint) {
    if (endpoint.includes('/oracle')) return 'Oracle Geral';
    if (endpoint.includes('/juridico/infracoes')) return 'Oracle Infrações';
    if (endpoint.includes('/juridico/agentes')) return 'Oracle Agentes';
    if (endpoint.includes('/juridico/veiculos')) return 'Oracle Veículos';
    if (endpoint.includes('/juridico/multas')) return 'Oracle Multas';
    if (endpoint.includes('/juridico/sync')) return 'Sincronização';
    if (endpoint.includes('/gestao')) return 'Gestão';
    if (endpoint.includes('/analytics')) return 'Analytics';
    if (endpoint.includes('/alertas')) return 'Alertas';
    if (endpoint.includes('/dashboard')) return 'Dashboard';
    if (endpoint.includes('/configuracoes')) return 'Configurações';
    if (endpoint.includes('/juridico')) return 'Jurídico Core';
    if (endpoint.includes('/email')) return 'Email';
    if (endpoint.includes('/health')) return 'Health Check';
    return 'Sistema Geral';
  }

  // 🚀 EXECUTAR TODOS OS TESTES
  async runAllTests() {
    console.log(`${colors.bright}${colors.blue}🧪 INICIANDO TESTE COMPLETO DO SISTEMA JURÍDICO${colors.reset}\n`);
    
    try {
      // ✅ TESTES EM SEQUÊNCIA ORGANIZADA
      await this.testMainSystem();
      await this.testJuridicoCore();
      await this.testJuridicoAnalytics();
      await this.testJuridicoGestao();
      await this.testJuridicoAlertas();
      await this.testJuridicioDashboard();
      await this.testJuridicoConfiguracoes();
      await this.testJuridicoSync();
      await this.testOracleInfracoes();
      await this.testOracleAgentes();
      await this.testOracleVeiculos();
      await this.testOracleMultas();
      await this.testOracleGeneral();
      await this.testEmailSystem();
      
    } catch (error) {
      log.error(`Erro durante a execução dos testes: ${error.message}`);
    } finally {
      this.generateReport();
    }
  }
}

// 🎯 FUNÇÃO PRINCIPAL
async function main() {
  const tester = new JuridicoSystemTester();
  
  console.log(`${colors.bright}${colors.magenta}⚖️ WORKSHOP - TESTE COMPLETO DO SISTEMA JURÍDICO${colors.reset}`);
  console.log(`${colors.cyan}🌐 Base URL: ${CONFIG.baseURL}${colors.reset}`);
  console.log(`${colors.cyan}⏱️  Timeout: ${CONFIG.timeout}ms${colors.reset}\n`);
  
  await tester.runAllTests();
}

// 🚀 EXECUTAR SE CHAMADO DIRETAMENTE
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}💥 Erro fatal: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { JuridicoSystemTester, main };