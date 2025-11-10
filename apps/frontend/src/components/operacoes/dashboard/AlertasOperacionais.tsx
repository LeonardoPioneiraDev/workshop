// src/components/operacoes/dashboard/AlertasOperacionais.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Clock,
  Truck,
  Users,
  MapPin,
  ExternalLink
} from 'lucide-react';
import type { AlertasOperacionais } from '@/types/departments/operacoes';

interface AlertasOperacionaisProps {
  alertas: AlertasOperacionais | null;
  loading?: boolean;
  error?: string | null;
  onViewDetails?: (alerta: any) => void;
  className?: string;
}

export function AlertasOperacionais({ 
  alertas, 
  loading, 
  error, 
  onViewDetails,
  className = "" 
}: AlertasOperacionaisProps) {
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
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
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar alertas: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alertas) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>Nenhum alerta ativo no momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityIcon = (severidade: string) => {
    switch (severidade) {
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'INFO':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severidade: string) => {
    switch (severidade) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INFO':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'VEICULO_RISCO':
        return <Truck className="h-4 w-4" />;
      case 'GARAGEM_PROBLEMATICA':
        return <MapPin className="h-4 w-4" />;
      case 'MUDANCA_CRITICA':
        return <Clock className="h-4 w-4" />;
      case 'META_NAO_ATINGIDA':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const alertasAtivos = [
    // Veículos de risco
    ...alertas.veiculosRisco.map(veiculo => ({
      id: `veiculo-${veiculo.prefixo}`,
      tipo: 'VEICULO_RISCO',
      titulo: `Veículo ${veiculo.prefixo} - Alto Risco`,
      descricao: `${veiculo.totalAcidentes} acidentes registrados (${veiculo.comVitimas} com vítimas)`,
      severidade: veiculo.risco === 'CRÍTICO' ? 'CRITICAL' : 'WARNING',
      dataDeteccao: new Date().toISOString(),
      acao: 'Revisar histórico e considerar manutenção',
      resolvido: false,
      dados: veiculo
    })),
    
    // Garagens problemáticas
    ...alertas.garagensProblematicas.map(garagem => ({
      id: `garagem-${garagem.garagem}`,
      tipo: 'GARAGEM_PROBLEMATICA',
      titulo: `Garagem ${garagem.garagem} - Acidentes com Vítimas`,
      descricao: `${garagem.comVitimas} acidentes com vítimas de ${garagem.total} total`,
      severidade: 'ERROR',
      dataDeteccao: new Date().toISOString(),
      acao: 'Investigar condições operacionais da garagem',
      resolvido: false,
      dados: garagem
    })),
    
    // Mudanças recentes críticas
    ...alertas.mudancasRecentes.slice(0, 3).map(mudanca => ({
      id: `mudanca-${mudanca.id}`,
      tipo: 'MUDANCA_CRITICA',
      titulo: `Mudança ${mudanca.tipoMudanca} - ${mudanca.prefixo}`,
      descricao: `${mudanca.campoAlterado}: ${mudanca.valorAnterior} → ${mudanca.valorNovo}`,
      severidade: mudanca.impacto === 'ALTO' ? 'WARNING' : 'INFO',
      dataDeteccao: mudanca.dataMudanca,
      acao: mudanca.motivo || 'Verificar impacto da mudança',
      resolvido: false,
      dados: mudanca
    })),

    // Metas não atingidas
    ...(alertas.metasNaoAtingidas || []).map(meta => ({
      id: `meta-${meta.tipo}`,
      tipo: 'META_NAO_ATINGIDA',
      titulo: `Meta ${meta.tipo} não atingida`,
      descricao: `Atual: ${meta.valorAtual}% | Meta: ${meta.valorMeta}% | Diferença: ${meta.diferenca}%`,
      severidade: Math.abs(meta.diferenca) > 10 ? 'ERROR' : 'WARNING',
      dataDeteccao: new Date().toISOString(),
      acao: 'Revisar estratégias operacionais',
      resolvido: false,
      dados: meta
    }))
  ];

  const alertasPorSeveridade = alertasAtivos.reduce((acc, alerta) => {
    acc[alerta.severidade] = (acc[alerta.severidade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={className}>
      {/* Resumo dos alertas */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Resumo de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {(alertasPorSeveridade.CRITICAL || 0) + (alertasPorSeveridade.ERROR || 0)}
              </div>
              <div className="text-sm text-gray-600">Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {alertasPorSeveridade.WARNING || 0}
              </div>
              <div className="text-sm text-gray-600">Avisos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {alertasPorSeveridade.INFO || 0}
              </div>
              <div className="text-sm text-gray-600">Informativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {alertasAtivos.length}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alertas */}
      <div className="space-y-3">
        {alertasAtivos.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>Nenhum alerta ativo no momento</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          alertasAtivos.map((alerta) => (
            <Card key={alerta.id} className={`border-l-4 ${getSeverityColor(alerta.severidade)}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2 mt-1">
                      {getSeverityIcon(alerta.severidade)}
                      {getTypeIcon(alerta.tipo)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{alerta.titulo}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alerta.tipo.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{alerta.descricao}</p>
                      
                      {alerta.acao && (
                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <strong>Ação sugerida:</strong> {alerta.acao}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alerta.dataDeteccao).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {onViewDetails && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(alerta)}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Detalhes
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}