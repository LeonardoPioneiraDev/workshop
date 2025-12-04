// apps/frontend/src/services/api/client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

const normalizeBaseUrl = (raw?: string): string => {
  const fallback = 'http://localhost:3333';
  let v = (raw || '').toString().trim();
  if (!v) return fallback;
  // Corrigir casos comuns: 'http:localhost:3333', 'http:/localhost:3333'
  if (/^\w+:\w+/i.test(v) && !/^\w+:\/\//i.test(v)) v = v.replace(/^([a-z]+):/i, '$1://');
  if (/^\w+:\/(?!\/)/i.test(v)) v = v.replace(/^([a-z]+):\//i, '$1://');
  // Se ainda for inválida, tentar prefixar http://
  if (!/^\w+:\/\//i.test(v)) v = `http://${v.replace(/^\/+/, '')}`;
  try {
    const u = new URL(v);
    return `${u.protocol}//${u.host}`; // manter apenas origem (sem path), sem barra final
  } catch {
    return fallback;
  }
};

// Força uma origem válida mesmo que a string venha sem '//'
const coerceValidOrigin = (raw?: string): string => {
  const fallback = 'http://localhost:3333';
  let v = (raw || '').toString().trim();
  if (!v) return fallback;
  if (v.startsWith('http:') && !v.startsWith('http://')) v = 'http://' + v.slice('http:'.length);
  if (v.startsWith('https:') && !v.startsWith('https://')) v = 'https://' + v.slice('https:'.length);
  if (v.startsWith('http:/') && !v.startsWith('http://')) v = v.replace(/^http:\//, 'http://');
  if (v.startsWith('https:/') && !v.startsWith('https://')) v = v.replace(/^https:\//, 'https://');
  if (!/^\w+:\/\//i.test(v)) v = `http://${v.replace(/^\/+/, '')}`;
  try { const u = new URL(v); return `${u.protocol}//${u.host}`; } catch { return fallback; }
};

const resolveBaseUrl = (): string => {
  // Preferir configuração em tempo de execução (window.APP_CONFIG) para não exigir rebuild
  const fromWindow = typeof window !== 'undefined' && (window as any)?.APP_CONFIG?.API_BASE_URL;
  const fromVite = (import.meta as any)?.env?.VITE_API_BASE_URL;
  return normalizeBaseUrl((fromWindow as any) || (fromVite as any) || undefined);
};

class ApiClient {
  private client: AxiosInstance;
  private refreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    const baseURL = resolveBaseUrl();
    try { console.debug('[API] baseURL resolvido:', baseURL); } catch {}
    this.client = axios.create({
      baseURL, // não confie nisso para montar URL final; métodos abaixo sempre constroem absoluta
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }

  private isAbsolute(u: string): boolean { return /^\w+:\/\//i.test(u); }

  private setupInterceptors() {
    this.client.interceptors.request.use((config) => {
      // Apenas injeta o token; a URL absoluta é montada nos métodos get/post/put/delete
      const token = this.getToken();
      if (token) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const originalRequest = error.config || {};
        if (status === 401 && !originalRequest._retry && !(originalRequest?.url || '').includes('/auth/refresh')) {
          originalRequest._retry = true;
          const newToken = await this.refreshToken();
          if (newToken) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          }
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    try { return localStorage.getItem('access_token'); } catch { return null; }
  }

  private async refreshToken(): Promise<string | null> {
    if (this.refreshing && this.refreshPromise) return this.refreshPromise;
    this.refreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) return null;
        const resp = await this.client.post('/auth/refresh', { refresh_token: refresh });
        const data = resp?.data || {};
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
          return data.access_token as string;
        }
        return null;
      } catch {
        return null;
      } finally {
        this.refreshing = false;
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  private handleAuthError() {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } finally {
      if (!window.location.pathname.includes('/login')) window.location.href = '/login';
    }
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const base = coerceValidOrigin(resolveBaseUrl());
    const baseWithSlash = /\/$/.test(base) ? base : `${base}/`;
    const finalUrl = this.isAbsolute(url)
      ? url
      : new URL((url || '').replace(/^\/+/, ''), baseWithSlash).toString();
    try { console.debug('[API][GET]', finalUrl, params ? { params } : ''); } catch {}
    const response: AxiosResponse<T> = await this.client.get(finalUrl, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any, params?: any): Promise<T> {
    const cfg = params ? { params } : {};
    const base = coerceValidOrigin(resolveBaseUrl());
    const baseWithSlash = /\/$/.test(base) ? base : `${base}/`;
    const finalUrl = this.isAbsolute(url)
      ? url
      : new URL((url || '').replace(/^\/+/, ''), baseWithSlash).toString();
    try { console.debug('[API][POST]', finalUrl, cfg); } catch {}
    const response: AxiosResponse<T> = await this.client.post(finalUrl, data, cfg);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const base = coerceValidOrigin(resolveBaseUrl());
    const baseWithSlash = /\/$/.test(base) ? base : `${base}/`;
    const finalUrl = this.isAbsolute(url)
      ? url
      : new URL((url || '').replace(/^\/+/, ''), baseWithSlash).toString();
    try { console.debug('[API][PUT]', finalUrl); } catch {}
    const response: AxiosResponse<T> = await this.client.put(finalUrl, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const base = coerceValidOrigin(resolveBaseUrl());
    const baseWithSlash = /\/$/.test(base) ? base : `${base}/`;
    const finalUrl = this.isAbsolute(url)
      ? url
      : new URL((url || '').replace(/^\/+/, ''), baseWithSlash).toString();
    try { console.debug('[API][DELETE]', finalUrl); } catch {}
    const response: AxiosResponse<T> = await this.client.delete(finalUrl);
    return response.data;
  }

  // Basic auth helpers used elsewhere
  async login(credentials: { username: string; password: string }): Promise<any> {
    const data = await this.post<any>('/auth/login', credentials);
    if (data?.access_token && data?.user) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      return data;
    }
    throw new Error('Falha no login');
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
}

export const apiClient = new ApiClient();
export const api = apiClient;
export default apiClient;

// Utilitário para outras camadas obterem a base efetiva
export const getBaseUrl = (): string => resolveBaseUrl();
