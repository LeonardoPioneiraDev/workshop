// src/components/operacoes/frota/FrotaStats.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Truck, 
  CheckCircle, 
  XCircle, 
  Wrench, 
  Clock,
  Gauge,
  Fuel,
  Calendar
} from 'lucide-react';
import type { EstatisticasFrota } from '@/types/departments/operacoes';

interface FrotaStatsProps {
  estatisticas: EstatisticasFrota | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function FrotaStats({ estatisticas, loading, error, className = "" }: FrotaStatsProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>Erro ao carregar estatísticas: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!estatisticas) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Nenhuma estatística disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const statsCards = [
    {
      title: "Total de Veículos",
      value: estatisticas.total.toLocaleString('pt-BR'),
      subtitle: "Frota completa",
      icon: <Truck className="h-4 w-4 text-blue-500" />,
      color: "blue"
    },
    {
      title: "Veículos Ativos",
      value: estatisticas.ativos.toLocaleString('pt-BR'),
      subtitle: `${estatisticas.percentualAtivos.toFixed(1)}% da frota`,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      color: "green",
      badge: estatisticas.percentualAtivos >= 90 ? 'Excelente' : estatisticas.percentualAtivos >= 80 ? 'Bom' : 'Atenção'
    },
    {
      title: "Veículos Inativos",
      value: estatisticas.inativos.toLocaleString('pt-BR'),
      subtitle: `${estatisticas.percentualInativos.toFixed(1)}% da frota`,
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      color: "red"
    },
    {
      title: "Em Manutenção",
      value: estatisticas.manutencao?.toLocaleString('pt-BR') || '0',
      subtitle: `${((estatisticas.manutencao || 0) / estatisticas.total * 100).toFixed(1)}% da frota`,
      icon: <Wrench className="h-4 w-4 text-yellow-500" />,
      color: "yellow"
    },
    {
      title: "Idade Média",
      value: `${estatisticas.idadeMediaFrota?.toFixed(1) || '0'} anos`,
      subtitle: "Da frota",
      icon: <Calendar className="h-4 w-4 text-purple-500" />,
      color: "purple"
    },
    {
      title: "KM Média",
      value: (estatisticas.quilometragemMedia || 0).toLocaleString('pt-BR'),
      subtitle: "Quilometragem",
      icon: <Gauge className="h-4 w-4 text-indigo-500" />,
      color: "indigo"
    },
    {
      title: "Consumo Médio",
      value: `${estatisticas.consumoMedioGeral?.toFixed(2) || '0.00'} km/L`,
      subtitle: "Eficiência",
      icon: <Fuel className="h-4 w-4 text-orange-500" />,
      color: "orange"
    },
    {
      title: "Disponibilidade",
      value: `${estatisticas.disponibilidadeMedia?.toFixed(1) || '0.0'}%`,
      subtitle: "Média operacional",
      icon: <Clock className="h-4 w-4 text-teal-500" />,
      color: "teal",
      badge: (estatisticas.disponibilidadeMedia || 0) >= 95 ? 'Excelente' : (estatisticas.disponibilidadeMedia || 0) >= 90 ? 'Bom' : 'Atenção'
    }
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Excelente':
        return 'bg-green-100 text-green-800';
      case 'Bom':
        return 'bg-blue-100 text-blue-800';
      case 'Atenção':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={className}>
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                {card.badge && (
                  <Badge className={`text-xs ${getBadgeColor(card.badge)}`}>
                    {card.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Garagem */}
        {estatisticas.distribuicaoPorGaragem && estatisticas.distribuicaoPorGaragem.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Garagem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {estatisticas.distribuicaoPorGaragem.map((garagem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{garagem.garagem}</div>
                      <div className="text-sm text-gray-600">
                        {garagem.total} veículos ({garagem.percentual.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {garagem.ativos} ativos
                      </div>
                      <div className="text-xs text-gray-500">
                        {garagem.inativos} inativos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

                {/* Distribuição por Tipo */}
                {estatisticas.distribuicaoPorTipo && estatisticas.distribuicaoPorTipo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {estatisticas.distribuicaoPorTipo.map((tipo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{tipo.tipo}</div>
                      <div className="text-sm text-gray-600">
                        {tipo.total} veículos ({tipo.percentual.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {tipo.ativos} ativos
                      </div>
                      <div className="text-xs text-gray-500">
                        {tipo.percentualAtivos.toFixed(1)}% disponível
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alertas e Informações Adicionais */}
      {(estatisticas.alertasAtivos > 0 || estatisticas.documentosVencidos > 0 || estatisticas.manutencoesPendentes > 0) && (
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800">Atenção Necessária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {estatisticas.alertasAtivos > 0 && (
                <div className="text-center p-4 bg-red-100 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {estatisticas.alertasAtivos}
                  </div>
                  <div className="text-sm text-red-600">Alertas Ativos</div>
                </div>
              )}
              
              {estatisticas.documentosVencidos > 0 && (
                <div className="text-center p-4 bg-orange-100 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {estatisticas.documentosVencidos}
                  </div>
                  <div className="text-sm text-orange-600">Documentos Vencidos</div>
                </div>
              )}
              
              {estatisticas.manutencoesPendentes > 0 && (
                <div className="text-center p-4 bg-yellow-100 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">
                    {estatisticas.manutencoesPendentes}
                  </div>
                  <div className="text-sm text-yellow-600">Manutenções Pendentes</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações da última atualização */}
      {estatisticas.ultimaAtualizacao && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Última atualização: {new Date(estatisticas.ultimaAtualizacao).toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}