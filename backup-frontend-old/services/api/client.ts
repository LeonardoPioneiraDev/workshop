// apps/frontend/src/services/api/client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'http://localhost:3333',
      timeout: 1800000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para logs detalhados
    this.client.interceptors.request.use(
      (config) => {
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
      (error) => Promise.reject(error)
    );

    // Response interceptor para logs e tratamento
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} - ${response.config.url}`);
        
        // ✅ LOG MELHORADO COM INFORMAÇÕES DE CACHE
        const logData: any = {
          success: response.data?.success,
          message: response.data?.message,
          totalData: response.data?.data?.length || (typeof response.data?.data === 'object' ? 'object' : 'unknown'),
          pagination: response.data?.pagination
        };

        // ✅ ADICIONAR INFORMAÇÕES DE CACHE SE DISPONÍVEIS
        if (response.data?.cache) {
          logData.cache = response.data.cache;
        }

        // ✅ ADICIONAR INFORMAÇÕES DE PERFORMANCE SE DISPONÍVEIS
        if (response.data?.metadados?.totalConsultasOracle !== undefined) {
          logData.performance = {
            oracle: response.data.metadados.totalConsultasOracle,
            cache: response.data.metadados.totalConsultasCache,
            tempo: response.data.metadados.tempoTotalExecucao
          };
        }

        // ✅ ADICIONAR INFORMAÇÕES DE FONTE SE DISPONÍVEIS
        if (response.data?.data?.fonte) {
          logData.fonte = response.data.data.fonte;
        }

        console.log('📊 Data preview:', logData);
        return response;
      },
      (error) => {
        console.error(`❌ API Error: ${error.response?.status} - ${error.config?.url}`);
        console.error('📋 Error details:', error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    // ✅ FILTRO CORRIGIDO - Preservar valores falsy válidos
    const filteredParams: any = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // ✅ CORREÇÃO: Preservar false, 0, e outros valores válidos
        if (value !== undefined && value !== null && value !== '') {
          filteredParams[key] = value;
        }
        // ✅ ESPECIAL: Preservar boolean false explicitamente
        else if (value === false) {
          filteredParams[key] = value;
        }
        // ✅ ESPECIAL: Preservar número 0 explicitamente
        else if (value === 0) {
          filteredParams[key] = value;
        }
      });
    }

    console.log('🔍 Parâmetros filtrados:', filteredParams);

    const response: AxiosResponse<T> = await this.client.get(url, { 
      params: filteredParams 
    });
    return response.data;
  }

  async post<T>(url: string, data?: any, params?: any): Promise<T> {
    // ✅ FILTRAR PARÂMETROS TAMBÉM NO POST
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
}

export const apiClient = new ApiClient();

// ✅ EXPORTAR INSTÂNCIA COMO 'api' PARA COMPATIBILIDADE
export const api = apiClient;