// apps/frontend/src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// ✅ CONFIGURAÇÃO DE URL COM PRIORIDADES
const getApiUrl = (): string => {
  // Prioridade de configuração:
  // 1. Variável de ambiente VITE_API_BASE_URL (definida no .env)
  // 2. Variável API_URL (definida no Docker)
  // 3. Fallback para o endpoint direto
  return import.meta.env.VITE_API_BASE_URL || 
         (window as any).API_URL || 
         'http://localhost:3336';
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getApiUrl(),
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    console.log('🌐 API Client inicializado com baseURL:', getApiUrl());
  }

  private setupInterceptors() {
    // ✅ REQUEST INTERCEPTOR - ADICIONAR TOKEN JWT
    this.client.interceptors.request.use(
      (config) => {
        // Adicionar token JWT automaticamente
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(`🔑 Token adicionado: ${config.method?.toUpperCase()} ${config.url}`);
        } else {
          // Só mostrar warning para rotas que precisam de auth
          if (this.requiresAuth(config.url || '')) {
            console.warn(`⚠️ Token não encontrado para rota protegida: ${config.method?.toUpperCase()} ${config.url}`);
          }
        }

        // Log da requisição (comentado para produção)
        console.log(`🔄 Requisição: ${config.method?.toUpperCase()} ${config.url}`, config.params || {});
        
        return config;
      },
      (error) => {
        console.error('❌ Erro no interceptor de request:', error);
        return Promise.reject(error);
      }
    );

    // ✅ RESPONSE INTERCEPTOR - TRATAR 401 E LOGS
    this.client.interceptors.response.use(
      (response) => {
        // Log da resposta (comentado para produção)
        console.log(`✅ Resposta: ${response.config.method?.toUpperCase()} ${response.config.url}`, 
                   response.status, 
                   response.data ? (Array.isArray(response.data) ? `Array[${response.data.length}]` : typeof response.data) : 'Sem dados');

        // Log melhorado para dados específicos
        if (response.data) {
          const logData: any = {
            success: response.data?.success,
            message: response.data?.message,
            totalData: response.data?.data?.length || (typeof response.data?.data === 'object' ? 'object' : 'unknown'),
          };

          // Informações de cache
          if (response.data?.cache) {
            logData.cache = response.data.cache;
          }

          // Informações de performance
          if (response.data?.metadados) {
            logData.performance = {
              oracle: response.data.metadados.totalConsultasOracle,
              cache: response.data.metadados.totalConsultasCache,
              tempo: response.data.metadados.tempoTotalExecucao
            };
          }

          console.log('📊 Data preview:', logData);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        // Log do erro
        console.error('❌ Erro na resposta:', error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Dados:', error.response.data);
        } else if (error.request) {
          console.error('Sem resposta do servidor. Verifique a conexão.');
        }

        // ✅ TRATAR ERRO 401 - TOKEN EXPIRADO
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.warn('🔄 Token expirado (401), tentando renovar...');
          
          try {
            const newToken = await this.refreshToken();
            
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              console.log('✅ Token renovado, repetindo requisição');
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            console.error('❌ Erro ao renovar token:', refreshError);
            this.handleAuthError();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // ✅ VERIFICAR SE ROTA REQUER AUTENTICAÇÃO
  private requiresAuth(url: string): boolean {
    const protectedRoutes = [
      '/departamentos/',
      '/users/',
      '/auth/refresh',
      '/auth/logout'
    ];
    
    return protectedRoutes.some(route => url.includes(route));
  }

  // ✅ OBTER TOKEN DO LOCALSTORAGE
  private getToken(): string | null {
    try {
      return localStorage.getItem('access_token');
    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      return null;
    }
  }

  // ✅ RENOVAR TOKEN
  private async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        console.warn('⚠️ Nenhum refresh token encontrado');
        return null;
      }

      console.log('🔄 Tentando renovar token...');

      const response = await fetch(`${getApiUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }
          console.log('✅ Token renovado com sucesso');
          return data.access_token;
        }
      }

      console.error('❌ Falha ao renovar token:', response.status);
      return null;

    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      return null;
    }
  }

  // ✅ TRATAR ERRO DE AUTENTICAÇÃO
  private handleAuthError(): void {
    console.warn('🚪 Redirecionando para login devido a erro de autenticação');
    
    // Limpar tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Redirecionar para login apenas se não estiver já na página de login
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  // ✅ MÉTODOS HTTP
  async get<T>(url: string, params?: any): Promise<T> {
    const filteredParams = this.filterParams(params);
    
    const response: AxiosResponse<T> = await this.client.get(url, { 
      params: filteredParams 
    });
    return response.data;
  }

  async post<T>(url: string, data?: any, params?: any): Promise<T> {
    const filteredParams = this.filterParams(params);
    const config = Object.keys(filteredParams).length > 0 ? { params: filteredParams } : {};
    
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }

  // ✅ FILTRO DE PARÂMETROS
  private filterParams(params?: any): any {
    const filteredParams: any = {};
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filteredParams[key] = value;
        } else if (value === false || value === 0) {
          filteredParams[key] = value;
        }
      });
    }
    
    return filteredParams;
  }

  // ✅ MÉTODOS DE AUTENTICAÇÃO
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  async login(credentials: { username: string; password: string }): Promise<any> {
    try {
      console.log('🔐 Fazendo login...');
      
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.access_token && data.user) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }
          
          console.log('✅ Login realizado com sucesso:', data.user.username);
          return data;
        }
      }

      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Falha no login:', response.status, errorData);
      throw new Error(errorData.message || 'Erro no login');

    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    console.log('✅ Logout realizado');
  }

  // ✅ OBTER USUÁRIO
  getUser(): any {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('❌ Erro ao obter usuário:', error);
      return null;
    }
  }
}

// ✅ INSTÂNCIA ÚNICA
const apiClient = new ApiClient();

// ✅ EXPORTAÇÕES
export const api = apiClient;
export default apiClient;

// ✅ CLASSE PARA COMPATIBILIDADE
export class AuthService {
  static getToken() { return apiClient.getToken(); }
  static isAuthenticated() { return apiClient.isAuthenticated(); }
  static async login(credentials: any) { return apiClient.login(credentials); }
  static logout() { return apiClient.logout(); }
  static getUser() { return apiClient.getUser(); }
  static async refreshToken() { return apiClient.refreshToken(); }
}