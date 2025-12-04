// src/components/dashboard/slides/DepesAfastadosSlide.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Database,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    const carregarDados = React.useCallback(async (forcarSincronizacao = false) => {
      try {
        clearError();

        if (forcarSincronizacao) {
          await sincronizarMultiplos();
        }

        const dadosReais = await loadDashboardComparativo();

        if (dadosReais?.dashboards) {
          const dadosProcessados = processarDadosReais(dadosReais);
          const sortedData = [...dadosProcessados].sort((a, b) => {
            if (a.isAnoAnterior && !b.isAnoAnterior) return 1;
            if (!a.isAnoAnterior && b.isAnoAnterior) return -1;
            return new Date(b.mes).getTime() - new Date(a.mes).getTime();
          });
          setDashboardData(sortedData);
          setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      }
    }, [loadDashboardComparativo, sincronizarMultiplos, processarDadosReais, clearError]);

    React.useEffect(() => {
      if (isActive) {
        carregarDados();
      }
    }, [carregarDados, isActive]);

    React.useEffect(() => {
      if (dashboardComparativo && !loadingComparativo && isActive) {
        try {
          const dadosProcessados = processarDadosReais(dashboardComparativo);
          const sortedData = [...dadosProcessados].sort((a, b) => {
            if (a.isAnoAnterior && !b.isAnoAnterior) return 1;
            if (!a.isAnoAnterior && b.isAnoAnterior) return -1;
            return new Date(b.mes).getTime() - new Date(a.mes).getTime();
          });
          setDashboardData(sortedData);
          setUltimaAtualizacao(new Date().toLocaleString('pt-BR'));
        } catch (error) {
          console.error('❌ Erro ao processar dados do hook:', error);
        }
      }
    }, [dashboardComparativo, loadingComparativo, processarDadosReais, isActive]);

    const valorMaximo = Math.max(...dashboardData.map(d => d.totalAfastados), meta) + 50;
    const isDataAvailable = dashboardData.length > 0;

    const renderEmptyState = () => (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300 font-medium text-base md:text-lg">Nenhum dado disponível</p>
          <p className="text-slate-500 text-sm md:text-base mb-4">Clique em "Sincronizar" para carregar os dados</p>
          <Button
            onClick={() => carregarDados(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white"
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
    );

    return (
      <SlideBase
        title="DEPES - Afastados"
        subtitle="Funcionários Afastados por INSS e Aposentadoria por Invalidez"
        meta={meta}
        onMetaChange={onMetaChange}
        slideNumber={slideNumber}
        totalSlides={totalSlides}
        isActive={isActive}
        className="bg-gradient-to-br from-slate-900 via-amber-900/50 to-slate-800"
      >
        <div className="flex flex-col h-full p-2 sm:p-4 md:p-6 gap-4 md:gap-6 overflow-x-hidden">

          <Card className="flex-none bg-slate-800/50 border-slate-700">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="hidden md:block bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-4 border-b-2 border-amber-400 flex-shrink-0 rounded-t-lg">
                <div className="grid grid-cols-4 gap-2 md:gap-4 lg:gap-6 items-center">
                  <div className="font-bold text-lg text-slate-900">MÊS / ANO</div>
                  <div className="font-bold text-lg text-slate-900 text-center">INSS</div>
                  <div className="font-bold text-lg text-slate-900 text-center">AP. INVALIDEZ</div>
                  <div className="font-bold text-lg text-slate-900 text-center">TOTAL AFASTADOS</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-800/30 p-2 md:p-0 md:divide-y md:divide-slate-600">
                {isDataAvailable ? (
                  dashboardData.map((item, index) => (
                    <motion.div
                      key={item.mes}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`
                      md:px-6 md:py-4 md:hover:bg-slate-700/30 transition-colors
                      ${item.isAtual ? 'md:bg-red-900/30 md:border-l-4 md:border-red-500' : ''}
                      ${item.totalAfastados === 0 ? 'md:bg-slate-800/20 opacity-60' : ''}
                      p-0 md:p-auto
                    `}
                    >
                      <div className="md:hidden bg-slate-800/60 rounded-lg mb-2 p-4 border border-slate-700">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-semibold text-slate-200">{item.mesFormatado}</span>
                          <div className="flex flex-col items-end gap-1">
                            {item.isAnoAnterior && <Badge className="bg-amber-600/80 text-amber-100">1 ANO ATRÁS</Badge>}
                            {item.isAtual && <Badge className="bg-red-600/80 text-red-100">MÊS ATUAL</Badge>}
                            {item.totalAfastados === 0 && <Badge className="bg-slate-600/80 text-slate-300">SEM DADOS</Badge>}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-slate-400">INSS:</span> <span className="font-semibold text-slate-200">{item.totalAfastados === 0 ? '-' : item.inss.toLocaleString('pt-BR')}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Ap. Invalidez:</span> <span className="font-semibold text-slate-200">{item.totalAfastados === 0 ? '-' : item.aposentadoriaInvalidez.toLocaleString('pt-BR')}</span></div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-600"><span className="text-slate-300 font-bold">Total:</span> <span className={`text-base font-bold py-1 px-2 rounded-md ${item.totalAfastados === 0 ? 'text-slate-500' : item.isAtual ? 'text-red-200 bg-red-800/50' : 'text-amber-200 bg-amber-800/50'}`}>{item.totalAfastados === 0 ? '-' : item.totalAfastados.toLocaleString('pt-BR')}</span></div>
                        </div>
                      </div>

                      <div className="hidden md:grid grid-cols-4 gap-2 md:gap-4 lg:gap-6 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-slate-200">{item.mesFormatado}</span>
                          {item.isAnoAnterior && <Badge className="bg-amber-600/80 text-amber-100">1 ANO ATRÁS</Badge>}
                          {item.isAtual && <Badge className="bg-red-600/80 text-red-100">MÊS ATUAL</Badge>}
                          {item.totalAfastados === 0 && <Badge className="bg-slate-600/80 text-slate-300">SEM DADOS</Badge>}
                        </div>
                        <div className={`text-lg font-semibold text-center ${item.totalAfastados === 0 ? 'text-slate-500' : 'text-slate-200'}`}>{item.totalAfastados === 0 ? '-' : item.inss.toLocaleString('pt-BR')}</div>
                        <div className={`text-lg font-semibold text-center ${item.totalAfastados === 0 ? 'text-slate-500' : 'text-slate-200'}`}>{item.totalAfastados === 0 ? '-' : item.aposentadoriaInvalidez.toLocaleString('pt-BR')}</div>
                        <div className={`text-lg font-bold text-center py-2 px-3 rounded-lg ${item.totalAfastados === 0 ? 'text-slate-500' : item.isAtual ? 'text-red-200 bg-red-800/50' : 'text-amber-200 bg-amber-800/50'}`}>{item.totalAfastados === 0 ? '-' : item.totalAfastados.toLocaleString('pt-BR')}</div>
                      </div>
                    </motion.div>
                  ))
                ) : (renderEmptyState())}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 bg-slate-800/50 border-slate-700 min-h-[350px] md:min-h-0">
            <CardContent className="p-2 sm:p-4 md:p-6 h-full flex flex-col">
              {isDataAvailable && dashboardData.some(d => d.totalAfastados > 0) ? (
                <>
                  <div className="flex flex-1 min-h-0">
                    <div className="w-12 md:w-16 text-right pr-4 text-slate-400 font-medium text-xs sm:text-sm relative flex-shrink-0">
                      <div className="absolute top-0 right-4 transform -translate-y-1/2"><span className="text-xs font-medium text-slate-200 bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-600">{valorMaximo}</span></div>
                      <div className="absolute right-4 transform -translate-y-1/2" style={{ top: '25%' }}><span className="text-xs font-medium text-slate-200 bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-600">{Math.round(valorMaximo * 0.75)}</span></div>
                      <div className="absolute right-4 transform -translate-y-1/2" style={{ top: `${(meta / valorMaximo) * 100}%` }}><span className="text-xs font-bold text-red-200 bg-red-800 px-2 py-1 rounded shadow-sm border border-red-600">{meta}</span></div>
                      <div className="absolute bottom-0 right-4 transform translate-y-1/2"><span className="text-xs font-medium text-slate-200 bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-600">0</span></div>
                    </div>

                    <div className="flex-1 relative min-h-0">
                      <div className="absolute inset-0 z-0">
                        <div className="absolute w-full border-t border-slate-600" style={{ top: '0%' }}></div>
                        <div className="absolute w-full border-t border-slate-600" style={{ top: '25%' }}></div>
                        <div className="absolute w-full border-t-2 border-red-500/50" style={{ top: `${(meta / valorMaximo) * 100}%` }}></div>
                        <div className="absolute w-full border-t-2 border-slate-500" style={{ top: '100%' }}></div>
                      </div>
                      <div className="absolute left-0 top-0 h-full border-l-2 border-slate-500 z-0"></div>
                      <div className="relative h-full flex items-end justify-around px-2 sm:px-4 z-10 pb-0">
                        {dashboardData.map((item, index) => {
                          const isAboveMeta = item.totalAfastados > meta;
                          const barColor = isAboveMeta ? 'bg-gradient-to-t from-red-700 to-red-500' : 'bg-gradient-to-t from-amber-600 to-amber-400';

                          return (
                            <motion.div
                              key={item.mes}
                              initial={{ height: 0 }}
                              animate={{ height: item.totalAfastados === 0 ? '2%' : `${(item.totalAfastados / valorMaximo) * 88}%` }}
                              transition={{ delay: 0.6 + index * 0.2, duration: 0.8 }}
                              className="flex flex-col items-center justify-end h-full relative"
                            >
                              {item.totalAfastados > 0 && (
                                <div className={`absolute top-0 text-xs sm:text-sm md:text-base font-bold px-2 py-0.5 bg-slate-900/60 rounded-md shadow-lg transform -translate-y-full border border-slate-700 ${isAboveMeta ? 'text-red-300' : 'text-slate-100'}`}>
                                  {item.totalAfastados}
                                </div>
                              )}
                              <div className={`w-6 sm:w-8 md:w-12 lg:w-16 rounded-t-md h-full ${item.totalAfastados === 0 ? 'bg-slate-600' : barColor}`}></div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-around px-2 sm:px-4 md:px-8 lg:px-12 pt-4 border-t border-slate-600 flex-shrink-0 mt-4">
                    {dashboardData.map((item, index) => (
                      <motion.div key={item.mes} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + index * 0.1 }} className="text-center">
                        <p className={`font-bold text-sm sm:text-base md:text-lg ${item.totalAfastados === 0 ? 'text-slate-500' : 'text-slate-200'}`}>{item.mesFormatado}</p>
                        {item.totalAfastados === 0 && <p className="text-xs text-slate-500">Sem dados</p>}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex flex-wrap justify-center items-center gap-x-4 sm:gap-x-6 gap-y-2 pt-4 mt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-t from-amber-600 to-amber-400"></div>
                      <span className="font-medium text-slate-300 text-xs sm:text-sm">OK / Abaixo da Meta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-t from-red-700 to-red-500"></div>
                      <span className="font-medium text-slate-300 text-xs sm:text-sm">Alerta / Acima da Meta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-red-500/50"></div>
                      <span className="font-medium text-slate-300 text-xs sm:text-sm">Meta ({meta})</span>
                    </div>
                  </div>
                </>
              ) : isDataAvailable ? (
                <div className="flex-1 flex items-center justify-center p-4 text-center">
                  <div>
                    <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-300 font-medium text-base md:text-lg">Todos os meses sem afastados!</p>
                    <p className="text-slate-500 text-sm md:text-base">Nenhum funcionário afastado nos períodos analisados.</p>
                  </div>
                </div>
              ) : (renderEmptyState())}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex justify-center items-center gap-4 pt-4 md:pt-6 flex-shrink-0 mt-auto">
                <Button onClick={onPrevious} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-200">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </SlideBase>
    );
  };