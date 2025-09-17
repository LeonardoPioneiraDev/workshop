import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { useFiltros } from "../../contexts/FiltrosContext.js";
import { ErrorBoundary } from "../../ErrorBoundary/ErrorBoundary.js";
import { commonChartOptions } from "../../utils/chartOptions.js";
import { buildChartData } from "../../utils/chartUtils.js";
// ✅ IMPORTAR O useExportHook
import { useExport } from "../../contexts/useExportHook.js"; // Ajuste o caminho conforme necessário
import { ChartFilters } from "../ChartFilters/ChartFilters.js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { mapearSetor } from "@/utils/setorUtils.js";
import { getCssVariableValue } from "@/utils/styleUtils.js";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  ClockIcon,
  FileSpreadsheet,
  FileText,
  History,
  Info,
  InfoIcon,
  ListFilter,
  ListFilterIcon,
  MinusCircle,
  Route,
  SearchX,
  ThumbsUp,
  XCircle,
} from "lucide-react";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels,
);

interface ViagemData {
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
  NomeMotorista?: string;
  NomeLinha?: string;
  SentidoText?: string;
  InicioRealizadoText?: string;
  FimRealizadoText?: string;
  SetorText?: string;
  PrefixoRealizado?: string;
  NumeroViagem?: number;
  InicioPrevisto?: string;
  InicioRealizado?: string;
  DiferencaInicio?: number;
  FimPrevisto?: string;
  FimRealizado?: string;
  DiferencaFim?: number;
  NomePI?: string;
  NomePF?: string;
  NaoCumpridoFim?: number;
}

interface BarChartProps {
  data: ViagemData[];
  corBarra?: string;
  filtrosIniciaisDetalhados?: Record<string, string>;
  // ✅ NOVAS PROPS ADICIONADAS
  filtrosDashboard?: Record<string, any>; // Filtros vindos do Dashboard
  dataReferencia?: string; // Data de referência formatada
}

