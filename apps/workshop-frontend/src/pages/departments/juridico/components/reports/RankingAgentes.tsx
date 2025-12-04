// src/pages/departments/juridico/components/reports/RankingAgentes.tsx
import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Users, RefreshCw, Trophy, Medal, Award, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Agente {
  codigo: string;
  descricao: string;
  total: string;
  valorTotal: string;
  valorMedio: string;
}

interface RankingAgentesProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const RankingAgentes: React.FC<RankingAgentesProps> = ({ 
  limit = 5, 
  autoRefresh = false,
  refreshInterval = 30000 // 30 segundos
}) => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAgentes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.get<any>('/juridico/multas-enhanced/agrupamentos/agente');
      
      if (data.success) {
        // Ordenar por total de multas (descendente)
        const sortedAgentes = data.data.sort((a: Agente, b: Agente) => 
          parseInt(b.total) - parseInt(a.total)
        );
        
        setAgentes(sortedAgentes);
        setLastUpdate(new Date());
      } else {
        throw new Error(data.message || 'Erro ao carregar ranking de agentes');
      }
    } catch (err: any) {
      console.error('Erro ao buscar ranking de agentes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentes();
    
    // Auto refresh se habilitado
    if (autoRefresh) {
      const interval = setInterval(fetchAgentes, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getRankingIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Award className="w-5 h-5 text-orange-600" />;
      default: return (
        <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {index + 1}
        </div>
      );
    }
  };

  const getRankingBadge = (index: number) => {
    switch (index) {
      case 0: return <Badge className="bg-yellow-500 text-white">🥇 1º</Badge>;
      case 1: return <Badge className="bg-gray-400 text-white">🥈 2º</Badge>;
      case 2: return <Badge className="bg-orange-600 text-white">🥉 3º</Badge>;
      default: return <Badge variant="secondary">{index + 1}º</Badge>;
    }
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    });
  };

  if (error) {
    return (
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-lg">Erro no Ranking</div>
              <div className="text-sm text-red-500 font-normal">Falha ao carregar dados</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
            <Button onClick={fetchAgentes} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-lg">Ranking Agentes SEMOB</div>
              <div className="text-sm text-gray-500 font-normal">
                Top {limit} agentes mais produtivos
              </div>
            </div>
          </CardTitle>
          
          <Button 
            onClick={fetchAgentes} 
            variant="ghost" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {lastUpdate && (
          <div className="text-xs text-gray-500 mt-2">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando ranking...</span>
          </div>
        ) : agentes.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum agente encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agentes.slice(0, limit).map((agente, index) => (
              <div 
                key={agente.codigo} 
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                  index < 3 
                    ? 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800' 
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getRankingIcon(index)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {agente.descricao}
                      </p>
                      {index < 3 && getRankingBadge(index)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Código: {agente.codigo}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Valor médio: {formatCurrency(agente.valorMedio)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {parseInt(agente.total).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">multas</p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(agente.valorTotal)}
                  </p>
                </div>
              </div>
            ))}
            
            {agentes.length > limit && (
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  E mais {agentes.length - limit} agentes...
                </p>
              </div>
            )}
            
            {/* Estatísticas do ranking */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {agentes.reduce((sum, a) => sum + parseInt(a.total), 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500">Total Multas</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(
                      agentes.reduce((sum, a) => sum + parseFloat(a.valorTotal), 0).toString()
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Valor Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {agentes.length}
                  </p>
                  <p className="text-xs text-gray-500">Agentes Ativos</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
