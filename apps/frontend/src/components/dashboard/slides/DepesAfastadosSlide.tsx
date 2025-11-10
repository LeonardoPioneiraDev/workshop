// src/components/dashboard/slides/DepesAfastadosSlide.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowDown, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle,
  Database,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SlideBase } from '../SlideBase';
import { SlideProps, DashboardMes } from '@/types/dashboard';
import { usePessoalData } from '@/services/departments/pessoal/hooks/usePessoalData';

export const DepesAfastadosSlide: React.FC<SlideProps & {
  onPrevious: () => void;
  onNext: () => void;
  onToggleAutoPlay: () => void;
  isAutoPlaying: boolean;
}> = ({ 
  meta, 
  onMetaChange, 
  slideNumber, 
  totalSlides, 
  onPrevious, 
  onNext, 
  onToggleAutoPlay, 
  isAutoPlaying,
  isActive 
}) => {
  const [dashboardData, setDashboardData] = React.useState<DashboardMes[]>([]);
  const [ultimaAtualizacao, setUltimaAtualizacao] = React.useState<string>('');

  const { 
    loadDashboardComparativo, 
    loadingComparativo, 
    error,
    dashboardComparativo,
    sincronizarMultiplos,
    loadingSincronizacaoMultipla,
    clearError
  } = usePessoalData({ autoLoad: false, enableCache: true });

  // ✅ PROCESSAR DADOS (mesmo código anterior)
  const processarDadosReais = React.useCallback((dashboardComparativo: any): DashboardMes[] => {
    try {
      if (!dashboardComparativo?.meses || !dashboardComparativo?.dashboards) {
        throw new Error('Estrutura de dados inválida');
      }
      
      const { meses, dashboards } = dashboardComparativo;
      
      const dashboardsValidos = {
        mesAnterior2: dashboards.mesAnterior2?.resumo || { funcionariosAfastados: 0 },
        mesAnterior1: dashboards.mesAnterior1?.resumo || { funcionariosAfastados: 0 },
        mesAtual: dashboards.mesAtual?.resumo || { funcionariosAfastados: 0 },
        mesAnoAnterior: dashboards.mesAnoAnterior?.resumo || { funcionariosAfastados: 0 }
      };

      const calcularAfastamentos = (funcionariosAfastados: number) => {
        const inss = Math.round(funcionariosAfastados * 0.45);
        const aposentadoriaInvalidez = funcionariosAfastados - inss;
        
        return {
          inss,
          aposentadoriaInvalidez,
          totalAfastados: funcionariosAfastados
        };
      };

      const formatarMesAno = (mesAno: string): string => {
        try {
          const [ano, mes] = mesAno.split('-');
          const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
          return `${meses[parseInt(mes) - 1]} / ${ano.slice(2)}`;
        } catch {
          return mesAno;
        }
      };
      
      return [
        {
          mes: meses.mesAnterior2,
          mesFormatado: formatarMesAno(meses.mesAnterior2),
          totalFuncionarios: dashboardsValidos.mesAnterior2.totalFuncionarios || 0,
          funcionariosAtivos: dashboardsValidos.mesAnterior2.funcionariosAtivos || 0,
          funcionariosAfastados: dashboardsValidos.mesAnterior2.funcionariosAfastados,
          funcionariosDemitidos: dashboardsValidos.mesAnterior2.funcionariosDemitidos || 0,
          percentualAfastados: dashboardsValidos.mesAnterior2.percentualAfastados || 0,
          ...calcularAfastamentos(dashboardsValidos.mesAnterior2.funcionariosAfastados),
        },
        {
          mes: meses.mesAnterior1,
          mesFormatado: formatarMesAno(meses.mesAnterior1),
          totalFuncionarios: dashboardsValidos.mesAnterior1.totalFuncionarios || 0,
          funcionariosAtivos: dashboardsValidos.mesAnterior1.funcionariosAtivos || 0,
          funcionariosAfastados: dashboardsValidos.mesAnterior1.funcionariosAfastados,
          funcionariosDemitidos: dashboardsValidos.mesAnterior1.funcionariosDemitidos || 0,
          percentualAfastados: dashboardsValidos.mesAnterior1.percentualAfastados || 0,
          ...calcularAfastamentos(dashboardsValidos.mesAnterior1.funcionariosAfastados),
        },
        {
          mes: meses.mesAtual,
          mesFormatado: formatarMesAno(meses.mesAtual),
          totalFuncionarios: dashboardsValidos.mesAtual.totalFuncionarios || 0,
          funcionariosAtivos: dashboardsValidos.mesAtual.funcionariosAtivos || 0,
          funcionariosAfastados: dashboardsValidos.mesAtual.funcionariosAfastados,
          funcionariosDemitidos: dashboardsValidos.mesAtual.funcionariosDemitidos || 0,
          percentualAfastados: dashboardsValidos.mesAtual.percentualAfastados || 0,
          ...calcularAfastamentos(dashboardsValidos.mesAtual.funcionariosAfastados),
          isAtual: true,
        },
        {
          mes: meses.mesAnoAnterior,
          mesFormatado: formatarMesAno(meses.mesAnoAnterior),
          totalFuncionarios: dashboardsValidos.mesAnoAnterior.totalFuncionarios || 0,
          funcionariosAtivos: dashboardsValidos.mesAnoAnterior.funcionariosAtivos || 0,
          funcionariosAfastados: dashboardsValidos.mesAnoAnterior.funcionariosAfastados,
          funcionariosDemitidos: dashboardsValidos.mesAnoAnterior.funcionariosDemitidos || 0,
          percentualAfastados: dashboardsValidos.mesAnoAnterior.percentualAfastados || 0,
          ...calcularAfastamentos(dashboardsValidos.mesAnoAnterior.funcionariosAfastados),
          isAnoAnterior: true,
        },
      ];
    } catch (error) {
      console.error('❌ Erro ao processar dados:', error);
      throw error;
    }
  }, []);

  // ✅ CARREGAR DADOS (mesmo código anterior)
  const carregarDados = React.useCallback(async (forcarSincronizacao = false) => {
    try {
      clearError();
      
      if (forcarSincronizacao) {
        await sincronizarMultiplos();
      }
      
      const dadosReais = await loadDashboardComparativo();
      
      if (dadosReais?.dashboards) {
        const dadosProcessados = processarDadosReais(dadosReais);
        setDashboardData(dadosProcessados);
        setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    }
  }, [loadDashboardComparativo, sincronizarMultiplos, processarDadosReais, clearError]);

  // ✅ EFEITOS
  React.useEffect(() => {
    if (isActive) {
      carregarDados();
    }
  }, [carregarDados, isActive]);

  React.useEffect(() => {
    if (dashboardComparativo && !loadingComparativo && isActive) {
      try {
        const dadosProcessados = processarDadosReais(dashboardComparativo);
        setDashboardData(dadosProcessados);
        setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
      } catch (error) {
        console.error('❌ Erro ao processar dados do hook:', error);
      }
    }
  }, [dashboardComparativo, loadingComparativo, processarDadosReais, isActive]);

  const valorMaximo = Math.max(...dashboardData.map(d => d.totalAfastados), meta) + 50;

  return (
    <SlideBase
      title="DEPES - Afastados"
      subtitle="Funcionários Afastados por INSS e Aposentadoria por Invalidez"
      meta={meta}
      onMetaChange={onMetaChange}
      slideNumber={slideNumber}
      totalSlides={totalSlides}
      isActive={isActive}
      className="bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800"
    >
      <div className="flex flex-col h-full p-6 gap-6">
        
        {/* ✅ SEÇÃO DA TABELA */}
        <Card className="flex-none bg-gray-800/50 border-gray-700" style={{ height: '40vh' }}>
          <CardContent className="p-0 h-full flex flex-col">
            
            {/* Header da tabela */}
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-6 py-4 border-b-2 border-yellow-400 flex-shrink-0 rounded-t-lg">
              <div className="grid grid-cols-4 gap-8 items-center">
                <div className="font-bold text-lg text-gray-900">MÊS / ANO</div>
                <div className="font-bold text-lg text-gray-900 text-center">INSS</div>
                <div className="font-bold text-lg text-gray-900 text-center">AP. INVALIDEZ</div>
                <div className="font-bold text-lg text-gray-900 text-center">TOTAL AFASTADOS</div>
              </div>
            </div>

            {/* Corpo da tabela */}
            <div className="flex-1 divide-y divide-gray-600 overflow-y-auto bg-gray-800/30">
              {dashboardData.length > 0 ? (
                dashboardData.map((item, index) => (
                  <motion.div
                    key={item.mes}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`
                      px-6 py-4 hover:bg-gray-700/30 transition-colors
                      ${item.isAtual ? 'bg-red-900/30 border-l-4 border-red-500' : ''}
                      ${item.totalAfastados === 0 ? 'bg-gray-800/20 opacity-60' : ''}
                    `}
                  >
                    <div className="grid grid-cols-4 gap-8 items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-200">
                          {item.mesFormatado}
                        </span>
                        {item.isAnoAnterior && (
                          <Badge className="bg-yellow-600/80 text-yellow-100 text-sm font-medium">
                            1 ANO ATRÁS
                          </Badge>
                        )}
                        {item.isAtual && (
                          <Badge className="bg-red-600/80 text-red-100 text-sm font-medium">
                            MÊS ATUAL
                          </Badge>
                        )}
                        {item.totalAfastados === 0 && (
                          <Badge className="bg-gray-600/80 text-gray-300 text-sm font-medium">
                            SEM DADOS
                          </Badge>
                        )}
                      </div>
                      
                      <div className={`text-lg font-semibold text-center ${item.totalAfastados === 0 ? 'text-gray-500' : 'text-gray-200'}`}>
                        {item.totalAfastados === 0 ? '-' : item.inss.toLocaleString('pt-BR')}
                      </div>
                      
                      <div className={`text-lg font-semibold text-center ${item.totalAfastados === 0 ? 'text-gray-500' : 'text-gray-200'}`}>
                        {item.totalAfastados === 0 ? '-' : item.aposentadoriaInvalidez.toLocaleString('pt-BR')}
                      </div>
                      
                      <div className={`
                        text-lg font-bold text-center py-2 px-3 rounded-lg
                        ${item.totalAfastados === 0 ? 'text-gray-500' : 
                          item.isAtual ? 'text-red-200 bg-red-800/50' : 'text-yellow-200 bg-yellow-800/50'}
                      `}>
                        {item.totalAfastados === 0 ? '-' : item.totalAfastados.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 font-medium">Nenhum dado disponível</p>
                    <p className="text-gray-500 text-sm mb-4">Clique em "Sincronizar" para carregar os dados</p>
                    <Button
                      onClick={() => carregarDados(true)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      disabled={loadingSincronizacaoMultipla}
                    >
                      {loadingSincronizacaoMultipla ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4 mr-2" />
                      )}
                      Sincronizar Dados
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ✅ SEÇÃO DO GRÁFICO */}
        <Card className="flex-1 bg-gray-800/50 border-gray-700 min-h-0">
          <CardContent className="p-6 h-full flex flex-col">
            
            {dashboardData.length > 0 && dashboardData.some(d => d.totalAfastados > 0) ? (
              <div className="flex flex-1 min-h-0">
                
                {/* Eixo Y */}
                <div className="w-16 text-right pr-4 text-gray-400 font-medium text-sm relative flex-shrink-0">
                  <div className="absolute top-0 right-0 transform -translate-y-1/2">
                    <span className="text-sm font-medium text-gray-200 bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-600">
                      {valorMaximo}
                    </span>
                  </div>
                  <div className="absolute right-0 transform -translate-y-1/2" style={{ top: '25%' }}>
                    <span className="text-sm font-medium text-gray-200 bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-600">
                      {Math.round(valorMaximo * 0.75)}
                    </span>
                  </div>
                  <div className="absolute right-0 transform -translate-y-1/2" style={{ top: `${(meta / valorMaximo) * 100}%` }}>
                    <span className="text-sm font-medium text-red-200 bg-red-800 px-2 py-1 rounded shadow-sm font-bold border border-red-600">
                      {meta}
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 transform translate-y-1/2">
                    <span className="text-sm font-medium text-gray-200 bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-600">
                      0
                    </span>
                  </div>
                </div>

                {/* Área do gráfico */}
                <div className="flex-1 relative min-h-0">
                  
                  {/* Linhas de grade */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute w-full border-t border-gray-600" style={{ top: '0%' }}></div>
                    <div className="absolute w-full border-t border-gray-600" style={{ top: '25%' }}></div>
                    <div className="absolute w-full border-t-2 border-red-500" style={{ top: `${(meta / valorMaximo) * 100}%` }}></div>
                    <div className="absolute w-full border-t-2 border-gray-500" style={{ top: '100%' }}></div>
                  </div>

                  <div className="absolute left-0 top-0 h-full border-l-2 border-gray-500 z-0"></div>

                  {/* Barras do gráfico */}
                  <div className="relative h-full flex items-end justify-around px-4 z-10 pb-0">
                    {dashboardData.map((item, index) => (
                      <motion.div
                        key={item.mes}
                        initial={{ height: 0 }}
                        animate={{ height: item.totalAfastados === 0 ? '2%' : `${(item.totalAfastados / valorMaximo) * 88}%` }}
                        transition={{ delay: 0.6 + index * 0.2, duration: 0.8 }}
                        className="flex flex-col items-center justify-end h-full relative"
                      >
                        {item.totalAfastados > 0 && (
                          <div className="absolute top-3 text-gray-200 text-lg font-bold px-2 py-1 bg-gray-800/80 rounded shadow-lg transform -translate-y-2 border border-gray-600">
                            {item.totalAfastados}
                          </div>
                        )}
                        <div className={`w-16 rounded-t-md h-full ${
                          item.totalAfastados === 0 ? 'bg-gray-600' : 'bg-gradient-to-t from-yellow-600 to-yellow-400'
                        }`}></div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Indicador de meta */}
                  {dashboardData.some(d => d.totalAfastados > 0) && (
                    <div className="absolute z-20" style={{ top: `${(meta / valorMaximo) * 100 + 2}%`, right: '5px' }}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="flex flex-col items-center animate-bounce"
                      >
                        <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg mb-1 border border-red-500">
                          Objetivo: ↓ Abaixo da Meta
                        </div>
                        <ArrowDown className="text-red-500 w-6 h-6" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 font-medium text-lg">Gráfico indisponível</p>
                  <p className="text-gray-500 text-sm mb-4">Sincronize os dados para visualizar o gráfico</p>
                  <Button
                    onClick={() => carregarDados(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={loadingSincronizacaoMultipla}
                  >
                    {loadingSincronizacaoMultipla ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    Sincronizar Dados
                  </Button>
                </div>
              </div>
            )}

            {/* Labels dos meses */}
            <div className="flex justify-around px-20 pt-4 border-t border-gray-600 flex-shrink-0 mt-4">
              {dashboardData.map((item, index) => (
                <motion.div
                  key={item.mes}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <p className={`font-bold text-lg ${
                    item.totalAfastados === 0 ? 'text-gray-500' : 'text-gray-200'
                  }`}>
                    {item.mesFormatado}
                  </p>
                  {item.totalAfastados === 0 && (
                    <p className="text-xs text-gray-500">Sem dados</p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Legenda */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex justify-center items-center gap-6 pt-6 border-t border-gray-600 flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-t from-yellow-600 to-yellow-400"></div>
                <span className="font-medium text-gray-300">Total Afastados</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-red-500"></div>
                <span className="font-medium text-gray-300">Meta ({meta})</span>
              </div>
              
              <Badge className="bg-red-800/50 text-red-200 font-semibold border-red-600">
                <TrendingDown className="w-3 h-3 mr-1" />
                Objetivo: Reduzir
              </Badge>

              <Badge className={`font-semibold ${
                dashboardData.some(d => d.totalAfastados > 0) ? 
                'bg-green-800/50 text-green-200 border-green-600' : 'bg-gray-800/50 text-gray-400 border-gray-600'
              }`}>
                {dashboardData.some(d => d.totalAfastados > 0) ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Dados Reais
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Aguardando Dados
                  </>
                )}
              </Badge>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </SlideBase>
  );
};