export function BarChart({
  data,
  corBarra,
  filtrosIniciaisDetalhados,
  // ✅ RECEBER AS NOVAS PROPS
  filtrosDashboard,
  dataReferencia,
}: BarChartProps) {
  const [view, setView] = useState<"inicio" | "fim" | "ambos">("ambos");
  const [chartType, setChartType] = useState<"bar" | "pie" | "both">("both");
  const [isTogglingDetails, setIsTogglingDetails] = useState(false);

  const {
    filtrosPrincipais,
    filtrosDetalhados,
    obterDescricaoFiltros,
    setFiltrosDetalhados,
    obterDadosContext,
    ultimaAtualizacao,
  } = useFiltros();

  const [resolvedPieColors, setResolvedPieColors] = useState<string[]>([]);
  const [resolvedBarColors, setResolvedBarColors] = useState<string[]>([]);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(
    !!filtrosDetalhados.mostrarDetalhes,
  );
  const [tiposStatus, setTiposStatus] = useState(
    filtrosDetalhados.tiposStatus || {
      adiantado: true,
      atrasado: true,
      fora: true,
      parcial: false,
      nao: false,
    },
  );
  const [periodoDetalhes, setPeriodoDetalhes] = useState<
    "inicio" | "fim" | "ambos"
  >(filtrosDetalhados.periodoDetalhes || "ambos");
  const [limitarRegistros, setLimitarRegistros] = useState(
    filtrosDetalhados.limitarRegistros !== undefined
      ? filtrosDetalhados.limitarRegistros
      : true,
  );
  const [limiteRegistros, setLimiteRegistros] = useState(
    filtrosDetalhados.limiteRegistros || 20,
  );
  const [filtrosSelecionados, setFiltrosSelecionados] = useState<
    Record<string, string>
  >(filtrosIniciaisDetalhados || {});

  const handleSetFiltrosSelecionados = useCallback(
    (novosFiltros: Record<string, string>) => {
      setFiltrosSelecionados(novosFiltros);
    },
    [],
  );

  // === LÓGICA DE NEGÓCIOS (mantida igual) ===
  const dadosComSetor = useMemo(() => {
    const resultado = data.map((item) => ({
      ...item,
      SetorText: mapearSetor(item),
    }));
    return resultado;
  }, [data]);

  const dadosFiltrados = useMemo(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("=== INÍCIO DA FILTRAGEM ===");
      console.log("Filtros aplicados:", filtrosSelecionados);
      console.log("Total de dados antes de filtrar:", dadosComSetor.length);
    }

    const resultado = dadosComSetor.filter((item) => {
      const motorista = filtrosSelecionados["motorista"];
      const linha = filtrosSelecionados["linha"];
      const sentido = filtrosSelecionados["sentido"];
      const setor = filtrosSelecionados["setor"];
      const prefixo = filtrosSelecionados["prefixoRealizado"];

      return (
        (!motorista || item.NomeMotorista === motorista) &&
        (!linha || item.NomeLinha === linha) &&
        (!sentido || item.SentidoText === sentido) &&
        (!setor || item.SetorText === setor) &&
        (!prefixo || item.PrefixoRealizado === prefixo)
      );
    });

    if (process.env.NODE_ENV === "development") {
      console.log("Total após filtrar:", resultado.length);
      console.log("=== FIM DA FILTRAGEM ===");
    }

    return resultado;
  }, [dadosComSetor, filtrosSelecionados]);

  const formattedDate = useMemo(() => {
    // ✅ USAR dataReferencia SE FORNECIDA, SENÃO USAR LÓGICA ORIGINAL
    if (dataReferencia) {
      return dataReferencia;
    }

    // Lógica original como fallback
    const dataRef = filtrosPrincipais.dia || filtrosPrincipais.dataInicio;
    if (dataRef) {
      try {
        return new Date(dataRef + "T00:00:00").toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } catch (e) {
        /* fallback para data atual se dataRef for inválida */
      }
    }
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [filtrosPrincipais.dia, filtrosPrincipais.dataInicio, dataReferencia]);

  const totaisViagens = useMemo(() => {
    const total = dadosFiltrados.length;
    const analisadas = dadosFiltrados.filter(
      (v) =>
        (v.InicioRealizadoText && v.InicioRealizadoText !== "-") ||
        (v.FimRealizadoText && v.FimRealizadoText !== "-"),
    ).length;
    const pendentes = total - analisadas;
    return { total, analisadas, pendentes };
  }, [dadosFiltrados]);

  const viagensDetalhadas = useMemo(() => {
    const resultado: ViagemData[] = [];
    dadosFiltrados.forEach((viagem) => {
      let incluir = false;
      if (periodoDetalhes === "inicio" || periodoDetalhes === "ambos") {
        if (
          (tiposStatus.adiantado && viagem.AdiantadoInicio > 0) ||
          (tiposStatus.atrasado && viagem.AtrasadoInicio > 0) ||
          (tiposStatus.fora && viagem.ForadoHorarioInicio > 0) ||
          (tiposStatus.parcial && viagem.ParcialmenteCumprida > 0) ||
          (tiposStatus.nao && viagem.NaoCumprida > 0)
        )
          incluir = true;
      }
      if (
        !incluir &&
        (periodoDetalhes === "fim" || periodoDetalhes === "ambos")
      ) {
        if (
          (tiposStatus.adiantado && viagem.AdiantadoFim > 0) ||
          (tiposStatus.atrasado && viagem.AtrasadoFim > 0) ||
          (tiposStatus.fora && viagem.ForadoHorarioFim > 0) ||
          (tiposStatus.parcial && viagem.ParcialmenteCumprida > 0) ||
          (tiposStatus.nao && viagem.NaoCumprida > 0)
        )
          incluir = true;
      }
      if (incluir) resultado.push(viagem);
    });
    resultado.sort((a, b) => (a.NumeroViagem || 0) - (b.NumeroViagem || 0));
    return limitarRegistros ? resultado.slice(0, limiteRegistros) : resultado;
  }, [
    dadosFiltrados,
    tiposStatus,
    periodoDetalhes,
    limitarRegistros,
    limiteRegistros,
  ]);

  // ✅ USAR O useExportHook AQUI
  const { handleExportPDF, handleExportExcel } = useExport(
    dadosFiltrados, // dados filtrados
    {
      // ✅ COMBINAR FILTROS DO DASHBOARD + FILTROS DO GRÁFICO
      ...filtrosDashboard, // Filtros vindos do Dashboard
      ...filtrosSelecionados, // Filtros aplicados no gráfico (motorista, linha, etc.)
    },
    view, // tipo de visualização
    chartType, // tipo de gráfico
    totaisViagens, // totais calculados
    formattedDate, // data formatada
    // ✅ PARÂMETROS EXTRAS PARA DETALHES DAS VIAGENS
    mostrarDetalhes, // se deve incluir detalhes
    viagensDetalhadas, // dados das viagens detalhadas
    {
      // filtros específicos dos detalhes
      tiposStatus,
      periodoDetalhes,
      limitarRegistros,
      limiteRegistros,
    }
  );

  // === RESTO DA LÓGICA PERMANECE IGUAL ===
  useEffect(() => {
    setMostrarDetalhes(!!filtrosDetalhados.mostrarDetalhes);
    if (filtrosDetalhados.tiposStatus)
      setTiposStatus(filtrosDetalhados.tiposStatus);
    if (filtrosDetalhados.periodoDetalhes)
      setPeriodoDetalhes(filtrosDetalhados.periodoDetalhes);
    if (filtrosDetalhados.limitarRegistros !== undefined)
      setLimitarRegistros(filtrosDetalhados.limitarRegistros);
    if (filtrosDetalhados.limiteRegistros)
      setLimiteRegistros(filtrosDetalhados.limiteRegistros);
    if (
      filtrosDetalhados.motorista ||
      filtrosDetalhados.linha ||
      filtrosDetalhados.sentido ||
      filtrosDetalhados.setor ||
      filtrosDetalhados.prefixoRealizado
    ) {
      const newFiltrosSelecionados: { [key: string]: string } = {};
      if (filtrosDetalhados.motorista)
        newFiltrosSelecionados["motorista"] = filtrosDetalhados.motorista;
      if (filtrosDetalhados.linha)
        newFiltrosSelecionados["linha"] = filtrosDetalhados.linha;
      setFiltrosSelecionados(newFiltrosSelecionados);
    }
  }, [filtrosDetalhados]);

  const updateFiltrosDetalhadosContext = useCallback(
    (updates: Partial<typeof filtrosDetalhados>) => {
      setFiltrosDetalhados({ ...filtrosDetalhados, ...updates });
    },
    [filtrosDetalhados, setFiltrosDetalhados],
  );

  const toggleMostrarDetalhesHandler = () => {
    if (isTogglingDetails) return;
    setIsTogglingDetails(true);
    const novoValor = !mostrarDetalhes;
    setMostrarDetalhes(novoValor);
    updateFiltrosDetalhadosContext({ mostrarDetalhes: novoValor });
    setTimeout(() => setIsTogglingDetails(false), 300);
  };

  const toggleTipoStatusHandler = (tipo: keyof typeof tiposStatus) => {
    const novosTipos = { ...tiposStatus, [tipo]: !tiposStatus[tipo] };
    setTiposStatus(novosTipos);
    updateFiltrosDetalhadosContext({ tiposStatus: novosTipos });
  };

  const handlePeriodoDetalhesChangeHandler = (
    periodo: "inicio" | "fim" | "ambos",
  ) => {
    setPeriodoDetalhes(periodo);
    updateFiltrosDetalhadosContext({ periodoDetalhes: periodo });
  };

  const toggleLimitarRegistrosHandler = () => {
    const novoValor = !limitarRegistros;
    setLimitarRegistros(novoValor);
    updateFiltrosDetalhadosContext({ limitarRegistros: novoValor });
  };

  const handleLimiteRegistrosChangeHandler = (valor: string) => {
    const numValor = parseInt(valor) || 20;
    setLimiteRegistros(numValor);
    updateFiltrosDetalhadosContext({ limiteRegistros: numValor });
  };

  // ✅ REMOVER AS FUNÇÕES DE EXPORTAÇÃO ANTIGAS
  // (handleExportPDFCallback e handleExportExcelCallback)
  // Agora usamos diretamente handleExportPDF e handleExportExcel do hook

  // === RESTO DO CÓDIGO DE GRÁFICOS E RENDERIZAÇÃO PERMANECE IGUAL ===
  const statusInicioKeys: (keyof ViagemData)[] = [
    "AdiantadoInicio",
    "AtrasadoInicio",
    "ForadoHorarioInicio",
    "ParcialmenteCumprida",
    "NaoCumprida",
  ];
  const statusFimKeys: (keyof ViagemData)[] = [
    "AdiantadoFim",
    "AtrasadoFim",
    "ForadoHorarioFim",
    "ParcialmenteCumprida",
    "NaoCumprida",
  ];

  const chartLabels = [
    "Adiantado",
    "Atrasado",
    "Fora do Horário",
    "Parcial",
    "Não Realizada",
  ];

  const pieColorVarNames = [
    "chart-2",
    "chart-4",
    "chart-1",
    "chart-5",
    "chart-3",
  ];

  const barColorVarNames = [
    "chart-2",
    "chart-4",
    "chart-1",
    "chart-5",
    "chart-3",
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const resolveColors = (varNames: string[]) =>
        varNames.map((name) => getCssVariableValue(name));

      setResolvedPieColors(resolveColors(pieColorVarNames));
      setResolvedBarColors(resolveColors(barColorVarNames));
    }
  }, []);

  const barChartDataInicio = useMemo(() => {
    if (resolvedBarColors.length === 0 && dadosFiltrados.length > 0)
      return {
        labels: chartLabels,
        datasets: [{ data: statusInicioKeys.map(() => 0) }],
      };
    return buildChartData(
      dadosFiltrados,
      statusInicioKeys,
      chartLabels,
      resolvedBarColors,
      "Status Início",
    );
  }, [dadosFiltrados, statusInicioKeys, chartLabels, resolvedBarColors]);

  const barChartDataFim = useMemo(() => {
    if (resolvedBarColors.length === 0 && dadosFiltrados.length > 0)
      return {
        labels: chartLabels,
        datasets: [{ data: statusFimKeys.map(() => 0) }],
      };
    return buildChartData(
      dadosFiltrados,
      statusFimKeys,
      chartLabels,
      resolvedBarColors,
      "Status Fim",
    );
  }, [dadosFiltrados, statusFimKeys, chartLabels, resolvedBarColors]);

  const pieChartDataInicio = useMemo(() => {
    if (resolvedPieColors.length === 0 && dadosFiltrados.length > 0)
      return {
        labels: chartLabels,
        datasets: [{ data: statusInicioKeys.map(() => 0) }],
      };
    return buildChartData(
      dadosFiltrados,
      statusInicioKeys,
      chartLabels,
      resolvedPieColors,
      "Status Início",
    );
  }, [dadosFiltrados, statusInicioKeys, chartLabels, resolvedPieColors]);

  const pieChartDataFim = useMemo(() => {
    if (resolvedPieColors.length === 0 && dadosFiltrados.length > 0)
      return {
        labels: chartLabels,
        datasets: [{ data: statusFimKeys.map(() => 0) }],
      };
    return buildChartData(
      dadosFiltrados,
      statusFimKeys,
      chartLabels,
      resolvedPieColors,
      "Status Fim",
    );
  }, [dadosFiltrados, statusFimKeys, chartLabels, resolvedPieColors]);

  // === FUNÇÕES DE FORMATAÇÃO (mantidas iguais) ===
  const viagemFoiIniciada = (viagem: ViagemData): boolean =>
    (viagem.InicioRealizadoText &&
      viagem.InicioRealizadoText !== "-" &&
      viagem.InicioRealizadoText !== "N/A") ||
    (viagem.InicioRealizado &&
      viagem.InicioRealizado !== "-" &&
      viagem.InicioRealizado !== "N/A");

  const viagemFoiFinalizada = (viagem: ViagemData): boolean =>
    (viagem.FimRealizadoText &&
      viagem.FimRealizadoText !== "-" &&
      viagem.FimRealizadoText !== "N/A") ||
    (viagem.FimRealizado &&
      viagem.FimRealizado !== "-" &&
      viagem.FimRealizado !== "N/A");

  const obterHorarioValido = (
    horarioPrincipal?: string,
    horarioAlternativo?: string,
  ): string =>
    horarioPrincipal && horarioPrincipal !== "-" && horarioPrincipal !== "N/A"
      ? horarioPrincipal
      : horarioAlternativo &&
          horarioAlternativo !== "-" &&
          horarioAlternativo !== "N/A"
        ? horarioAlternativo
        : "N/A";

  const formatarHorario = (horario?: string): string => {
    if (!horario || horario === "-" || horario === "N/A") return "N/A";
    if (horario.includes("/")) {
      const partes = horario.split(" ");
      if (partes.length > 1) return partes[1];
    }
    return horario;
  };

  const calcularDiferencaMinutos = (
    horarioPrevisto: string,
    horarioRealizado: string,
    horarioRealizadoAlt?: string,
  ): number | null => {
    try {
      const horarioRealizadoValido = obterHorarioValido(
        horarioRealizado,
        horarioRealizadoAlt,
      );
      if (
        !horarioPrevisto ||
        horarioPrevisto === "N/A" ||
        horarioPrevisto === "-" ||
        !horarioRealizadoValido ||
        horarioRealizadoValido === "N/A"
      )
        return null;
      const extrairHorario = (h: string): string =>
        h.includes("/") ? h.split(" ")[1] || h : h;
      const horarioPrev = extrairHorario(horarioPrevisto);
      const horarioReal = extrairHorario(horarioRealizadoValido);
      const [horasPrev, minutosPrev] = horarioPrev.split(":").map(Number);
      const [horasReal, minutosReal] = horarioReal.split(":").map(Number);
      const totalMinutosPrev = horasPrev * 60 + minutosPrev;
      const totalMinutosReal = horasReal * 60 + minutosReal;
      return totalMinutosReal - totalMinutosPrev;
    } catch (error) {
      return null;
    }
  };

  const determinarStatusViagem = (
    viagem: ViagemData,
  ): { inicioStatus: string; fimStatus: string } => {
    const iniciada = viagemFoiIniciada(viagem);
    const finalizada = viagemFoiFinalizada(viagem);
    const diferencaInicio = iniciada
      ? (viagem.DiferencaInicio ??
        calcularDiferencaMinutos(
          viagem.InicioPrevisto || "",
          viagem.InicioRealizadoText || "",
          viagem.InicioRealizado,
        ))
      : null;
    const diferencaFim = finalizada
      ? (viagem.DiferencaFim ??
        calcularDiferencaMinutos(
          viagem.FimPrevisto || "",
          viagem.FimRealizadoText || "",
          viagem.FimRealizado,
        ))
      : null;

    let iStatus = "normal";
    if (!iniciada) iStatus = "nao";
    else if (diferencaInicio === null) iStatus = "normal";
    else if (diferencaInicio < -5) iStatus = "adiantado";
    else if (diferencaInicio > 15) iStatus = "fora";
    else if (diferencaInicio > 5) iStatus = "atrasado";

    let fStatus = "normal";
    if (!finalizada) fStatus = "nao";
    else if (diferencaFim === null) fStatus = "normal";
    else if (diferencaFim < -5) fStatus = "adiantado";
    else if (diferencaFim > 15) fStatus = "fora";
    else if (diferencaFim > 5) fStatus = "atrasado";

    return { inicioStatus: iStatus, fimStatus: fStatus };
  };

  const formatarDiferenca = (
    minutos?: number | null,
  ): { texto: string; classe: string; sinal: string } => {
    if (minutos === undefined || minutos === null)
      return { texto: "N/A", classe: "text-muted-foreground", sinal: "" };
    const valorAbsoluto = Math.abs(minutos);
    const horas = Math.floor(valorAbsoluto / 60);
    const minutosRestantes = Math.floor(valorAbsoluto % 60);
    let textoFormatado = "";
    if (horas > 0) textoFormatado += `${horas}h `;
    textoFormatado += `${minutosRestantes}min`;

    let classe = "text-foreground";
    let sinal = "";
    if (minutos < -5) {
      classe = "text-blue-600 dark:text-blue-400";
      sinal = "-";
    } else if (minutos > 5) {
      classe = "text-red-600 dark:text-red-400";
      sinal = "+";
    }

    return { texto: textoFormatado.trim(), classe, sinal };
  };

  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "adiantado":
        return "default";
      case "atrasado":
        return "destructive";
      case "fora":
        return "secondary";
      case "parcial":
        return "outline";
      case "nao":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColors = (
    statusKey: string,
    type: "text" | "bg" | "border",
  ): string => {
    const statusMap: Record<string, Record<string, string>> = {
      adiantado: {
        text: "text-blue-700 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900",
        border: "border-blue-500",
      },
      atrasado: {
        text: "text-red-700 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900",
        border: "border-red-500",
      },
      fora: {
        text: "text-orange-700 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900",
        border: "border-orange-500",
      },
      parcial: {
        text: "text-yellow-700 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-900",
        border: "border-yellow-500",
      },
      nao: {
        text: "text-gray-700 dark:text-gray-400",
        bg: "bg-gray-100 dark:bg-gray-700",
        border: "border-gray-500",
      },
      normal: {
        text: "text-green-700 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900",
        border: "border-green-500",
      },
    };
    return (
      statusMap[statusKey]?.[type] ||
      "text-foreground bg-background border-border"
    );
  };

  const renderFiltrosPrincipaisBadges = () => {
    const ativos = [];
    const fP = filtrosPrincipais;

    if (fP.dia)
      ativos.push({
        icone: "🗓️",
        chave: "Data Consulta",
        valor: formattedDate,
      });
    else {
      if (fP.dataInicio)
        ativos.push({
          icone: "🗓️",
          chave: "Data Início",
          valor: fP.dataInicio,
        });
      if (fP.dataFim)
        ativos.push({ icone: "🗓️", chave: "Data Fim", valor: fP.dataFim });
    }

    if (fP.numerolinha)
      ativos.push({
        icone: <Route className="h-3.5 w-3.5" />,
        chave: "Linha (Principal)",
        valor: fP.numerolinha,
      });
    if (fP.idservico)
      ativos.push({ icone: "🆔", chave: "ID Serviço", valor: fP.idservico });

    if (ativos.length === 0)
      return (
        <span className="text-muted-foreground italic">
          Nenhum filtro principal aplicado.
        </span>
      );

    return ativos.map((f) => (
      <Badge
        key={f.chave}
        variant="outline"
        className="bg-background/70 dark:bg-muted/70 h-7 text-xs"
      >
        {f.icone && <span className="mr-1.5">{f.icone}</span>}
        <span className="mr-1 font-medium">{f.chave}:</span>
        {f.valor}
      </Badge>
    ));
  };

  const renderFiltrosGraficoBadges = () => {
    const ativos = Object.entries(filtrosSelecionados)
      .filter(([, valor]) => valor && String(valor).trim() !== "")
      .map(([chave, valor]) => {
        const nomeChave =
          {
            motorista: "Motorista",
            linha: "Linha (Gráfico)",
            sentido: "Sentido",
            setor: "Setor",
            prefixoRealizado: "Prefixo (Gráfico)",
          }[chave] || chave;
        return { chave: nomeChave, valor: String(valor) };
      });

    if (ativos.length === 0)
      return (
        <span className="text-muted-foreground italic">
          Nenhum filtro de gráfico aplicado.
        </span>
      );

    return ativos.map((f) => (
      <Badge key={f.chave} variant="secondary" className="h-7 text-xs">
        <ListFilterIcon className="mr-1.5 h-3 w-3" />
        <span className="mr-1 font-medium">{f.chave}:</span>
        {f.valor}
      </Badge>
    ));
  };

  const getStatusPresentation = (statusKey: string, periodoLabel: string) => {
    let headerClasses = "";
    let textClasses = "text-primary-foreground";
    let iconComponent: React.ElementType = InfoIcon;
    let footerMessage = "";

    switch (statusKey) {
      case "adiantado":
        headerClasses = "bg-blue-600 dark:bg-blue-700";
        textClasses = "text-blue-50";
        iconComponent = ThumbsUp;
        footerMessage = `Viagem com ${periodoLabel.toLowerCase()} adiantado.`;
        break;
      case "atrasado":
        headerClasses = "bg-amber-500 dark:bg-amber-600";
        textClasses = "text-amber-950 dark:text-amber-50";
        iconComponent = ClockIcon;
        footerMessage = `Viagem com ${periodoLabel.toLowerCase()} em atraso.`;
        break;
      case "fora":
        headerClasses = "bg-primary dark:bg-yellow-600";
        textClasses = "text-primary-foreground dark:text-yellow-950";
        iconComponent = AlertTriangle;
        footerMessage = `Viagem com ${periodoLabel.toLowerCase()} fora do horário.`;
        break;
      case "parcial":
        headerClasses = "bg-purple-600 dark:bg-purple-700";
        textClasses = "text-purple-50";
        iconComponent = MinusCircle;
        footerMessage = "Viagem cumprida parcialmente fora do horário.";
        break;
      case "nao":
        headerClasses = "bg-destructive dark:bg-red-700";
        textClasses = "text-destructive-foreground";
        iconComponent = XCircle;
        footerMessage = `Viagem com ${periodoLabel.toLowerCase()} não realizado.`;
        if (periodoLabel === "VIAGEM") footerMessage = "Viagem não realizada.";
        break;
      case "normal":
        headerClasses = "bg-green-600 dark:bg-green-700";
        textClasses = "text-green-50";
        iconComponent = CheckCircle;
        footerMessage = `Viagem com ${periodoLabel.toLowerCase()} dentro do horário.`;
        break;
      default:
        headerClasses = "bg-slate-500 dark:bg-slate-600";
        textClasses = "text-slate-50";
        iconComponent = InfoIcon;
        footerMessage = "Status da viagem.";
    }
    return { headerClasses, textClasses, Icon: iconComponent, footerMessage };
  };

  const renderizarDetalheViagem = (viagem: ViagemData) => {
    const iniciada = viagemFoiIniciada(viagem);
    const finalizada = viagemFoiFinalizada(viagem);

    const { inicioStatus, fimStatus } = determinarStatusViagem(viagem);
    const detalhesRenderizados: JSX.Element[] = [];

    const inicioPrevistoFmt = formatarHorario(viagem.InicioPrevisto);
    const inicioRealizadoFmt = formatarHorario(
      obterHorarioValido(viagem.InicioRealizadoText, viagem.InicioRealizado),
    );
    const diferencaInicioCalc = iniciada
      ? (viagem.DiferencaInicio ??
        calcularDiferencaMinutos(
          viagem.InicioPrevisto || "",
          viagem.InicioRealizadoText || "",
          viagem.InicioRealizado,
        ))
      : null;
    const formatoInicio = formatarDiferenca(diferencaInicioCalc);

    const fimPrevistoFmt = formatarHorario(viagem.FimPrevisto);
    const fimRealizadoFmt = formatarHorario(
      obterHorarioValido(viagem.FimRealizadoText, viagem.FimRealizado),
    );
    const diferencaFimCalc = finalizada
      ? (viagem.DiferencaFim ??
        calcularDiferencaMinutos(
          viagem.FimPrevisto || "",
          viagem.FimRealizadoText || "",
          viagem.FimRealizado,
        ))
      : null;
    const formatoFim = formatarDiferenca(diferencaFimCalc);

    const keyBase =
      viagem.NumeroViagem || Math.random().toString(36).substring(2, 9);

    const createDetalheCard = (
      statusKey: string,
      periodoLabel: "INÍCIO" | "FIM" | "VIAGEM",
      previsto: string,
      realizado: string,
      formatoDif: { texto: string; classe: string; sinal: string },
      statusTextOverride?: string,
    ) => {
      const { headerClasses, textClasses, Icon, footerMessage } =
        getStatusPresentation(statusKey, periodoLabel);
      const titleText =
        statusTextOverride ||
        statusKey.charAt(0).toUpperCase() + statusKey.slice(1);

      return (
        <Card
          key={`${keyBase}-${statusKey}-${periodoLabel}`}
          className="py-0 shadow-md transition-shadow hover:shadow-lg"
        >
          <CardHeader
            className={cn(
              "flex flex-row items-center justify-between p-2.5",
              headerClasses,
              textClasses,
            )}
          >
            <CardTitle
              className={cn(
                "text-base font-semibold tracking-wider uppercase",
                textClasses,
              )}
            >
              {titleText}
            </CardTitle>
            <span className={cn("text-xs opacity-80", textClasses)}>
              {periodoLabel !== "VIAGEM" ? periodoLabel : ""}
            </span>
          </CardHeader>
          <CardContent className="space-y-1 p-3 text-[14px]">
            <p className="text-foreground font-medium">
              Viagem na Linha {viagem.NomeLinha || "-"}
            </p>
            <p className="text-muted-foreground text-[13px]">
              Carro {viagem.PrefixoRealizado || "-"}, Motorista:{" "}
              {viagem.NomeMotorista || "N/A"}
            </p>
            <div className="grid grid-cols-[auto_1fr] gap-x-2 pt-1 text-[13px]">
              <span className="text-muted-foreground">Previsto:</span>
              <span>{previsto}</span>
              <span className="text-muted-foreground">Realizado:</span>
              <span className={cn(formatoDif.classe, "font-medium")}>
                {realizado}
              </span>
            </div>
            <p className={cn("text-[13px] font-medium", formatoDif.classe)}>
              Diferença: {formatoDif.sinal}
              {formatoDif.texto}
            </p>
          </CardContent>
          {footerMessage && (
            <CardFooter
              className={cn(
                "flex items-center gap-1.5 border-t p-2.5 text-xs",
                getStatusColors(statusKey, "bg"),
                getStatusColors(statusKey, "text"),
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  getStatusColors(statusKey, "text"),
                )}
              />
              <span className="text-[11px]">{footerMessage}</span>
            </CardFooter>
          )}
        </Card>
      );
    };

    // Lógica para adicionar cards baseada nos status
    if (periodoDetalhes === "inicio" || periodoDetalhes === "ambos") {
      if (tiposStatus.adiantado && inicioStatus === "adiantado")
        detalhesRenderizados.push(
          createDetalheCard(
            "adiantado",
            "INÍCIO",
            inicioPrevistoFmt,
            inicioRealizadoFmt,
            formatoInicio,
          ),
        );
      if (tiposStatus.atrasado && inicioStatus === "atrasado")
        detalhesRenderizados.push(
          createDetalheCard(
            "atrasado",
            "INÍCIO",
            inicioPrevistoFmt,
            inicioRealizadoFmt,
            formatoInicio,
          ),
        );
      if (tiposStatus.fora && inicioStatus === "fora")
        detalhesRenderizados.push(
          createDetalheCard(
            "fora",
            "INÍCIO",
            inicioPrevistoFmt,
            inicioRealizadoFmt,
            formatoInicio,
            "Furo de Horário",
          ),
        );
    }
    if (periodoDetalhes === "fim" || periodoDetalhes === "ambos") {
      if (tiposStatus.adiantado && fimStatus === "adiantado")
        detalhesRenderizados.push(
          createDetalheCard(
            "adiantado",
            "FIM",
            fimPrevistoFmt,
            fimRealizadoFmt,
            formatoFim,
          ),
        );
      if (tiposStatus.atrasado && fimStatus === "atrasado")
        detalhesRenderizados.push(
          createDetalheCard(
            "atrasado",
            "FIM",
            fimPrevistoFmt,
            fimRealizadoFmt,
            formatoFim,
          ),
        );
      if (tiposStatus.fora && fimStatus === "fora")
        detalhesRenderizados.push(
          createDetalheCard(
            "fora",
            "FIM",
            fimPrevistoFmt,
            fimRealizadoFmt,
            formatoFim,
            "Furo de Horário",
          ),
        );
    }

    const eParcial =
      viagem.ParcialmenteCumprida > 0 &&
      (inicioStatus !== "normal" || fimStatus !== "normal" || !finalizada);
    const naoRealizada = viagem.NaoCumprida > 0 && (!iniciada || !finalizada);

    if (tiposStatus.parcial && eParcial) {
      const presentationPropsParcial = getStatusPresentation(
        "parcial",
        "VIAGEM",
      );
      const IconParcial = presentationPropsParcial.Icon;

      const cardParcial = (
        <Card
          key={`${keyBase}-parcial`}
          className="flex flex-col justify-between py-0 shadow-md transition-shadow hover:shadow-lg"
        >
          <CardHeader
            className={cn(
              "flex flex-row items-center justify-between p-2.5",
              presentationPropsParcial.headerClasses,
              presentationPropsParcial.textClasses,
            )}
          >
            <CardTitle
              className={cn(
                "text-xs font-semibold tracking-wider uppercase",
                presentationPropsParcial.textClasses,
              )}
            >
              Parcialmente Cumprida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-3 text-xs">
            <p className="text-foreground font-medium">
              Viagem {viagem.NumeroViagem || ""} na Linha{" "}
              {viagem.NomeLinha || "-"}
            </p>
            <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-muted-foreground font-medium">Início</p>
                <p>
                  Prev: {inicioPrevistoFmt} / Real:{" "}
                  <span className={cn(formatoInicio.classe)}>
                    {inicioRealizadoFmt}
                  </span>
                </p>
                <p className={cn(formatoInicio.classe)}>
                  Dif: {formatoInicio.sinal}
                  {formatoInicio.texto}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">Fim</p>
                <p>
                  Prev: {fimPrevistoFmt} / Real:{" "}
                  <span className={cn(formatoFim.classe)}>
                    {fimRealizadoFmt}
                  </span>
                </p>
                <p className={cn(formatoFim.classe)}>
                  Dif: {formatoFim.sinal}
                  {formatoFim.texto}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter
            className={cn(
              "flex items-center gap-1.5 border-t p-2.5 text-xs",
              IconParcial && getStatusColors("parcial", "bg"),
              getStatusColors("parcial", "text"),
            )}
          >
            {IconParcial && (
              <IconParcial
                className={cn(
                  "h-3.5 w-3.5",
                  getStatusColors("parcial", "text"),
                )}
              />
            )}
            <span className="text-[11px]">
              {presentationPropsParcial.footerMessage}
            </span>
          </CardFooter>
        </Card>
      );
      detalhesRenderizados.push(cardParcial);
    }

    if (tiposStatus.nao && naoRealizada) {
      detalhesRenderizados.push(
        createDetalheCard(
          "nao",
          "VIAGEM",
          inicioPrevistoFmt,
          iniciada ? inicioRealizadoFmt : "Não Realizado",
          formatoInicio,
          "Não Realizada",
        ),
      );
    }

    return detalhesRenderizados;
  };

  useEffect(() => {
    if (filtrosIniciaisDetalhados) {
      setFiltrosSelecionados((prev) => {
        if (
          JSON.stringify(prev) !== JSON.stringify(filtrosIniciaisDetalhados)
        ) {
          return filtrosIniciaisDetalhados;
        }
        return prev;
      });
    }
  }, [filtrosIniciaisDetalhados]);

  useEffect(() => {
    console.log(
      "🎯 BarChart - filtrosSelecionados atual:",
      filtrosSelecionados,
    );
    console.log("🎯 BarChart - Total de dados:", data.length);
  }, [filtrosSelecionados, data.length]);

  // === RENDERIZAÇÃO DO COMPONENTE ===
  return (
    <div className="space-y-6 p-1">
      {/* Container principal com espaçamento entre seções */}
      
      {/* Controles de visualização e filtros do gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ListFilter className="mr-2 h-5 w-5" /> Controles e Filtros do
            Gráfico
          </CardTitle>
          <CardDescription>
            Ajuste a visualização dos dados e aplique filtros específicos para
            motorista, linha, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChartFilters
            view={view}
            chartType={chartType}
            setView={setView}
            setChartType={setChartType}
            dados={dadosComSetor}
            filtrosSelecionados={filtrosSelecionados}
            setFiltrosSelecionados={setFiltrosSelecionados}
          />
        </CardContent>
      </Card>

      {/* Seção dos Gráficos */}
      {dadosFiltrados.length > 0 ? (
        <div className="space-y-6">
          {(view === "inicio" || view === "ambos") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-base">
                  Status de Início da Viagem
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
                {(chartType === "bar" || chartType === "both") && (
                  <div className="relative h-[350px] w-full md:h-[400px] xl:h-[450px]">
                    <ErrorBoundary>
                      <Bar
                        data={barChartDataInicio}
                        options={{
                          ...commonChartOptions,
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </ErrorBoundary>
                  </div>
                )}
                {(chartType === "pie" || chartType === "both") && (
                  <div className="relative mx-auto h-[300px] w-full max-w-md md:h-[400px] md:max-w-none xl:h-[450px]">
                    <ErrorBoundary>
                      <Pie
                        data={pieChartDataInicio}
                        options={{
                          ...commonChartOptions,
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </ErrorBoundary>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {(view === "fim" || view === "ambos") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-base">
                  Status de Fim da Viagem
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
                {(chartType === "bar" || chartType === "both") && (
                  <div className="relative h-[350px] w-full md:h-[400px] xl:h-[450px]">
                    <ErrorBoundary>
                      <Bar
                        data={barChartDataFim}
                        options={{
                          ...commonChartOptions,
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </ErrorBoundary>
                  </div>
                )}
                {(chartType === "pie" || chartType === "both") && (
                  <div className="relative mx-auto h-[300px] w-full max-w-md md:h-[400px] md:max-w-none xl:h-[450px]">
                    <ErrorBoundary>
                      <Pie
                        data={pieChartDataFim}
                        options={{
                          ...commonChartOptions,
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </ErrorBoundary>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <SearchX className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground">
              Nenhum dado encontrado para os filtros aplicados no gráfico.
            </p>
            <p className="text-muted-foreground text-sm">
              Tente ajustar os filtros principais ou os filtros do gráfico.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Seção de Detalhes das Viagens */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Detalhes das Viagens</CardTitle>
            <CardDescription>
              Analise viagens individuais com base nos status selecionados.
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="mostrar-detalhes"
              checked={mostrarDetalhes}
              onCheckedChange={toggleMostrarDetalhesHandler}
              disabled={isTogglingDetails}
            />
            <Label htmlFor="mostrar-detalhes" className="text-sm">
              Mostrar Detalhes
            </Label>
          </div>
        </CardHeader>
        
        {mostrarDetalhes && (
          <CardContent className="space-y-6 pt-4">
            <div className="bg-muted/40 space-y-4 rounded-lg border p-4">
              <h4 className="text-foreground mb-3 text-sm font-semibold">
                Filtrar Detalhes Por:
              </h4>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Filtro por Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Status da Viagem
                  </Label>
                  {(
                    Object.keys(tiposStatus) as Array<keyof typeof tiposStatus>
                  ).map((tipo) => (
                    <div key={tipo} className="flex items-center space-x-2">
                      <Checkbox
                        id={`detalhe-status-${tipo}`}
                        checked={tiposStatus[tipo]}
                        onCheckedChange={() => toggleTipoStatusHandler(tipo)}
                      />
                      <Label
                        htmlFor={`detalhe-status-${tipo}`}
                        className="cursor-pointer text-xs font-normal capitalize"
                      >
                        {tipo === "nao"
                          ? "Não Realizadas"
                          : tipo === "fora"
                            ? "Furos de Horário"
                            : tipo}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {/* Filtro por Período */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Período de Análise
                  </Label>
                  <RadioGroup
                    value={periodoDetalhes}
                    onValueChange={handlePeriodoDetalhesChangeHandler}
                    className="mt-1"
                  >
                    {["inicio", "fim", "ambos"].map((periodo) => (
                      <div
                        key={periodo}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={periodo}
                          id={`detalhe-periodo-${periodo}`}
                        />
                        <Label
                          htmlFor={`detalhe-periodo-${periodo}`}
                          className="cursor-pointer text-xs font-normal capitalize"
                        >
                          {periodo}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                {/* Limitar Registros */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Limite de Registros
                  </Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Checkbox
                      id="detalhe-limitar"
                      checked={limitarRegistros}
                      onCheckedChange={toggleLimitarRegistrosHandler}
                    />
                    <Label
                      htmlFor="detalhe-limitar"
                      className="cursor-pointer text-xs font-normal"
                    >
                      Limitar a
                    </Label>
                    <Input
                      type="number"
                      value={limiteRegistros}
                      onChange={(e) =>
                        handleLimiteRegistrosChangeHandler(e.target.value)
                      }
                      disabled={!limitarRegistros}
                      className="h-8 w-20 text-xs"
                      min="1"
                      max="200"
                    />
                    <Label
                      htmlFor="detalhe-limitar"
                      className="text-xs font-normal"
                    >
                      registros
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                  Resultados ({viagensDetalhadas.length}
                  {viagensDetalhadas.length === 1
                    ? " viagem encontrada"
                    : " viagens encontradas"}
                  )
                </h4>
                {limitarRegistros &&
                  viagensDetalhadas.length >= limiteRegistros && (
                    <p className="text-xs text-orange-600 italic dark:text-orange-400">
                      Mostrando os primeiros {limiteRegistros}. Desative o
                      limite para ver todos.
                    </p>
                  )}
              </div>
              
              {viagensDetalhadas.length > 0 ? (
                <div className="grid max-h-[600px] grid-cols-1 gap-4 overflow-y-auto p-1 md:grid-cols-2 xl:grid-cols-3">
                  {viagensDetalhadas.flatMap((viagem) =>
                    renderizarDetalheViagem(viagem),
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground bg-muted/20 rounded-md py-10 text-center">
                  <SearchX className="mx-auto mb-2 h-10 w-10" />
                  <p className="text-sm">
                    Nenhuma viagem encontrada com os filtros de detalhes
                    selecionados.
                  </p>
                  <p className="text-xs">Tente ajustar os filtros acima.</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Informações Adicionais e Exportação */}
      <Card className="mt-8 border-green-200 bg-green-50/70 shadow-md dark:border-green-700/20 dark:bg-green-900/10 print:hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-semibold text-green-800 dark:text-green-300">
            <Info className="mr-2.5 h-5 w-5" />
            Resumo da Consulta e Exportação
          </CardTitle>
          <CardDescription className="text-xs text-green-700/90 dark:text-green-400/80">
            Confira os filtros aplicados e exporte os dados consolidados.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-5 text-sm">
          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-green-700 dark:text-green-400">
              Filtros Principais Utilizados (Dashboard):
            </Label>
            <div className="flex flex-wrap gap-2">
              {renderFiltrosPrincipaisBadges()}
            </div>
          </div>

          <div className="my-3 border-t border-green-200/80 dark:border-green-700/30"></div>

          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-green-700 dark:text-green-400">
              Filtros Ativos no Gráfico Atual:
            </Label>
            <div className="flex flex-wrap gap-2">
              {renderFiltrosGraficoBadges()}
            </div>
          </div>

          <div className="my-3 border-t border-green-200/80 dark:border-green-700/30"></div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
            <div className="flex items-center text-green-700 dark:text-green-400/90">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5 opacity-80" />
              <span className="mr-1 font-medium">
                Data de referência dos dados:
              </span>
              <span className="font-semibold text-green-800 dark:text-green-300">
                {formattedDate}
              </span>
            </div>
            <div className="flex items-center text-green-700 dark:text-green-400/90">
              <History className="mr-1.5 h-3.5 w-3.5 opacity-80" />
              <span className="mr-1 font-medium">
                Última atualização da consulta:
              </span>
              <span className="font-semibold text-green-800 dark:text-green-300">
                {ultimaAtualizacao || "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="mt-4 flex flex-col items-center justify-end gap-3 border-t border-green-200/80 pt-5 sm:flex-row dark:border-green-700/30">
          <p className="mr-auto hidden text-xs text-green-700/80 sm:block dark:text-green-500/80">
            Gostaria de salvar estes dados?
          </p>
          
          {/* ✅ USAR AS FUNÇÕES DO useExportHook DIRETAMENTE */}
          <Button
            onClick={handleExportExcel}
            variant="default"
            size="sm"
            className="w-full bg-yellow-500 text-black hover:bg-yellow-600 sm:w-auto dark:bg-yellow-600 dark:text-yellow-50 dark:hover:bg-yellow-700"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar para Excel
          </Button>
          
          <Button
            onClick={handleExportPDF}
            variant="default"
            size="sm"
            className="w-full bg-yellow-500 text-black hover:bg-yellow-600 sm:w-auto dark:bg-yellow-600 dark:text-yellow-50 dark:hover:bg-yellow-700"
          >
            <FileText className="mr-2 h-4 w-4" /> Exportar para PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 