// src/pages/departments/operacoes/FrotaPage.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Download, 
  Plus,
  Truck,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { FrotaFilters } from '@/components/operacoes/frota/FrotaFilters';
import { FrotaStats } from '@/components/operacoes/frota/FrotaStats';
import { FrotaTable } from '@/components/operacoes/frota/FrotaTable';
import { useFrotaData } from '@/services/departments/operacoes/hooks/useFrotaData';
import type { FiltrosFrota, VeiculoOperacional } from '@/types/departments/operacoes';

export function FrotaPage() {
  const [filtros, setFiltros] = useState<FiltrosFrota>({
    status: 'TODOS',
    page: 1,
    limit: 30
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    veiculos,
    estatisticas,
    loading,
    error,
    totalPages,
    total,
    buscarFrota,
    sincronizarFrota,
    obterHistoricoVeiculo
  } = useFrotaData();

  useEffect(() => {
    buscarFrota(filtros);
  }, [filtros, buscarFrota]);

  const handleFiltrosChange = (novosFiltros: FiltrosFrota) => {
    setFiltros({
      ...novosFiltros,
      page: 1 // Reset para primeira página quando filtros mudam
    });
  };

  const handleLimparFiltros = () => {
    setFiltros({
      status: 'TODOS',
      page: 1,
      limit: 30
    });
  };

  const handleAplicarFiltros = () => {
    buscarFrota(filtros);
  };

  const handlePageChange = (page: number) => {
    setFiltros(prev => ({ ...prev, page }));
  };

  const handleSincronizar = async () => {
    setIsRefreshing(true);
    try {
      await sincronizarFrota();
      await buscarFrota(filtros);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewVeiculo = (veiculo: VeiculoOperacional) => {
    console.log('Visualizar veículo:', veiculo);
    // Implementar modal ou navegação para detalhes
  };

  const handleEditVeiculo = (veiculo: VeiculoOperacional) => {
    console.log('Editar veículo:', veiculo);
    // Implementar modal ou navegação para edição
  };

  const handleViewHistorico = async (prefixo: string) => {
    console.log('Ver histórico do veículo:', prefixo);
    try {
      const historico = await obterHistoricoVeiculo(prefixo, 50);
      console.log('Histórico:', historico);
      // Implementar modal com histórico
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  };

  const handleExport = () => {
    console.log('Exportar dados da frota...');
    // Implementar exportação
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header da página */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Frota</h1>
          <p className="text-gray-600 mt-1">
            Controle e monitoramento da frota operacional
          </p>
          {estatisticas && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {estatisticas.total} veículos
              </Badge>
              <Badge variant={estatisticas.percentualAtivos >= 90 ? "default" : "destructive"}>
                {estatisticas.percentualAtivos.toFixed(1)}% disponível
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Ocultar' : 'Filtros'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSincronizar}
            disabled={isRefreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Veículo
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <FrotaFilters
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          onLimpar={handleLimparFiltros}
          onAplicar={handleAplicarFiltros}
          loading={loading}
        />
      )}

      {/* Estatísticas */}
      <FrotaStats
        estatisticas={estatisticas}
        loading={loading}
        error={error}
      />

      {/* Tabela de veículos */}
      <FrotaTable
        veiculos={veiculos}
        loading={loading}
        error={error}
        totalPages={totalPages}
        currentPage={filtros.page || 1}
        total={total}
        onPageChange={handlePageChange}
        onViewVeiculo={handleViewVeiculo}
        onEditVeiculo={handleEditVeiculo}
        onViewHistorico={handleViewHistorico}
      />

      {/* Mensagem de erro global */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>Erro ao carregar dados da frota: {error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => buscarFrota(filtros)}
                className="ml-auto"
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}