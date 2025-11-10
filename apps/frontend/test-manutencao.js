// Teste simples para verificar se a API de manutenção está funcionando
// Execute no console do browser após login

console.log('🧪 Testando API de Manutenção...');

// Simular uma chamada da API
const testarAPI = async () => {
  try {
    const response = await fetch('/departamentos/manutencao/os-data?startDate=2025-01-01&endDate=2025-12-31&limit=5', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log('📊 Resposta da API:', data);
    console.log('📋 Estrutura:', {
      temData: !!data.data,
      ehArray: Array.isArray(data.data),
      total: data.data?.length || 0,
      success: data.success,
      message: data.message
    });

    if (data.data && data.data.length > 0) {
      console.log('✅ API funcionando! Total de OS:', data.data.length);
      console.log('📄 Primeira OS:', data.data[0]);
    } else {
      console.log('⚠️ API retornou mas sem dados');
    }

  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
};

// Se executado no navegador
if (typeof window !== 'undefined') {
  testarAPI();
} else {
  console.log('Execute este script no console do navegador após fazer login');
}