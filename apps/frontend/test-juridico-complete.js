// test-juridico-complete.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class JuridicoSystemTester {
  constructor(baseUrl = 'http://localhost:3333') {
    this.baseUrl = baseUrl;
    this.token = '';
    this.results = {
      success: [],
      failed: [],
      warnings: [],
      total: 0,
      summary: {}
    };
    this.startTime = Date.now();
  }

  // ==================== AUTENTICAÇÃO ====================
  async authenticate() {
    console.log('🔐 Iniciando autenticação...');
    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: 'admin@workshop.com',
        password: 'admin123'
      });
      
      this.token = response.data.access_token;
      console.log('✅ Login realizado com sucesso');
      console.log(`🎫 Token: ${this.token.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('❌ Erro no login:', error.response?.data || error.message);
      console.log('\n🔧 Tentando credenciais alternativas...');
      
      // Tentar outras credenciais comuns
      const credentials = [
        { email: 'leonardo@workshop.com', password: 'leonardo123' },
        { email: 'admin@admin.com', password: 'admin' },
        { email: 'test@test.com', password: 'test123' }
      ];
      
      for (const cred of credentials) {
        try {
          const response = await axios.post(`${this.baseUrl}/auth/login`, cred);
          this.token = response.data.access_token;
          console.log(`✅ Login com ${cred.email} realizado com sucesso`);
          return true;
        } catch (err) {
          console.log(`❌ Falha com ${cred.email}`);
        }
      }
      
      throw new Error('Não foi possível autenticar com nenhuma credencial');
    }
  }

  // ==================== TESTE INDIVIDUAL ====================
  async testRoute(method, endpoint, data = null, description = '') {
    this.results.total++;
    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    console.log(`\n🧪 Testando: ${method} ${endpoint}`);
    if (description) console.log(`   📝 ${description}`);
    
    try {
      const config = {
        method: method.toLowerCase(),
        url: fullUrl,
        timeout: 1800000,
        headers: {}
      };
      
      // Adicionar token se disponível
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      
      // Adicionar dados se fornecidos
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }
      
      const startTime = Date.now();
      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      
      // Analisar resposta
      const analysis = this.analyzeResponse(response, responseTime);
      
      this.results.success.push({
        method,
        endpoint,
        description,
        status: response.status,
        responseTime,
        dataSize: JSON.stringify(response.data).length,
        analysis,
        sample: this.getSampleData(response.data)
      });
      
      console.log(`   ✅ Status: ${response.status} | Tempo: ${responseTime}ms | Tamanho: ${analysis.dataSize}`);
      console.log(`   📊 Estrutura: ${analysis.structure}`);
      
      if (analysis.warnings.length > 0) {
        console.log(`   ⚠️  Avisos: ${analysis.warnings.join(', ')}`);
        this.results.warnings.push({
          endpoint,
          warnings: analysis.warnings
        });
      }
      
      return response.data;
      
    } catch (error) {
      const errorInfo = {
        method,
        endpoint,
        description,
        error: error.response?.status || 'NETWORK_ERROR',
        message: error.response?.data?.message || error.message,
        details: error.response?.data || null
      };
      
      this.results.failed.push(errorInfo);
      
      console.log(`   ❌ Erro: ${errorInfo.error} - ${errorInfo.message}`);
      
      return null;
    }
  }

  // ==================== ANÁLISE DE RESPOSTA ====================
  analyzeResponse(response, responseTime) {
    const data = response.data;
    const analysis = {
      dataSize: JSON.stringify(data).length,
      structure: '',
      warnings: [],
      insights: []
    };
    
    // Analisar estrutura
    if (Array.isArray(data)) {
      analysis.structure = `Array[${data.length}]`;
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      analysis.structure = `Object{${keys.length} keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
      
      // Verificar padrões comuns
      if (data.success !== undefined) {
        analysis.insights.push(`Success: ${data.success}`);
      }
      if (data.data !== undefined) {
        analysis.insights.push(`Has data property`);
      }
      if (data.pagination !== undefined) {
        analysis.insights.push(`Paginated: ${data.pagination.total || 'unknown'} items`);
      }
      if (data.executionTime !== undefined) {
        analysis.insights.push(`Execution: ${data.executionTime}`);
      }
    } else {
      analysis.structure = typeof data;
    }
    
    // Verificar performance
    if (responseTime > 5000) {
      analysis.warnings.push('Resposta lenta (>5s)');
    } else if (responseTime > 2000) {
      analysis.warnings.push('Resposta moderada (>2s)');
    }
    
    // Verificar tamanho
    if (analysis.dataSize > 1000000) {
      analysis.warnings.push('Resposta muito grande (>1MB)');
    }
    
    return analysis;
  }

  // ==================== AMOSTRA DE DADOS ====================
  getSampleData(data) {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        sample: data.slice(0, 2).map(item => this.simplifyObject(item))
      };
    } else if (typeof data === 'object' && data !== null) {
      return {
        type: 'object',
        keys: Object.keys(data),
        sample: this.simplifyObject(data)
      };
    }
    return { type: typeof data, value: data };
  }

  simplifyObject(obj, maxDepth = 2, currentDepth = 0) {
    if (currentDepth >= maxDepth) return '[Object]';
    if (obj === null || typeof obj !== 'object') return obj;
    
    const simplified = {};
    const keys = Object.keys(obj).slice(0, 5); // Máximo 5 keys
    
    for (const key of keys) {
      const value = obj[key];
      if (Array.isArray(value)) {
        simplified[key] = `[Array(${value.length})]`;
      } else if (typeof value === 'object' && value !== null) {
        simplified[key] = currentDepth < maxDepth - 1 ? 
          this.simplifyObject(value, maxDepth, currentDepth + 1) : '[Object]';
      } else {
        simplified[key] = value;
      }
    }
    
    if (Object.keys(obj).length > 5) {
      simplified['...'] = `+${Object.keys(obj).length - 5} more`;
    }
    
    return simplified;
  }

  // ==================== TESTES POR CONTROLLER ====================

  async testHealthRoutes() {
    console.log('\n🏥 ========== HEALTH & BASIC ROUTES ==========');
    
    await this.testRoute('GET', '/health', null, 'Health check geral');
    await this.testRoute('GET', '/health/database', null, 'Health check database');
    await this.testRoute('GET', '/oracle/health', null, 'Health check Oracle');
    await this.testRoute('GET', '/oracle/test', null, 'Teste Oracle');
  }

  async testJuridicoCore() {
    console.log('\n⚖️ ========== JURIDICO CORE CONTROLLER ==========');
    
    await this.testRoute('GET', '/departamentos/juridico/dashboard', null, 'Dashboard executivo principal');
    await this.testRoute('GET', '/departamentos/juridico/processos', null, 'Lista de processos jurídicos');
    await this.testRoute('GET', '/departamentos/juridico/processos?limite=5', null, 'Processos com limite');
    await this.testRoute('GET', '/departamentos/juridico/contratos', null, 'Lista de contratos ativos');
    await this.testRoute('GET', '/departamentos/juridico/multas', null, 'Lista de multas e infrações');
    await this.testRoute('GET', '/departamentos/juridico/multas?limite=10', null, 'Multas com limite');
    await this.testRoute('GET', '/departamentos/juridico/cache/info', null, 'Informações do cache');
    await this.testRoute('GET', '/departamentos/juridico/info', null, 'Informações do sistema');
  }

  async testVeiculosController() {
    console.log('\n🚗 ========== VEÍCULOS CONTROLLER ==========');
    
    await this.testRoute('GET', '/juridico/veiculos', null, 'Lista todos os veículos');
    await this.testRoute('GET', '/juridico/veiculos?page=1&limit=10', null, 'Veículos paginados');
    await this.testRoute('GET', '/juridico/veiculos/stats/geral', null, 'Estatísticas gerais de veículos');
    await this.testRoute('GET', '/juridico/veiculos/dashboard/frota', null, 'Dashboard da frota');
    
    // Testes com parâmetros específicos
    await this.testRoute('GET', '/juridico/veiculos/empresa/1', null, 'Veículos da empresa 1');
    await this.testRoute('GET', '/juridico/veiculos/garagem/10', null, 'Veículos da garagem 10');
    await this.testRoute('GET', '/juridico/veiculos/condicao/A', null, 'Veículos ativos');
    
    // Busca por texto
    await this.testRoute('GET', '/juridico/veiculos/busca/A1', null, 'Busca veículos por texto');
    
    // Relatórios
    await this.testRoute('GET', '/juridico/veiculos/relatorio/empresa/1', null, 'Relatório por empresa');
  }

  async testMultasController() {
    console.log('\n🚨 ========== MULTAS CONTROLLER ==========');
    
    await this.testRoute('GET', '/juridico/multas', null, 'Lista todas as multas');
    await this.testRoute('GET', '/juridico/multas?page=1&limit=20', null, 'Multas paginadas');
    await this.testRoute('GET', '/juridico/multas/stats/geral', null, 'Estatísticas gerais de multas');
    await this.testRoute('GET', '/juridico/multas/dashboard/resumo', null, 'Dashboard resumo multas');
    
    // Situações específicas
    await this.testRoute('GET', '/juridico/multas/situacao/vencidas', null, 'Multas vencidas');
    await this.testRoute('GET', '/juridico/multas/situacao/recurso', null, 'Multas em recurso');
    
    // Relatórios
    const hoje = new Date().toISOString().split('T')[0];
    const mesPassado = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await this.testRoute('GET', `/juridico/multas/relatorio/periodo?dataInicio=${mesPassado}&dataFim=${hoje}`, null, 'Relatório por período');
  }

  async testInfracoesController() {
    console.log('\n⚠️ ========== INFRAÇÕES CONTROLLER ==========');
    
    await this.testRoute('GET', '/juridico/infracoes', null, 'Lista todas as infrações');
    await this.testRoute('GET', '/juridico/infracoes?page=1&limit=15', null, 'Infrações paginadas');
    await this.testRoute('GET', '/juridico/infracoes/stats/geral', null, 'Estatísticas gerais de infrações');
    await this.testRoute('GET', '/juridico/infracoes/dashboard/resumo', null, 'Dashboard infrações');
    
    // Agrupamentos
    await this.testRoute('GET', '/juridico/infracoes/stats/frequentes', null, 'Infrações mais frequentes');
    await this.testRoute('GET', '/juridico/infracoes/meta/grupos', null, 'Grupos de infrações');
    await this.testRoute('GET', '/juridico/infracoes/meta/orgaos', null, 'Órgãos autuadores');
    
    // Classificação por gravidade
    await this.testRoute('GET', '/juridico/infracoes/classificacao/gravidade', null, 'Infrações por gravidade');
    await this.testRoute('GET', '/juridico/infracoes/classificacao/gravidade?gravidade=GRAVE', null, 'Infrações graves');
    
    // Busca
    await this.testRoute('GET', '/juridico/infracoes/busca/velocidade', null, 'Busca infrações por texto');
    
    // Analytics
    await this.testRoute('GET', '/juridico/infracoes/comparativo/grupos', null, 'Comparativo entre grupos');
    await this.testRoute('GET', '/juridico/infracoes/analytics/tipos-multa', null, 'Análise tipos de multa');
  }

  async testAgentesController() {
    console.log('\n👮 ========== AGENTES CONTROLLER ==========');
    
    await this.testRoute('GET', '/juridico/agentes', null, 'Lista todos os agentes');
    await this.testRoute('GET', '/juridico/agentes?page=1&limit=10', null, 'Agentes paginados');
    await this.testRoute('GET', '/juridico/agentes/stats/geral', null, 'Estatísticas gerais de agentes');
    await this.testRoute('GET', '/juridico/agentes/dashboard/resumo', null, 'Dashboard agentes');
    
    // Top agentes
    await this.testRoute('GET', '/juridico/agentes/stats/top-agentes', null, 'Top agentes autuadores');
    await this.testRoute('GET', '/juridico/agentes/stats/top-agentes?limit=5', null, 'Top 5 agentes');
    
    // Busca
    await this.testRoute('GET', '/juridico/agentes/busca/silva', null, 'Busca agentes por texto');
  }

  async testDashboardController() {
    console.log('\n📊 ========== DASHBOARD CONTROLLER ==========');
    
    await this.testRoute('GET', '/departamentos/juridico/dashboard', null, 'Dashboard principal completo');
    await this.testRoute('GET', '/departamentos/juridico/dashboard/tempo-real', null, 'Métricas tempo real');
    await this.testRoute('GET', '/departamentos/juridico/dashboard/kpis', null, 'Indicadores KPI');
    await this.testRoute('GET', '/departamentos/juridico/dashboard/jobs', null, 'Status dos jobs');
    await this.testRoute('GET', '/departamentos/juridico/dashboard/sistema', null, 'Status do sistema');
    
    // Widgets específicos
    await this.testRoute('GET', '/departamentos/juridico/dashboard/widget/multas', null, 'Widget de multas');
    await this.testRoute('GET', '/departamentos/juridico/dashboard/widget/valores', null, 'Widget de valores');
    await this.testRoute('GET', '/departamentos/juridico/dashboard/widget/alertas', null, 'Widget de alertas');
    await this.testRoute('GET', '/departamentos/juridico/dashboard/widget/performance', null, 'Widget de performance');
  }

  async testJuridicoDashboardController() {
    console.log('\n📈 ========== JURIDICO DASHBOARD AVANÇADO ==========');
    
    await this.testRoute('GET', '/juridico/dashboard/principal', null, 'Dashboard principal avançado');
    await this.testRoute('GET', '/juridico/dashboard/financeiro', null, 'Dashboard financeiro');
    await this.testRoute('GET', '/juridico/dashboard/operacional', null, 'Dashboard operacional');
    await this.testRoute('GET', '/juridico/dashboard/executivo', null, 'Dashboard executivo');
    await this.testRoute('GET', '/juridico/dashboard/tempo-real', null, 'Métricas tempo real avançadas');
    await this.testRoute('GET', '/juridico/dashboard/resumo', null, 'Resumo rápido');
    await this.testRoute('GET', '/juridico/dashboard/status', null, 'Status sistema avançado');
  }

  async testAnalyticsController() {
    console.log('\n📊 ========== ANALYTICS CONTROLLER ==========');
    
    await this.testRoute('GET', '/departamentos/juridico/analytics/dashboard', null, 'Dashboard executivo analytics');
    await this.testRoute('GET', '/departamentos/juridico/analytics/dashboard?periodo=HOJE', null, 'Analytics hoje');
    await this.testRoute('GET', '/departamentos/juridico/analytics/dashboard?periodo=SEMANA', null, 'Analytics semana');
    await this.testRoute('GET', '/departamentos/juridico/analytics/dashboard?periodo=MES', null, 'Analytics mês');
    
    // Rankings
    await this.testRoute('GET', '/departamentos/juridico/analytics/rankings?tipo=agentes', null, 'Ranking agentes');
    await this.testRoute('GET', '/departamentos/juridico/analytics/rankings?tipo=garagens', null, 'Ranking garagens');
    await this.testRoute('GET', '/departamentos/juridico/analytics/rankings?tipo=infracoes', null, 'Ranking infrações');
    
    // Tendências
    await this.testRoute('GET', '/departamentos/juridico/analytics/tendencias?tipo=mensal', null, 'Tendências mensais');
    await this.testRoute('GET', '/departamentos/juridico/analytics/tendencias?tipo=trimestral', null, 'Tendências trimestrais');
    await this.testRoute('GET', '/departamentos/juridico/analytics/tendencias?tipo=anual', null, 'Tendências anuais');
  }

  async testGestaoController() {
    console.log('\n⚙️ ========== GESTÃO CONTROLLER ==========');
    
    await this.testRoute('GET', '/departamentos/juridico/gestao/monitoramento', null, 'Monitoramento sistema');
    await this.testRoute('GET', '/departamentos/juridico/gestao/sync/status', null, 'Status sincronização');
    await this.testRoute('GET', '/departamentos/juridico/gestao/dashboard', null, 'Dashboard monitoramento');
    await this.testRoute('GET', '/departamentos/juridico/gestao/saude', null, 'Relatório saúde sistema');
  }

  async testConfiguracaoController() {
    console.log('\n🔧 ========== CONFIGURAÇÃO CONTROLLER ==========');
    
    await this.testRoute('GET', '/departamentos/juridico/configuracoes', null, 'Todas configurações');
    await this.testRoute('GET', '/departamentos/juridico/configuracoes/categoria/CACHE', null, 'Configurações cache');
    await this.testRoute('GET', '/departamentos/juridico/configuracoes/categoria/SYNC', null, 'Configurações sync');
    await this.testRoute('GET', '/departamentos/juridico/configuracoes/categoria/ALERTS', null, 'Configurações alertas');
  }

  async testAlertaController() {
    console.log('\n🚨 ========== ALERTA CONTROLLER ==========');
    
    await this.testRoute('GET', '/departamentos/juridico/alertas', null, 'Lista alertas ativos');
    await this.testRoute('GET', '/departamentos/juridico/alertas?severidade=HIGH', null, 'Alertas alta severidade');
    await this.testRoute('GET', '/departamentos/juridico/alertas?severidade=CRITICAL', null, 'Alertas críticos');
    await this.testRoute('GET', '/departamentos/juridico/alertas/estatisticas', null, 'Estatísticas alertas');
  }

  async testSyncController() {
    console.log('\n🔄 ========== SYNC CONTROLLER ==========');
    
    await this.testRoute('GET', '/juridico/sync/status', null, 'Status sincronização');
  }

  async testReportController() {
    console.log('\n📋 ========== RELATÓRIOS CONTROLLER ==========');
    
    const hoje = new Date().toISOString().split('T')[0];
    const mesPassado = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await this.testRoute('GET', `/juridico/relatorios/executivo?dataInicio=${mesPassado}&dataFim=${hoje}`, null, 'Relatório executivo');
    await this.testRoute('GET', '/juridico/relatorios/inadimplencia', null, 'Relatório inadimplência');
    await this.testRoute('GET', `/juridico/relatorios/produtividade?dataInicio=${mesPassado}&dataFim=${hoje}`, null, 'Relatório produtividade');
    await this.testRoute('GET', `/juridico/relatorios/financeiro?dataInicio=${mesPassado}&dataFim=${hoje}`, null, 'Relatório financeiro');
    await this.testRoute('GET', '/juridico/relatorios/operacional', null, 'Relatório operacional');
    await this.testRoute('GET', '/juridico/relatorios/disponiveis', null, 'Lista relatórios disponíveis');
  }

  // ==================== TESTE PRINCIPAL ====================
  async runAllTests() {
    console.log('🚀 ========== INICIANDO TESTES COMPLETOS DO SISTEMA JURÍDICO ==========');
    console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    
    try {
      // 1. Autenticação
      await this.authenticate();
      
      // 2. Testes básicos
      await this.testHealthRoutes();
      
      // 3. Core jurídico
      await this.testJuridicoCore();
      
      // 4. Controllers principais
      await this.testVeiculosController();
      await this.testMultasController();
      await this.testInfracoesController();
      await this.testAgentesController();
      
      // 5. Dashboards
      await this.testDashboardController();
      await this.testJuridicoDashboardController();
      
      // 6. Analytics
      await this.testAnalyticsController();
      
      // 7. Gestão e configuração
      await this.testGestaoController();
      await this.testConfiguracaoController();
      
      // 8. Alertas e sync
      await this.testAlertaController();
      await this.testSyncController();
      
      // 9. Relatórios
      await this.testReportController();
      
      // 10. Gerar relatório final
      this.generateFinalReport();
      
    } catch (error) {
      console.error('💥 Erro crítico durante os testes:', error.message);
      this.generateFinalReport();
    }
  }

  // ==================== RELATÓRIO FINAL ====================
  generateFinalReport() {
    const totalTime = Date.now() - this.startTime;
    const successRate = (this.results.success.length / this.results.total) * 100;
    
    console.log('\n📊 ========== RELATÓRIO FINAL DOS TESTES ==========');
    console.log(`⏱️  Tempo total: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📈 Taxa de sucesso: ${successRate.toFixed(1)}%`);
    console.log(`✅ Sucessos: ${this.results.success.length}`);
    console.log(`❌ Falhas: ${this.results.failed.length}`);
    console.log(`⚠️  Avisos: ${this.results.warnings.length}`);
    console.log(`🧪 Total testado: ${this.results.total} endpoints`);
    
    // Agrupar por controller
    const byController = {};
    this.results.success.forEach(result => {
      const controller = this.getControllerName(result.endpoint);
      if (!byController[controller]) byController[controller] = { success: 0, total: 0 };
      byController[controller].success++;
      byController[controller].total++;
    });
    
    this.results.failed.forEach(result => {
      const controller = this.getControllerName(result.endpoint);
      if (!byController[controller]) byController[controller] = { success: 0, total: 0 };
      byController[controller].total++;
    });
    
    console.log('\n📋 Resultados por Controller:');
    Object.entries(byController).forEach(([controller, stats]) => {
      const rate = (stats.success / stats.total) * 100;
      console.log(`   ${controller}: ${stats.success}/${stats.total} (${rate.toFixed(1)}%)`);
    });
    
    // Endpoints com problemas
    if (this.results.failed.length > 0) {
      console.log('\n❌ Endpoints com falhas:');
      this.results.failed.forEach(fail => {
        console.log(`   ${fail.method} ${fail.endpoint} - ${fail.error}: ${fail.message}`);
      });
    }
    
    // Endpoints lentos
    const slowEndpoints = this.results.success.filter(r => r.responseTime > 2000);
    if (slowEndpoints.length > 0) {
      console.log('\n🐌 Endpoints lentos (>2s):');
      slowEndpoints.forEach(slow => {
        console.log(`   ${slow.endpoint} - ${slow.responseTime}ms`);
      });
    }
    
    // Salvar relatório detalhado
    this.saveDetailedReport();
    
    console.log('\n✅ Testes concluídos! Relatório detalhado salvo em: test-results.json');
  }

  getControllerName(endpoint) {
    if (endpoint.includes('/juridico/veiculos')) return 'Veículos';
    if (endpoint.includes('/juridico/multas')) return 'Multas';
    if (endpoint.includes('/juridico/infracoes')) return 'Infrações';
    if (endpoint.includes('/juridico/agentes')) return 'Agentes';
    if (endpoint.includes('/juridico/dashboard')) return 'Dashboard Avançado';
    if (endpoint.includes('/juridico/relatorios')) return 'Relatórios';
    if (endpoint.includes('/juridico/sync')) return 'Sincronização';
    if (endpoint.includes('/departamentos/juridico/dashboard')) return 'Dashboard Principal';
    if (endpoint.includes('/departamentos/juridico/analytics')) return 'Analytics';
    if (endpoint.includes('/departamentos/juridico/gestao')) return 'Gestão';
    if (endpoint.includes('/departamentos/juridico/configuracoes')) return 'Configurações';
    if (endpoint.includes('/departamentos/juridico/alertas')) return 'Alertas';
    if (endpoint.includes('/departamentos/juridico')) return 'Core Jurídico';
    if (endpoint.includes('/health')) return 'Health';
    if (endpoint.includes('/oracle')) return 'Oracle';
    return 'Outros';
  }

  saveDetailedReport() {
    const report = {
      summary: {
        totalTests: this.results.total,
        successCount: this.results.success.length,
        failureCount: this.results.failed.length,
        warningCount: this.results.warnings.length,
        successRate: (this.results.success.length / this.results.total) * 100,
        totalTime: Date.now() - this.startTime,
        timestamp: new Date().toISOString()
      },
      results: this.results,
      environment: {
        baseUrl: this.baseUrl,
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    try {
      fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));
      console.log('💾 Relatório detalhado salvo em test-results.json');
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error.message);
    }
  }
}

// ==================== EXECUÇÃO ====================
async function main() {
  const tester = new JuridicoSystemTester();
  await tester.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = JuridicoSystemTester;