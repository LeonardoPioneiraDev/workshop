// src/pages/DashboardPage.tsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { isToday, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import isEqual from "lodash/isEqual";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bus,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Info,
  Loader2,
  RefreshCw,
  Search,
  SearchX,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { BarChart } from "../components/charts/BarChartCumprimento";
import { FiltrosDashboard } from "../components/filters/FiltrosDashboard";
import { useFiltros } from "../contexts/FiltrosContext";
import { api } from "../services/api";

interface ViagemData {
  // Campos numéricos existentes
  StatusInicio: number;
  StatusFim: number;
  NaoCumprida: number;
  ParcialmenteCumprida: number;
  AdiantadoInicio: number;
  AtrasadoInicio: number;
  ForadoHorarioInicio: number;
  AdiantadoFim: number;
  AtrasadoFim: number;
  ForadoHorarioFim: number;

  // Campos de texto necessários para os filtros
  SentidoText?: string;
  PrefixoRealizado?: string;
  NomeMotorista?: string;
  NomeLinha?: string;
  NomePI?: string;
  NomePF?: string;

  // Outros campos que podem ser úteis
  InicioPrevisto?: string;
  InicioRealizado?: string;
  FimPrevisto?: string;
  FimRealizado?: string;
  InicioRealizadoText?: string;
  FimRealizadoText?: string;
  NumeroViagem?: number;
  Viagem?: number;
}
interface Filtros {
  dataInicio: string;
  dataFim: string;
  tipoVisualizacao: string;
  dia?: string;
  numerolinha?: string;
  idservico?: string;
  prefixorealizado?: string;
  statusini?: string;
  statusfim?: string;
  [key: string]: string | undefined;
}

