import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  type VirtualizedSelectOption,
  VirtualizedSelect,
} from "@/components/ui/VirtualizedSelect";
import { cn } from "@/lib/utils";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartJsTooltip,
  Legend,
  LinearScale,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  CheckCircle,
  Save,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { toast } from "sonner";
import { useFiltros } from "../../contexts/FiltrosContext.js";
import { ErrorBoundary } from "../../ErrorBoundary/ErrorBoundary.js";
import { commonChartOptions } from "../../utils/chartOptions.js";
import { buildChartData } from "../../utils/chartUtils.js";
import { getCssVariableValue } from "../../utils/styleUtils.js";
import { CardHeader, CardTitle } from "../ui/card.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartJsTooltip,
  Legend,
  ArcElement,
  ChartDataLabels,
);

interface ViagemData {
  NomeMotorista?: string;
  NomeLinha?: string;
  SentidoText?: string;
  AdiantadoInicio?: number;
  AtrasadoInicio?: number;
  ForadoHorarioInicio?: number;
  AdiantadoFim?: number;
  AtrasadoFim?: number;
  ForadoHorarioFim?: number;
  PrefixoRealizado?: string;
  SetorText?: string;
  ParcialmenteCumprida?: number;
  NaoCumprida?: number;
  [key: string]: string | number | undefined;
}

interface ChartFiltersProps {
  view: "inicio" | "fim" | "ambos" | "setor";
  chartType: "bar" | "pie" | "both";
  setView: (value: "inicio" | "fim" | "ambos" | "setor") => void;
  setChartType: (value: "bar" | "pie" | "both") => void;
  dados: ViagemData[];
  filtrosSelecionados: { [key: string]: string };
  setFiltrosSelecionados: (value: { [key: string]: string }) => void;
}

// Mapeamento das chaves de filtrosSelecionados para as chaves de ViagemData
const filterKeyToDataKeyMap: Record<string, keyof ViagemData> = {
  motorista: "NomeMotorista",
  linha: "NomeLinha",
  sentido: "SentidoText",
  setor: "SetorText",
  prefixoRealizado: "PrefixoRealizado",
};

