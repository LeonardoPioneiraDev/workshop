// apps/frontend/src/services/api/client.ts
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'http://localhost:3336',
      timeout: 1800000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // ✅ REQUEST INTERCEPTOR - ADICIONAR TOKEN JWT
    this.client.interceptors.request.use(
      (config) => {
        // ✅ ADICIONAR TOKEN JWT AUTOMATICAMENTE
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(`🔑 Token adicionado à requisição: ${config.method?.toUpperCase()} ${config.url}`);
        } else {
          console.warn(`⚠️ Nenhum token encontrado para: ${config.method?.toUpperCase()} ${config.url}`);
        }

        // Log detalhado da requisição
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // Log dos parâmetros se existirem
        if (config.params) {
          console.log('📋 Parâmetros enviados:', config.params);
          
          // Construir URL completa para debug
          const url = new URL(config.url!, config.baseURL);
          Object.entries(config.params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              url.searchParams.set(key, String(value));
            }
          });
          console.log('🔗 URL completa:', url.toString());
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Erro no interceptor de request:', error);
        return Promise.reject(error);
      }
    );

    // ✅ RESPONSE INTERCEPTOR - TRATAR 401 E RENOVAR TOKEN
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} - ${response.config.url}`);
        
        // Log melhorado com informações de cache
        const logData: any = {
          success: response.data?.success,
          message: response.data?.message,
          totalData: response.data?.data?.length || (typeof response.data?.data === 'object' ? 'object' : 'unknown'),
          pagination: response.data?.pagination
        };

        // Adicionar informações de cache se disponíveis
        if (response.data?.cache) {
          logData.cache = response.data.cache;
        }

        // Adicionar informações de performance se disponíveis
        if (response.data?.metadados?.totalConsultasOracle !== undefined) {
          logData.performance = {
            oracle: response.data.metadados.totalConsultasOracle,
            cache: response.data.metadados.totalConsultasCache,
            tempo: response.data.metadados.tempoTotalExecucao
          };
        }

        // Adicionar informações de fonte se disponíveis
        if (response.data?.data?.fonte) {
          logData.fonte = response.data.data.fonte;
        }

        console.log('📊 Data preview:', logData);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        console.error(`❌ API Error: ${error.response?.status} - ${error.config?.url}`);
        console.error('📋 Error details:', error.response?.data);

        // ✅ TRATAR ERRO 401 - TOKEN EXPIRADO
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.warn('🔄 Token expirado, tentando renovar...');
          
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

      const response = await fetch('http://localhost:3336/auth/refresh', {
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
    
    // Redirecionar para login
    window.location.href = '/login';
  }

  // ✅ MÉTODOS HTTP COM FILTRO DE PARÂMETROS MELHORADO
  async get<T>(url: string, params?: any): Promise<T> {
    const filteredParams = this.filterParams(params);
    console.log('🔍 Parâmetros filtrados:', filteredParams);

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

  // ✅ FILTRO DE PARÂMETROS MELHORADO
  private filterParams(params?: any): any {
    const filteredParams: any = {};
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Preservar valores válidos incluindo false e 0
        if (value !== undefined && value !== null && value !== '') {
          filteredParams[key] = value;
        } else if (value === false || value === 0) {
          filteredParams[key] = value;
        }
      });
    }
    
    return filteredParams;
  }

  // ✅ MÉTODO PARA VERIFICAR SE ESTÁ AUTENTICADO
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // ✅ MÉTODO PARA FAZER LOGIN
  async login(credentials: { username: string; password: string }): Promise<any> {
    try {
      console.log('🔐 Fazendo login...');
      
      const response = await fetch('http://localhost:3336/auth/login', {
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

  // ✅ MÉTODO PARA FAZER LOGOUT
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    console.log('✅ Logout realizado');
  }
}

export const apiClient = new ApiClient();

// ✅ EXPORTAR INSTÂNCIA COMO 'api' PARA COMPATIBILIDADE
export const api = apiClient;