export function DashboardPage() {
  const [dados, setDados] = useState<ViagemData[]>([]);
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: "",
    dataFim: "",
    tipoVisualizacao: "inicio",
  });
  const [corBarra, setCorBarra] = useState("rgba(250, 204, 21, 0.6)"); // Amarelo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [semResultados, setSemResultados] = useState(false);
  const [buscaIniciada, setBuscaIniciada] = useState(false);
  const [statusAtualizacao, setStatusAtualizacao] = useState<
    "nao-atualizado" | "atualizando" | "atualizado"
  >("nao-atualizado");

  const {
    setFiltrosAplicados,
    obterDescricaoFiltros,
    filtrosDetalhados,
    setFiltrosDetalhados,
    filtrosPrincipais,
    setFiltrosPrincipais,
    ultimaAtualizacao,
    salvarFiltrosAtuais,
  } = useFiltros();

  const navigate = useNavigate();
  const filtrosRef = useRef<Filtros>(filtros);
  const dadosRef = useRef<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  

  const gerarNovaCor = (): string => {
    // Gerar tons de amarelo/âmbar
    const hue = Math.floor(Math.random() * 30) + 40; // 40-70 (amarelo-laranja)
    const saturation = Math.floor(Math.random() * 30) + 70; // 70-100
    const lightness = Math.floor(Math.random() * 20) + 50; // 50-70
    return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;
  };

  const buscarDados = async (filtrosUsar: Filtros = filtrosRef.current) => {
    setError(null);
    setSemResultados(false);
    setStatusAtualizacao("atualizando");

    try {
      const filtrosAjustados = {
        ...filtrosUsar,
        dia: filtrosUsar.dia || filtrosUsar.dataInicio,
      };

      const params = new URLSearchParams();
      if (filtrosAjustados.dia) params.append("dia", filtrosAjustados.dia);
      if (filtrosAjustados.numerolinha)
        params.append("numerolinha", filtrosAjustados.numerolinha);
      if (filtrosAjustados.idservico)
        params.append("idservico", filtrosAjustados.idservico);
      if (filtrosAjustados.prefixorealizado)
        params.append("prefixorealizado", filtrosAjustados.prefixorealizado);
      if (filtrosAjustados.statusini)
        params.append("statusini", filtrosAjustados.statusini);
      if (filtrosAjustados.statusfim)
        params.append("statusfim", filtrosAjustados.statusfim);

      const importResp = await api.get(
        `/cumprimentos/importar?${params.toString()}`,
      );

      if (importResp.data?.dados && Array.isArray(importResp.data.dados)) {
        const novosDados = importResp.data.dados;
        const novosDadosString = JSON.stringify(novosDados);

        if (novosDados.length === 0) {
          setSemResultados(true);
        }

        if (dadosRef.current !== novosDadosString) {
          dadosRef.current = novosDadosString;

          setDados(novosDados);
          setCorBarra(gerarNovaCor());
          setStatusAtualizacao("atualizado");
          setFiltrosPrincipais(filtrosAjustados);
          salvarFiltrosAtuais(
            `Consulta de ${new Date().toLocaleDateString("pt-BR")}`,
          );
        } else {
          setStatusAtualizacao("nao-atualizado");
        }
      } else {
        setSemResultados(true);
      }
    } catch (error) {
      setError("Erro ao buscar dados. Tente novamente.");
      setStatusAtualizacao("nao-atualizado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filtros.dataInicio && filtros.dataFim) {
      buscarDados();
    }
  }, [filtros]);

  const isHoje = (data: string | undefined) => {
    if (!data) return false;
    try {
      const dataFormatada = parseISO(data);
      return isToday(dataFormatada);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const dataFinal = filtros?.dataFim || filtros?.dia;
    const deveAtualizarAutomaticamente = isHoje(dataFinal);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!deveAtualizarAutomaticamente || !buscaIniciada || dados.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (isEqual(filtros, filtrosRef.current)) {
          buscarDados();
        }
      }, 10000);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [buscaIniciada, filtros, dados]);

  const handleSubmitFiltros = (filtrosRecebidos: Record<string, string>) => {
    const filtrosAtualizados: Filtros = {
      dataInicio: filtrosRecebidos.dia || "",
      dataFim: filtrosRecebidos.dia || "",
      tipoVisualizacao: "inicio",
      ...(filtrosRecebidos.numerolinha && {
        numerolinha: filtrosRecebidos.numerolinha,
      }),
      ...(filtrosRecebidos.idservico && {
        idservico: filtrosRecebidos.idservico,
      }),
      ...(filtrosRecebidos.prefixorealizado && {
        prefixorealizado: filtrosRecebidos.prefixorealizado,
      }),
      ...(filtrosRecebidos.statusini && {
        statusini: filtrosRecebidos.statusini,
      }),
      ...(filtrosRecebidos.statusfim && {
        statusfim: filtrosRecebidos.statusfim,
      }),
    };

    // ✅ NOVA SEÇÃO: Salvar TODOS os filtros no contexto
    console.log('🔧 [DashboardPage] Salvando filtros no contexto:', {
      filtrosAtualizados,
      filtrosRecebidos
    });

    // 1. Salvar nos filtros principais (como já estava)
    setFiltrosPrincipais(filtrosAtualizados);

    // 2. ✅ NOVO: Também salvar nos filtros detalhados para garantir que chegem ao PDF
    setFiltrosDetalhados({
      ...filtrosDetalhados, // Manter filtros detalhados existentes (do ChartFilters)
      ...filtrosAtualizados, // Adicionar filtros do dashboard
      // Adicionar campos extras para melhor identificação
      origemFiltro: 'dashboard',
      dataConsulta: new Date().toISOString(),
    });

    // 3. Manter a funcionalidade existente
    setFiltros(filtrosAtualizados);
    filtrosRef.current = filtrosAtualizados;
    setBuscaIniciada(true);
    setLoading(true);
    buscarDados(filtrosAtualizados);
    setFiltrosAplicados(filtrosAtualizados);

    // 4. ✅ NOVO: Debug para verificar se os filtros foram salvos
    setTimeout(() => {
      console.log('🔍 [DashboardPage] Verificando filtros salvos no contexto:', {
        filtrosPrincipais: filtrosPrincipais,
        filtrosDetalhados: filtrosDetalhados
      });
    }, 100);
  };

  const totaisViagens = {
    total: dados.length,
    analisadas: dados.filter((v) => v.StatusInicio > 0 || v.StatusFim > 0)
      .length,
    pendentes:
      dados.length -
      dados.filter((v) => v.StatusInicio > 0 || v.StatusFim > 0).length,
  };

  const statusColors = {
    atualizando: "bg-blue-500",
    atualizado: "bg-green-500",
    "nao-atualizado": "bg-gray-500",
  };

  const statusTexts = {
    atualizando: "Atualizando...",
    atualizado: "Atualizado",
    "nao-atualizado": "Sem atualizações",
  };

  // CALCULAR formattedDate EM DashboardPage.tsx
  const formattedDate = useMemo(() => {
    const dataRef = filtrosPrincipais.dia || filtrosPrincipais.dataInicio;
    if (dataRef) {
      try {
        // Adiciona T00:00:00 para garantir que a data seja interpretada corretamente
        // independente do fuso horário local ao criar o objeto Date.
        return new Date(dataRef + "T00:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } catch (e) {
       // console.error("Erro ao formatar dataRef:", e);
      }
    }
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [filtrosPrincipais.dia, filtrosPrincipais.dataInicio]);

  // Lógica para determinar o estado de exibição do status
  const getDisplayStatus = () => {
    const hoje = isHoje(filtros.dataFim || filtros.dia);

    // 1. Prioridade para carregamento ativo (seja inicial ou recarga)
    if (loading && buscaIniciada) {
      // Busca em andamento após a primeira interação
      return {
        icon: <Loader2 className="text-primary h-4 w-4 animate-spin" />, // Usar cor primária (amarelo)
        text: "Carregando dados...",
        tooltipText: "Buscando as informações mais recentes.",
        twClasses:
          "bg-primary/10 border-primary/30 text-primary dark:bg-primary/20 dark:border-primary/50 dark:text-primary",
      };
    }
    // Estado de "atualizando" do auto-refresh (se o loading principal já terminou)
    if (statusAtualizacao === "atualizando" && !loading) {
      return {
        icon: <RefreshCw className="text-primary h-4 w-4 animate-spin" />,
        text: "Verificando...", // Texto mais curto para o refresh rápido
        tooltipText: "Verificando novos dados em tempo real.",
        twClasses:
          "bg-primary/10 border-primary/30 text-primary dark:bg-primary/20 dark:border-primary/50 dark:text-primary animate-pulse",
      };
    }

    // 2. Prioridade para erros
    if (error) {
      return {
        icon: (
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        ),
        text: "Falha ao carregar",
        tooltipText: `Erro: ${error}`, // Mostrar o erro no tooltip
        twClasses:
          "bg-red-100/70 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400",
      };
    }

    // 3. Após uma busca (buscaIniciada === true) e sem estar carregando ou com erro
    if (buscaIniciada) {
      if (semResultados) {
        return {
          icon: (
            <SearchX className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          ),
          text: "Nenhum Dado",
          tooltipText: "Nenhum dado encontrado para os filtros aplicados.",
          twClasses:
            "bg-orange-100/70 border-orange-400 text-orange-700 dark:bg-orange-900/30 dark:border-orange-600 dark:text-orange-400",
        };
      }

      // Se temos dados
      if (dados.length > 0) {
        if (hoje) {
          // Se a data selecionada é HOJE
          return {
            icon: (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            ),
            text: `Dados atualizados - Última verificação: ${ultimaAtualizacao}`,
            // O tooltip pode dar mais detalhes sobre a última verificação
            tooltipText: `Exibindo dados de hoje. ${ultimaAtualizacao ? `Última verificação: ${ultimaAtualizacao}` : "Dados atualizados."}`,
            twClasses:
              "bg-green-100/70 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400",
          };
        } else {
          // Se a data selecionada é um DIA PASSADO
          return {
            icon: (
              <CalendarCheck2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            ),
            text: `Dados de ${formattedDate}`,
            tooltipText: `Exibindo dados consolidados para ${formattedDate}.`,
            twClasses:
              "bg-slate-100/70 border-slate-400 text-slate-700 dark:bg-slate-700/30 dark:border-slate-500 dark:text-slate-400",
          };
        }
      }
    }

    // 4. Estado inicial, antes da primeira busca (loading já tratado acima se !buscaIniciada)
    if (!buscaIniciada && !loading) {
      return {
        icon: <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />,
        text: "Pronto para consulta",
        tooltipText: "Aplique os filtros para iniciar.",
        twClasses:
          "bg-slate-100/70 border-slate-400 text-slate-700 dark:bg-slate-700/30 dark:border-slate-500 dark:text-slate-400",
      };
    }

    return null; // Caso padrão: não mostrar nada
  };

  const displayStatus = getDisplayStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />

              <img src={logo} alt="Logo da Empresa" className="h-14 w-14" />
              <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-xl font-semibold text-transparent dark:from-white dark:to-gray-400">
                Dashboard de Viagens
              </h1>
            </div>

            {/* Status de atualização */}
            {/* Status de atualização REFEITO */}
            <AnimatePresence mode="wait">
              {/* Renderiza o displayStatus apenas se ele não for null */}
              {displayStatus && (
                <motion.div
                  key={
                    displayStatus.text +
                    (displayStatus.icon?.type?.toString() || "")
                  } // Chave um pouco mais robusta
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          className={cn(
                            "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium tracking-tight", // Estrutura e espaçamento base + borda explícita
                            "transition-colors duration-300", // Suaviza transição de cor
                            displayStatus.twClasses, // Cores dinâmicas (bg, border-color, text-color)
                          )}
                        >
                          {displayStatus.icon}
                          <span>{displayStatus.text}</span>
                        </Badge>
                      </TooltipTrigger>
                      {displayStatus.tooltipText && (
                        <TooltipContent>
                          <p>{displayStatus.tooltipText}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="mx-auto max-w-screen-2xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8 border-0 bg-white/90 shadow-lg backdrop-blur dark:bg-gray-900/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-yellow-500" />
                Filtros de Pesquisa
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para análise das viagens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FiltrosDashboard onFilter={handleSubmitFiltros} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        {dados.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4"
          >
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total de Viagens
                    </p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {totaisViagens.total}
                    </p>
                  </div>
                  <Bus className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-md dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Realizadas
                    </p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {totaisViagens.analisadas}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 shadow-md dark:from-amber-900/20 dark:to-amber-800/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Pendentes
                    </p>
                    <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                      {totaisViagens.pendentes}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            {/* NOVO CARD: Data da Consulta */}
            <Card className="border-0 bg-gradient-to-br from-slate-100 to-slate-200 shadow-lg transition-shadow hover:shadow-xl dark:from-slate-800/30 dark:to-slate-700/30">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Data da Consulta
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {formattedDate}
                    </p>
                  </div>
                  <CalendarDays className="h-10 w-10 text-slate-600 opacity-60 dark:text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Content States */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-yellow-500" />
                    <p className="text-lg font-medium">Carregando dados...</p>
                    <p className="text-sm text-gray-500">
                      Por favor, aguarde enquanto processamos sua solicitação
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          ) : semResultados ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Search className="h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-semibold">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="max-w-md text-center text-sm text-gray-500">
                      Não foram encontrados dados com os filtros aplicados.
                      Tente ajustar os critérios de busca.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : dados.length > 0 ? (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 bg-white/90 shadow-xl backdrop-blur dark:bg-gray-900/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-yellow-500" />
                    Análise de Cumprimento
                  </CardTitle>
                  <CardDescription>
                    Visualização detalhada do status das viagens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={dados}
                    corBarra={corBarra}
                    filtrosIniciaisDetalhados={filtrosDetalhados} // Nova prop
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <TrendingUp className="h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-semibold">
                      Pronto para começar
                    </h3>
                    <p className="max-w-md text-center text-sm text-gray-500">
                      Utilize os filtros acima para consultar os dados de
                      viagens
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
