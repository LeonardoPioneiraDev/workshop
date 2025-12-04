// src/utils/testLegalSystem.ts

import { legalService } from '@/services/departments/legal/legalService';
import { apiClient, testConnection, checkLegalEndpoints } from '@/services/api/client';

export const testLegalSystem = async () => {
  console.log('🧪 [TEST_LEGAL_SYSTEM] Iniciando testes do sistema jurídico...');
  
  const results = {
    connectivity: false,
    endpoints: [],
    dashboard: false,
    multas: false,
    processos: false,
    contratos: false,
    errors: []
  };

  try {
    // Teste 1: Conectividade básica
    console.log('🔍 Testando conectividade...');
    results.connectivity = await testConnection();
    
    // Teste 2: Endpoints jurídicos
    console.log('⚖️ Testando endpoints jurídicos...');
    results.endpoints = await checkLegalEndpoints();
    
    // Teste 3: Dashboard
    console.log('📊 Testando dashboard...');
    try {
      const dashboard = await legalService.getDashboard();
      results.dashboard = !!dashboard;
      console.log('✅ Dashboard OK:', dashboard);
    } catch (error) {
      results.errors.push(`Dashboard: ${error}`);
      console.error('❌ Dashboard falhou:', error);
    }
    
    // Teste 4: Multas
    console.log('�� Testando multas...');
    try {
      const multas = await legalService.getMultas({ limit: 5 });
      results.multas = !!multas && multas.data.length > 0;
      console.log('✅ Multas OK:', multas.data.length, 'registros');
    } catch (error) {
      results.errors.push(`Multas: ${error}`);
      console.error('❌ Multas falharam:', error);
    }
    
    // Teste 5: Processos
    console.log('⚖️ Testando processos...');
    try {
      const processos = await legalService.getProcessos({ limit: 5 });
      results.processos = !!processos && processos.data.length >= 0;
      console.log('✅ Processos OK:', processos.data.length, 'registros');
    } catch (error) {
      results.errors.push(`Processos: ${error}`);
      console.error('❌ Processos falharam:', error);
    }
    
    // Teste 6: Contratos
    console.log('📄 Testando contratos...');
    try {
      const contratos = await legalService.getContratos({ limit: 5 });
      results.contratos = !!contratos && contratos.data.length >= 0;
      console.log('✅ Contratos OK:', contratos.data.length, 'registros');
    } catch (error) {
      results.errors.push(`Contratos: ${error}`);
      console.error('❌ Contratos falharam:', error);
    }
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error);
    results.errors.push(`Erro geral: ${error}`);
  }

  console.log('🧪 [TEST_LEGAL_SYSTEM] Testes concluídos:', results);
  return results;
};

// Função para executar no console do navegador
(window as any).testLegalSystem = testLegalSystem;