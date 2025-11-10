// src/components/operacoes/SincronizacaoComponent.tsx
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  Download,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import { operacoesApi } from '@/services/departments/operacoes/api/operacoesApi';
import { toast } from 'sonner';

interface SincronizacaoComponentProps {
  titulo?: string;
  subtitulo?: string;
  onSuccess?: (resultado: any) => void;
  onError?: (erro: string) => void;
  className?: string;
  showProgress?: boolean;
  autoClose?: boolean;
  params?: {
    dataInicio?: string;
    dataFim?: string;
    forcarSincronizacao?: boolean;
  };
}

interface SincronizacaoStatus {
  etapa: 'idle' | 'frota' | 'acidentes' | 'finalizando' | 'concluido' | 'erro';
  progresso: number;
  mensagem: string;
  detalhes?: string;
}

export function SincronizacaoComponent({
  titulo = "Sincronização de Dados",
  subtitulo = "Sincronizar dados do sistema Globus com o banco local",
  onSuccess,
  onError,
  className = "",
  showProgress = true,
  autoClose = true,
  params = {}
}: SincronizacaoComponentProps) {
  const [sincronizando, setSincronizando] = useState(false);
  const [status, setStatus] = useState<SincronizacaoStatus>({
    etapa: 'idle',
    progresso: 0,
    mensagem: 'Pronto para sincronizar'
  });
  const [ultimoResultado, setUltimoResultado] = useState<any>(null);

  const updateStatus = useCallback((novoStatus: Partial<SincronizacaoStatus>) => {
    setStatus(prevStatus => ({ ...prevStatus, ...novoStatus }));
  }, []);

  const sincronizar = useCallback(async () => {
    if (sincronizando) return;

    try {
      setSincronizando(true);
      setUltimoResultado(null);
      
      // Etapa 1: Iniciar
      updateStatus({
        etapa: 'frota',
        progresso: 10,
        mensagem: 'Conectando com o sistema Globus...',
        detalhes: 'Verificando conexão com o banco Oracle'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Etapa 2: Sincronizando frota
      updateStatus({
        etapa: 'frota',
        progresso: 30,
        mensagem: 'Sincronizando dados da frota...',
        detalhes: 'Buscando informações de veículos no sistema Globus'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      updateStatus({
        progresso: 50,
        detalhes: 'Processando dados da frota...'
      });

      // Etapa 3: Sincronizando acidentes
      updateStatus({
        etapa: 'acidentes',
        progresso: 70,
        mensagem: 'Sincronizando dados de acidentes...',
        detalhes: 'Buscando registros de acidentes e sinistros'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Etapa 4: Chamada real da API
      updateStatus({
        etapa: 'finalizando',
        progresso: 85,
        mensagem: 'Finalizando sincronização...',
        detalhes: 'Salvando dados no banco local'
      });

      const resultado = await operacoesApi.sincronizarTudo(params);

      await new Promise(resolve => setTimeout(resolve, 800));

      if (resultado.sucesso) {
        // Sucesso
        updateStatus({
          etapa: 'concluido',
          progresso: 100,
          mensagem: 'Sincronização concluída com sucesso!',
          detalhes: `${resultado.resumo?.veiculosSincronizados || 0} veículos e ${resultado.resumo?.acidentesSincronizados || 0} acidentes sincronizados`
        });

        setUltimoResultado(resultado);
        
        toast.success('Sincronização realizada com sucesso!', {
          description: `${resultado.resumo?.veiculosSincronizados || 0} veículos e ${resultado.resumo?.acidentesSincronizados || 0} acidentes atualizados.`,
          duration: 4000,
        });

        onSuccess?.(resultado);

        // Auto fechar após sucesso
        if (autoClose) {
          setTimeout(() => {
            updateStatus({
              etapa: 'idle',
              progresso: 0,
              mensagem: 'Pronto para sincronizar'
            });
          }, 3000);
        }

      } else {
        // Erro retornado pela API
        throw new Error(resultado.erro || 'Erro desconhecido na sincronização');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      updateStatus({
        etapa: 'erro',
        progresso: 0,
        mensagem: 'Erro na sincronização',
        detalhes: errorMessage
      });

      toast.error('Erro na sincronização', {
        description: errorMessage,
        duration: 6000,
      });

      onError?.(errorMessage);

      // Voltar ao estado inicial após erro
      setTimeout(() => {
        updateStatus({
          etapa: 'idle',
          progresso: 0,
          mensagem: 'Pronto para sincronizar'
        });
      }, 5000);

    } finally {
      setSincronizando(false);
    }
  }, [sincronizando, params, onSuccess, onError, autoClose, updateStatus]);

  const resetar = useCallback(() => {
    if (sincronizando) return;
    
    setStatus({
      etapa: 'idle',
      progresso: 0,
      mensagem: 'Pronto para sincronizar'
    });
    setUltimoResultado(null);
  }, [sincronizando]);

  const getStatusIcon = () => {
    switch (status.etapa) {
      case 'concluido':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'erro':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'idle':
        return <Database className="w-5 h-5 text-blue-600" />;
      default:
        return <RefreshCw className={`w-5 h-5 text-blue-600 ${sincronizando ? 'animate-spin' : ''}`} />;
    }
  };

  const getStatusColor = () => {
    switch (status.etapa) {
      case 'concluido':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'erro':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'idle':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-orange-700 bg-orange-50 border-orange-200';
    }
  };

  return (
    <Card className={`${className} ${getStatusColor()}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="text-lg font-semibold">{titulo}</div>
            <div className="text-sm font-normal opacity-80">{subtitulo}</div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status atual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{status.mensagem}</span>
            <Badge variant={status.etapa === 'concluido' ? 'default' : 'secondary'}>
              {status.etapa === 'idle' && 'Aguardando'}
              {status.etapa === 'frota' && 'Sincronizando Frota'}
              {status.etapa === 'acidentes' && 'Sincronizando Acidentes'}
              {status.etapa === 'finalizando' && 'Finalizando'}
              {status.etapa === 'concluido' && 'Concluído'}
              {status.etapa === 'erro' && 'Erro'}
            </Badge>
          </div>
          
          {status.detalhes && (
            <p className="text-xs opacity-70">{status.detalhes}</p>
          )}
        </div>

        {/* Barra de progresso */}
        {showProgress && status.etapa !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Progress value={status.progresso} className="h-2" />
            <div className="flex justify-between text-xs mt-1 opacity-70">
              <span>Progresso</span>
              <span>{status.progresso}%</span>
            </div>
          </motion.div>
        )}

        {/* Resultado da última sincronização */}
        {ultimoResultado && status.etapa === 'concluido' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Resumo da Sincronização
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>{ultimoResultado.resumo?.totalVeiculos || 0} veículos</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{ultimoResultado.resumo?.totalAcidentes || 0} acidentes</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{ultimoResultado.resumo?.veiculosSincronizados || 0} sincronizados</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{ultimoResultado.resumo?.tempoExecucao || 'N/A'}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={sincronizar}
            disabled={sincronizando}
            size="sm"
            className="flex-1"
          >
            {sincronizando ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                {status.etapa === 'idle' ? 'Iniciar Sincronização' : 'Sincronizar Novamente'}
              </>
            )}
          </Button>

          {status.etapa !== 'idle' && !sincronizando && (
            <Button
              onClick={resetar}
              variant="outline"
              size="sm"
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="text-xs opacity-60 pt-2 border-t">
          <p>💡 A sincronização busca dados atualizados do sistema Globus (Oracle) e atualiza o banco local.</p>
          {params.dataInicio && (
            <p>📅 Período: {params.dataInicio} {params.dataFim ? `até ${params.dataFim}` : 'até hoje'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}