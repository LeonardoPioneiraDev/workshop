// apps/frontend/src/services/departments/legal/hooks/useLegalDashboard.ts - CORRIGIDO

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../api/client';

export function useLegalDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Carregando dashboard...');
      const response = await apiClient.get<any>('/departamentos/juridico/dashboard');
      console.log('📊 Dashboard response:', response);
      setData(response.data || response);
      console.log('✅ Dashboard carregado com sucesso');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar dashboard';
      console.error('❌ Erro ao carregar dashboard:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // ✅ DEPENDÊNCIA VAZIA

  const refetch = useCallback(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchDashboard();
  }, []); // ✅ DEPENDÊNCIA VAZIA

  return {
    data,
    loading,
    error,
    refetch
  };
}