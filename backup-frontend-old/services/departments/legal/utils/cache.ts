// apps/frontend/src/services/departments/legal/utils/cache.ts

import { InfoCache } from '../types';

// =========================================================================
// INTERFACE DO CACHE
// =========================================================================

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  fonte: string;
  hits: number;
}

interface CacheStats {
  totalItems: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  oldestItem?: string;
  newestItem?: string;
}

interface CacheConfig {
  defaultTTL: number; // em milissegundos
  maxItems: number;
  enableStats: boolean;
  enableLogging: boolean;
}

// =========================================================================
// CLASSE DE CACHE UNIFICADO
// =========================================================================

class LegalCache {
  private cache = new Map<string, CacheItem>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  
  private config: CacheConfig = {
    defaultTTL: 30 * 60 * 1000, // 30 minutos
    maxItems: 1000,
    enableStats: true,
    enableLogging: true
  };

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Limpeza automática a cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
    
    this.log('Cache inicializado', this.config);
  }

  // =========================================================================
  // MÉTODOS PRINCIPAIS
  // =========================================================================

  /**
   * Armazena item no cache
   */
  set<T>(key: string, data: T, ttl?: number, fonte: string = 'unknown'): void {
    try {
      // Verificar limite de itens
      if (this.cache.size >= this.config.maxItems) {
        this.evictOldest();
      }

      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
        key,
        fonte,
        hits: 0
      };

      this.cache.set(key, item);
      this.stats.sets++;
      
      this.log(`Cache SET: ${key}`, { fonte, ttl: item.ttl });
    } catch (error) {
      console.error('Erro ao armazenar no cache:', error);
    }
  }

  /**
   * Recupera item do cache
   */
  get<T>(key: string): { data: T; info: InfoCache } | null {
    try {
      const item = this.cache.get(key) as CacheItem<T> | undefined;
      
      if (!item) {
        this.stats.misses++;
        this.log(`Cache MISS: ${key}`);
        return null;
      }

      // Verificar se expirou
      const now = Date.now();
      const age = now - item.timestamp;
      
      if (age > item.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        this.log(`Cache EXPIRED: ${key}`, { age, ttl: item.ttl });
        return null;
      }

      // Incrementar hits
      item.hits++;
      this.stats.hits++;
      
      const info: InfoCache = {
        fromCache: true,
        fonte: item.fonte,
        tempoConsulta: 0, // Cache é instantâneo
        ttlRestante: item.ttl - age,
        hitRate: this.getHitRate(),
        ultimaAtualizacao: new Date(item.timestamp).toISOString()
      };

      this.log(`Cache HIT: ${key}`, { hits: item.hits, ttlRestante: info.ttlRestante });
      
      return { data: item.data, info };
    } catch (error) {
      console.error('Erro ao recuperar do cache:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Verifica se item existe e não expirou
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const age = Date.now() - item.timestamp;
    if (age > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove item do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.log(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.log(`Cache CLEAR: ${size} itens removidos`);
  }

  // =========================================================================
  // MÉTODOS DE LIMPEZA
  // =========================================================================

  /**
   * Remove itens expirados
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.cache.entries()) {
      const age = now - item.timestamp;
      if (age > item.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.log(`Cache CLEANUP: ${removed} itens expirados removidos`);
    }
  }

  /**
   * Remove o item mais antigo (LRU)
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.log(`Cache EVICT: ${oldestKey} (mais antigo)`);
    }
  }

  /**
   * Remove itens por padrão de chave
   */
  deleteByPattern(pattern: string): number {
    let removed = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.log(`Cache DELETE PATTERN: ${pattern} - ${removed} itens removidos`);
    }

    return removed;
  }

  // =========================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // =========================================================================

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    const items = Array.from(this.cache.values());
    const totalHits = this.stats.hits;
    const totalMisses = this.stats.misses;
    const totalRequests = totalHits + totalMisses;

    return {
      totalItems: this.cache.size,
      totalHits,
      totalMisses,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage(),
      oldestItem: this.getOldestKey(),
      newestItem: this.getNewestKey()
    };
  }

  /**
   * Obtém taxa de acerto
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Estima uso de memória
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const item of this.cache.values()) {
      // Estimativa simples baseada no JSON
      size += JSON.stringify(item).length * 2; // 2 bytes por caractere
    }
    
    return size;
  }

  /**
   * Obtém chave do item mais antigo
   */
  private getOldestKey(): string | undefined {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey || undefined;
  }

  /**
   * Obtém chave do item mais novo
   */
  private getNewestKey(): string | undefined {
    let newestKey = '';
    let newestTime = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp > newestTime) {
        newestTime = item.timestamp;
        newestKey = key;
      }
    }

    return newestKey || undefined;
  }

  // =========================================================================
  // MÉTODOS UTILITÁRIOS
  // =========================================================================

  /**
   * Gera chave de cache baseada em parâmetros
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    // Ordenar parâmetros para garantir consistência
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          result[key] = params[key];
        }
        return result;
      }, {} as Record<string, any>);

    const paramString = JSON.stringify(sortedParams);
    return `${prefix}:${this.hashCode(paramString)}`;
  }

  /**
   * Gera hash simples para string
   */
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32bit
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Log condicional
   */
  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`💾 [CACHE] ${message}`, data || '');
    }
  }

  // =========================================================================
  // MÉTODOS DE CONFIGURAÇÃO
  // =========================================================================

  /**
   * Atualiza configuração do cache
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('Configuração atualizada', this.config);
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }
}

// =========================================================================
// INSTÂNCIA GLOBAL E ESTRATÉGIAS
// =========================================================================

/**
 * Instância global do cache
 */