export function ChartFilters({
  view,
  chartType,
  setView,
  setChartType,
  dados,
  filtrosSelecionados = {},
  setFiltrosSelecionados,
}: ChartFiltersProps) {
  const [mostrarDetalhados, setMostrarDetalhados] = useState(false);
  const [saveButtonState, setSaveButtonState] = useState<"idle" | "saved">(
    "idle",
  );

  const createOptionsArray = useCallback(
    (stringSet: Set<string>): VirtualizedSelectOption[] =>
      Array.from(stringSet)
        .sort((a, b) => a.localeCompare(b))
        .map((item) => ({ value: item, label: item })),
    [],
  );

  const createSetorOptionsArray = useCallback(
    (stringSet: Set<string>): VirtualizedSelectOption[] =>
      Array.from(stringSet)
        .sort((a, b) => {
          if (a === "Outro") return 1;
          if (b === "Outro") return -1;
          return a.localeCompare(b);
        })
        .map((item) => ({ value: item, label: item })),
    [],
  );

  // MUDANÇA PRINCIPAL: Usando useMemo ao invés de useState + useEffect
  const selectOptions = useMemo(() => {
    if (!dados || dados.length === 0) {
      return {
        motoristas: [],
        linhas: [],
        sentidos: [],
        setores: [],
        prefixos: [],
      };
    }

    //console.time("recalcularSelectOptionsDependentes");

    const getRelevantOptions = (
      dataToFilter: ViagemData[],
      targetDataKey: keyof ViagemData,
      currentSelectedFilters: typeof filtrosSelecionados,
      currentGeneratingFilterKey: keyof typeof filtrosSelecionados,
    ): VirtualizedSelectOption[] => {
      let relevantData = [...dataToFilter];

      //console.log(
      //  `[getRelevantOptions] Para ${String(currentGeneratingFilterKey)} (alvo: ${String(targetDataKey)}), filtros aplicados:`,
      //    JSON.stringify(currentSelectedFilters),
      //  );

      (
        Object.keys(currentSelectedFilters) as Array<
          keyof typeof currentSelectedFilters
        >
      ).forEach((filterKeyBeingApplied) => {
        if (
          filterKeyBeingApplied !== currentGeneratingFilterKey &&
          currentSelectedFilters[filterKeyBeingApplied]
        ) {
          const dataKeyForFiltering =
            filterKeyToDataKeyMap[filterKeyBeingApplied];

          if (dataKeyForFiltering) {
            const filterValue = currentSelectedFilters[filterKeyBeingApplied];
            // console.log(
            //     `  -> Filtrando por ${String(dataKeyForFiltering)} = "${filterValue}"`,
            //    );
            relevantData = relevantData.filter((item) => {
              const itemValue = item[dataKeyForFiltering];
              // Removido console.log individual para evitar logs excessivos
              return itemValue === filterValue;
            });
            //  console.log(
            //     `     Dados restantes após filtro ${String(dataKeyForFiltering)}: ${relevantData.length}`,
            //    );
          }
        }
      });

      const uniqueValues = new Set<string>();
      for (const item of relevantData) {
        const val = item[targetDataKey] as string | undefined;
        if (val && val !== "--" && String(val).trim() !== "") {
          uniqueValues.add(String(val).trim());
        }
      }

      //  console.log(
      //      `  -> Valores únicos para ${String(targetDataKey)} (antes de formatar):`,
      //     Array.from(uniqueValues),
      //     );

      if (targetDataKey === "SetorText") {
        return createSetorOptionsArray(uniqueValues);
      }
      return createOptionsArray(uniqueValues);
    };

    const newMotoristaOptions = getRelevantOptions(
      dados,
      "NomeMotorista",
      filtrosSelecionados,
      "motorista",
    );
    const newLinhaOptions = getRelevantOptions(
      dados,
      "NomeLinha",
      filtrosSelecionados,
      "linha",
    );
    const newSentidoOptions = getRelevantOptions(
      dados,
      "SentidoText",
      filtrosSelecionados,
      "sentido",
    );
    const newSetorOptions = getRelevantOptions(
      dados,
      "SetorText",
      filtrosSelecionados,
      "setor",
    );
    const newPrefixoOptions = getRelevantOptions(
      dados,
      "PrefixoRealizado",
      filtrosSelecionados,
      "prefixoRealizado",
    );

    // console.log("Novas opções para Motoristas:", newMotoristaOptions.length);
    // console.log("Novas opções para Linhas:", newLinhaOptions.length);
    // console.log("Novas opções para Sentidos:", newSentidoOptions.length);
    // console.log(
    // "Novas opções para Setores:",
    //  newSetorOptions.map((s) => s.value),
    //  );
    //console.log("Novas opções para Prefixos:", newPrefixoOptions.length);

    //  console.timeEnd("recalcularSelectOptionsDependentes");

    return {
      motoristas: newMotoristaOptions,
      linhas: newLinhaOptions,
      sentidos: newSentidoOptions,
      setores: newSetorOptions,
      prefixos: newPrefixoOptions,
    };
  }, [dados, filtrosSelecionados, createOptionsArray, createSetorOptionsArray]);

  const themedColors1 = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
  const statusKeys: (keyof ViagemData)[] = [
    "AdiantadoInicio",
    "AtrasadoInicio",
    "ForadoHorarioInicio",
    "ParcialmenteCumprida",
    "NaoCumprida",
  ];
  const labels = [
    "Adiantado",
    "Atrasado",
    "Fora do Horário",
    "Parcialmente",
    "Não Realizada",
  ];

  const dadosFiltrados = useMemo(() => {
    return dados.filter(
      (item) =>
        (!filtrosSelecionados.motorista ||
          item.NomeMotorista === filtrosSelecionados.motorista) &&
        (!filtrosSelecionados.linha ||
          item.NomeLinha === filtrosSelecionados.linha) &&
        (!filtrosSelecionados.sentido ||
          item.SentidoText === filtrosSelecionados.sentido) &&
        (!filtrosSelecionados.setor ||
          item.SetorText === filtrosSelecionados.setor) &&
        (!filtrosSelecionados.prefixoRealizado ||
          item.PrefixoRealizado === filtrosSelecionados.prefixoRealizado),
    );
  }, [dados, filtrosSelecionados]);

  const { setFiltrosDetalhados: setFiltrosContext, salvarFiltrosAtuais } =
    useFiltros();

  const handleFiltroChange = useCallback(
    (campo: keyof typeof filtrosSelecionados, valor: string | undefined) => {
      const valorReal = valor || "";
      //  console.log(
      //     `🔧 [ChartFilters] handleFiltroChange - Campo: ${campo}, Valor: "${valorReal}"`,
      //   );

      const novosFiltros = {
        ...filtrosSelecionados,
        [campo]: valorReal,
      };
      //    console.log(`🔧 [ChartFilters] Atualizando filtros:`, novosFiltros);

      setFiltrosSelecionados(novosFiltros);
      setFiltrosContext(novosFiltros);
      setTimeout(() => {
        //  console.log("🔧 [ChartFilters] Forçando atualização do contexto");
        setFiltrosContext({ ...novosFiltros });
      }, 0);
    },
    [filtrosSelecionados, setFiltrosSelecionados, setFiltrosContext],
  );

  const limparFiltrosHandler = () => {
    setFiltrosSelecionados({});
    setFiltrosContext({});
    toast.info("Filtros Detalhados Limpos", {
      description: "Todos os filtros detalhados foram removidos.",
    });
  };

  const handleSalvarFiltros = () => {
    salvarFiltrosAtuais(
      `Filtros detalhados (Gráfico) - ${new Date().toLocaleDateString("pt-BR")}`,
    );
    setSaveButtonState("saved");
    toast.success("Filtros Salvos!", {
      description: "Os filtros detalhados atuais foram salvos no histórico.",
    });
    setTimeout(() => setSaveButtonState("idle"), 2000);
  };

  const chartLabels = useMemo(
    () => [
      "Adiantado",
      "Atrasado",
      "Fora do Horário",
      "Parcialmente",
      "Não Realizada",
    ],
    [],
  );

  // Estas são as chaves correspondentes em ViagemData para cada label acima
  const statusInicioKeys: (keyof ViagemData)[] = useMemo(
    () => [
      "AdiantadoInicio",
      "AtrasadoInicio",
      "ForadoHorarioInicio",
      "ParcialmenteCumprida",
      "NaoCumprida",
    ],
    [],
  );
  const statusFimKeys: (keyof ViagemData)[] = useMemo(
    () => [
      // Adicione se for renderizar FIM por setor
      "AdiantadoFim",
      "AtrasadoFim",
      "ForadoHorarioFim",
      "ParcialmenteCumprida",
      "NaoCumprida",
    ],
    [],
  );
  // NOMES DAS VARIÁVEIS CSS PARA AS CORES (mesma paleta dos gráficos principais)
  const barAndPieColorVarNames = useMemo(
    () => [
      "--chart-2", // Cor para 'Adiantado' (ex: Azul)
      "--chart-4", // Cor para 'Atrasado' (ex: Laranja)
      "--chart-1", // Cor para 'Fora do Horário' (ex: Amarelo)
      "--chart-5", // Cor para 'Parcial' (ex: Verde)
      "--chart-3", // Cor para 'Não Realizada' (ex: Vermelho)
    ],
    [],
  );

  // ESTADOS PARA AS CORES RESOLVIDAS
  const [resolvedSectorChartColors, setResolvedSectorChartColors] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const resolvedColors = barAndPieColorVarNames.map((varName) =>
        getCssVariableValue(varName),
      );
      setResolvedSectorChartColors(resolvedColors);
      // console.log("[ChartFilters] Cores resolvidas para gráficos de setor:", resolvedColors);
    }
    // Adicione 'theme' do seu theme context se as cores CSS mudarem com o tema
  }, [barAndPieColorVarNames]); // Recalcula se os nomes das vars mudarem (improvável)

  const renderizarGraficosPorSetor = (setor: string) => {
    // dadosFiltrados já considera os filtros de Motorista, Linha, etc.
    // Aqui filtramos especificamente para o setor da iteração atual.
    const dadosDoSetorEspecifico = dadosFiltrados.filter(
      (item) => item.SetorText === setor,
    );

    // Condição para não renderizar se não houver dados OU se as cores ainda não foram resolvidas
    if (
      dadosDoSetorEspecifico.length === 0 ||
      resolvedSectorChartColors.length === 0
    ) {
      return (
        <Card
          key={setor} // Adicionar key aqui para quando mapeado
          className="flex h-[200px] w-full items-center justify-center shadow-md md:h-[250px]"
        >
          <CardContent className="text-muted-foreground p-2 text-center text-xs">
            {resolvedSectorChartColors.length === 0
              ? "Carregando cores..."
              : `Nenhum dado para o setor "${setor}" com os filtros aplicados.`}
          </CardContent>
        </Card>
      );
    }

    // Usar as cores resolvidas para AMBOS os tipos de gráfico
    const barDataInicioSetor = buildChartData(
      dadosDoSetorEspecifico,
      statusInicioKeys, // Usar as chaves corretas para os dados de status de início
      chartLabels, // Usar os labels corretos
      resolvedSectorChartColors, // Passa o array de cores para cada barra
      `Status Início - ${setor}`, // Label do dataset
    );
    const pieDataInicioSetor = buildChartData(
      dadosDoSetorEspecifico,
      statusInicioKeys, // Usar as chaves corretas
      chartLabels, // Usar os labels corretos
      resolvedSectorChartColors, // Passa o array de cores para cada fatia
      `Status Início - ${setor}`, // Label do dataset
    );

    // Se você quiser exibir gráficos de "Status Fim" por setor também:
    // const barDataFimSetor = buildChartData(dadosDoSetorEspecifico, statusFimKeys, chartLabels, resolvedSectorChartColors, `Status Fim - ${setor}`);
    // const pieDataFimSetor = buildChartData(dadosDoSetorEspecifico, statusFimKeys, chartLabels, resolvedSectorChartColors, `Status Fim - ${setor}`);

    // Opções de gráfico para consistência visual e clareza
    const chartDisplayOptions = {
      ...commonChartOptions, // Suas opções comuns
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...commonChartOptions.plugins, // Preserva outros plugins comuns
        legend: {
          display: true, // Mostrar legenda para pizza
          position: "bottom" as const,
          labels: { boxWidth: 10, padding: 8, font: { size: 14 } },
        },
        title: { display: false }, // Título do card do setor já informa o setor
        datalabels: {
          // Configuração de datalabels (se chartjs-plugin-datalabels estiver registrado)
          color: (context: any) => {
            // Cor dinâmica para melhor contraste
            const bgColor = context.dataset.backgroundColor[context.dataIndex];
            // Heurística simples para cor do texto (preto ou branco)
            // Você pode usar uma biblioteca para calcular contraste se precisar de mais precisão
            if (bgColor && typeof bgColor === "string") {
              const r = parseInt(bgColor.slice(1, 3), 16);
              const g = parseInt(bgColor.slice(3, 5), 16);
              const b = parseInt(bgColor.slice(5, 7), 16);
              return r * 0.299 + g * 0.587 + b * 0.114 > 160 ? "#000" : "#fff";
            }
            return "#fff";
          },
          anchor: "end" as const,
          align: "start" as const,
          offset: -2,
          font: { size: 9, weight: "bold" as const },
          formatter: (value: number) => (value > 0 ? value : ""), // Não mostra 0
        },
      },
    };

    // Opções específicas para o gráfico de barras (ex: sem legenda se as cores das barras são autoexplicativas com os eixos)
    const barChartDisplayOptions = {
      ...chartDisplayOptions,
      plugins: {
        ...chartDisplayOptions.plugins,
        legend: { display: false }, // Barras geralmente não precisam de legenda se o eixo X já tem os labels
      },
    };

    return (
      <Card
        key={setor}
        className="w-full shadow-md transition-shadow hover:shadow-lg"
      >
        <CardHeader className="bg-muted/20 dark:bg-muted/30 border-b p-3">
          {/* Fundo suave para o header */}
          <CardTitle className="text-foreground text-center text-2xl font-semibold">
            {setor}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 items-center gap-3 p-3 sm:grid-cols-2 md:p-4">
          {/* Ajustado gap e padding */}
          {/* Gráfico de Barras de Início por Setor */}
          {(chartType === "bar" || chartType === "both") && (
            <div className="relative h-[350px] w-full md:h-[400px] xl:h-[450px]">
              <ErrorBoundary>
                <Bar
                  data={barDataInicioSetor}
                  options={barChartDisplayOptions}
                />
              </ErrorBoundary>
            </div>
          )}
          {/* Gráfico de Pizza de Início por Setor */}
          {(chartType === "pie" || chartType === "both") && (
            <div className="relative mx-auto h-[300px] w-full max-w-md md:h-[400px] md:max-w-none xl:h-[450px]">
              {/* Altura e max-w ajustados */}
              <ErrorBoundary>
                <Pie data={pieDataInicioSetor} options={chartDisplayOptions} />
              </ErrorBoundary>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  const renderResumoFiltros = () => {
    const filtrosAtivosArray = (
      Object.keys(filtrosSelecionados) as Array<
        keyof typeof filtrosSelecionados
      >
    )
      .filter(
        (key) =>
          filterKeyToDataKeyMap[key] &&
          filtrosSelecionados[key] &&
          String(filtrosSelecionados[key]).trim() !== "",
      )
      .map((key) => {
        const nomeChaveDisplay =
          {
            motorista: "Motorista",
            linha: "Linha",
            sentido: "Sentido",
            setor: "Setor (Gráfico)",
            prefixoRealizado: "Prefixo Veículo",
          }[key] || key.charAt(0).toUpperCase() + key.slice(1);
        const filterContent = `${nomeChaveDisplay}: ${String(filtrosSelecionados[key])}`;
        return (
          <span
            key={key}
            className={cn(
              "inline-block rounded-full border px-2.5 py-1 text-xs font-medium",
              "bg-secondary/80 text-secondary-foreground",
              "hover:bg-secondary",
            )}
          >
            {filterContent}
          </span>
        );
      });
    if (filtrosAtivosArray.length === 0) return null;
    return (
      <div className="bg-muted/10 dark:bg-muted/30 mt-4 rounded-lg border p-3">
        <Label className="text-foreground mb-2 block text-sm font-semibold">
          Filtros detalhados aplicados:
        </Label>
        <div className="flex flex-wrap gap-2">{filtrosAtivosArray}</div>
      </div>
    );
  };

  const hasActiveDetailedFilters = Object.values(filtrosSelecionados).some(
    (val) => val && val !== "",
  );

  const filterConfig: Array<{
    id: keyof typeof filtrosSelecionados;
    label: string;
    options: VirtualizedSelectOption[];
    placeholder: string;
    useVirtualized: boolean;
    dataKey: keyof ViagemData;
  }> = [
      {
        id: "motorista",
        label: "Motorista",
        options: selectOptions.motoristas,
        placeholder: "Todos os motoristas",
        useVirtualized: true,
        dataKey: "NomeMotorista",
      },
      {
        id: "linha",
        label: "Linha",
        options: selectOptions.linhas,
        placeholder: "Todas as linhas",
        useVirtualized: selectOptions.linhas.length > 50,
        dataKey: "NomeLinha",
      },
      {
        id: "sentido",
        label: "Sentido",
        options: selectOptions.sentidos,
        placeholder: "Todos os sentidos",
        useVirtualized: false,
        dataKey: "SentidoText",
      },
      {
        id: "setor",
        label: "Setor (do Gráfico)",
        options: selectOptions.setores,
        placeholder: "Todos os setores",
        useVirtualized: selectOptions.setores.length > 50,
        dataKey: "SetorText",
      },
      {
        id: "prefixoRealizado",
        label: "Prefixo Veículo",
        options: selectOptions.prefixos,
        placeholder: "Todos os prefixos",
        useVirtualized: true,
        dataKey: "PrefixoRealizado",
      },
    ];

  return (
    <div className="space-y-6">
      {/* Controles de Visualização e Tipo de Gráfico */}
      <div className="flex flex-col flex-wrap items-start gap-4 sm:flex-row sm:gap-6">
        <div>
          <Label className="text-muted-foreground mb-1.5 block text-xs font-medium">
            Visualizar Gráficos
          </Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "inicio", label: "Status Início" },
                { value: "fim", label: "Status Fim" },
                { value: "ambos", label: "Ambos" },
                { value: "setor", label: "Por Setor" },
              ] as { value: ChartFiltersProps["view"]; label: string }[]
            ).map(({ value: v, label }) => (
              <Button
                key={v}
                onClick={() => setView(v)}
                variant={view === v ? "default" : "outline"}
                size="sm"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-muted-foreground mb-1.5 block text-xs font-medium">
            Tipo de Gráfico
          </Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "bar", label: "Barras" },
                { value: "pie", label: "Pizza" },
                { value: "both", label: "Ambos" },
              ] as { value: ChartFiltersProps["chartType"]; label: string }[]
            ).map(({ value: ct, label }) => (
              <Button
                key={ct}
                onClick={() => setChartType(ct)}
                variant={chartType === ct ? "default" : "outline"}
                size="sm"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id="mostrar-detalhados"
          checked={mostrarDetalhados}
          onCheckedChange={setMostrarDetalhados}
        />
        <Label
          htmlFor="mostrar-detalhados"
          className="flex cursor-pointer items-center gap-1 text-sm"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros Detalhados
          Adicionais
        </Label>
      </div>

      {mostrarDetalhados && (
        <Card className="bg-muted/10 dark:bg-muted/20 border shadow-sm">
          <CardContent className="space-y-5 pt-6">
            <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
              {filterConfig.map((filter) => (
                <div key={filter.id} className="flex flex-col space-y-1.5">
                  {filter.useVirtualized ? (
                    <VirtualizedSelect
                      label={filter.label}
                      options={filter.options}
                      value={filtrosSelecionados[filter.id] || ""}
                      onChange={(value) => handleFiltroChange(filter.id, value)}
                      placeholder={filter.placeholder}
                    />
                  ) : (
                    <>
                      <Label
                        htmlFor={filter.id}
                        className="text-xs font-medium"
                      >
                        {filter.label}
                      </Label>
                      <Select
                        value={filtrosSelecionados[filter.id] || ""}
                        onValueChange={(value) =>
                          handleFiltroChange(
                            filter.id,
                            value === "todos" ? "" : value,
                          )
                        }
                      >
                        <SelectTrigger
                          id={filter.id}
                          className="focus:ring-primary h-9 w-full truncate text-xs focus:ring-1 focus:ring-offset-0"
                        >
                          <SelectValue placeholder={filter.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos" className="text-xs">
                            Todos
                          </SelectItem>
                          {filter.options.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="truncate text-xs"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-4">
              <Button
                onClick={limparFiltrosHandler}
                variant="ghost"
                size="sm"
                disabled={!hasActiveDetailedFilters}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Limpar Detalhados
              </Button>
              <Button
                id="btnSalvarFiltros"
                onClick={handleSalvarFiltros}
                variant="outline"
                size="sm"
                disabled={
                  !hasActiveDetailedFilters || saveButtonState === "saved"
                }
              >
                {saveButtonState === "saved" ? (
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                {saveButtonState === "saved" ? "Salvo!" : "Salvar Filtros"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mostrarDetalhados && renderResumoFiltros()}

      {mostrarDetalhados && hasActiveDetailedFilters && view !== "setor" && (
        <div className="text-muted-foreground pt-1 text-right text-xs">
          Registros aplicáveis aos filtros detalhados:
          <strong>{dadosFiltrados.length}</strong>
        </div>
      )}

      {view === "setor" && (
        <div className="mt-6 space-y-6">
          <div className="mb-2 p-0">
            <h3 className="text-lg font-semibold">Dados por Setor</h3>
            <p className="text-muted-foreground text-sm">
              Visualização dos status de viagem agrupados por setor.
            </p>
          </div>
          {selectOptions.setores.length > 0 ? (
            <div className="space-y-6">
              {selectOptions.setores.map((setorOpt) =>
                renderizarGraficosPorSetor(setorOpt.value),
              )}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <XCircle className="text-muted-foreground mx-auto mb-2 h-10 w-10" />
              Nenhum setor disponível com os dados e filtros atuais.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
