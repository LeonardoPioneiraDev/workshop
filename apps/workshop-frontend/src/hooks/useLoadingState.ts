// src/hooks/useLoadingState.ts
import { useState, useCallback } from 'react';

interface UseLoadingStateReturn {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  executeAsync: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
}

export function useLoadingState(initialLoading = false): UseLoadingStateReturn {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null); // Limpar erro ao iniciar loading
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeAsync = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      const result = await asyncFn();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro inesperado';
      setError(errorMessage);
      console.error('Erro na execução assíncrona:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  return {
    isLoading,
    error,
    setLoading,
    setError,
    clearError,
    executeAsync
  };
}