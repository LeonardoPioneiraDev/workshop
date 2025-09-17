import axios from 'axios';

// Prioridade de configuração:
// 1. Variável de ambiente VITE_API_BASE_URL (definida no .env)
// 2. Variável API_URL (definida no Docker)
// 3. Fallback para o endpoint /api (para uso com proxy)

// Para desenvolvimento com Docker
const apiUrl = import.meta.env.VITE_API_BASE_URL || 
               (window as any).API_URL || 
               '/api';

export const api = axios.create({
  baseURL: apiUrl,
  // Aumentar o timeout para 30 segundos
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptors para tratamento de erros e logging
api.interceptors.request.use(
  config => {
    //console.log(`🔄 Requisição: ${config.method?.toUpperCase()} ${config.url}`, config.params || {});
    return config;
  },
  error => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
  //  console.log(`✅ Resposta: ${response.config.method?.toUpperCase()} ${response.config.url}`, 
    //            response.status, 
  //              response.data ? (Array.isArray(response.data) ? `Array[${response.data.length}]` : typeof response.data) : 'Sem dados');
    return response;
  },
  error => {
    // Tratamento de erro global
   // console.error('❌ Erro na resposta:', error.message);
    if (error.response) {
    //  console.error('Status:', error.response.status);
   //   console.error('Dados:', error.response.data);
    } else if (error.request) {
    //  console.error('Sem resposta do servidor. Verifique a conexão.');
    }
    return Promise.reject(error);
  }
);