export const legalCache = new LegalCache({
  defaultTTL: 30 * 60 * 1000, // 30 minutos
  maxItems: 1000,
  enableStats: true,
  enableLogging: process.env.NODE_ENV === 'development'
});

/**
 * Estratégias de cache
 */
export const CacheStrategy = {
  /**
   * Cache First - Tenta cache primeiro, depois API
   */
  CACHE_FIRST: 'CACHE_FIRST',
  
  /**
   * Oracle First - Tenta Oracle primeiro, cache como fallback
   */
  ORACLE_FIRST: 'ORACLE_FIRST',
  
  /**
   * Hybrid - Usa cache se válido, senão Oracle
   */
  HYBRID: 'HYBRID',
  
  /**
   * Cache Only - Apenas cache, não faz requisições
   */
  CACHE_ONLY: 'CACHE_ONLY'
} as const;

/**
 * TTL padrão por tipo de dados
 */
export const CacheTTL = {
  MULTAS: 30 * 60 * 1000,      // 30 minutos
  AGENTES: 60 * 60 * 1000,     // 1 hora
  DASHBOARD: 15 * 60 * 1000,   // 15 minutos
  ANALYTICS: 45 * 60 * 1000,   // 45 minutos
  SETORES: 2 * 60 * 60 * 1000, // 2 horas
  SYNC: 5 * 60 * 1000          // 5 minutos
} as const;

// =========================================================================
// FUNÇÕES UTILITÁRIAS
// =========================================================================

/**
 * Cria chave de cache para multas
 */
export const createMultasKey = (filtros: Record<string, any>): string => {
  return legalCache.generateKey('multas', filtros);
};

/**
 * Cria chave de cache para agentes
 */
export const createAgentesKey = (filtros: Record<string, any>): string => {
  return legalCache.generateKey('agentes', filtros);
};

/**
 * Cria chave de cache para dashboard
 */
export const createDashboardKey = (tipo: string = 'geral'): string => {
  return legalCache.generateKey('dashboard', { tipo });
};

/**
 * Cria chave de cache para analytics
 */
export const createAnalyticsKey = (filtros: Record<string, any>): string => {
  return legalCache.generateKey('analytics', filtros);
};

/**
 * Limpa cache relacionado a multas
 */
export const clearMultasCache = (): number => {
  return legalCache.deleteByPattern('^multas:');
};

/**
 * Limpa cache relacionado a agentes
 */
export const clearAgentesCache = (): number => {
  return legalCache.deleteByPattern('^agentes:');
};

/**
 * Limpa todo cache do jurídico
 */
export const clearAllLegalCache = (): void => {
  legalCache.clear();
};

/**
 * Obtém estatísticas do cache
 */
export const getCacheStats = (): CacheStats => {
  return legalCache.getStats();
};