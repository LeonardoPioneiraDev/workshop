// src/utils/filtrosStorage.ts
export interface Filtros {
  dia?: string;
  dataInicio?: string;
  dataFim?: string;
  numerolinha?: string;
  prefixorealizado?: string;
  idservico?: string;
  statusini?: string;
  statusfim?: string;
  tipoVisualizacao?: string;
  [key: string]: string | undefined;
}

const FILTROS_KEY = 'dashboard_filtros_aplicados';

export const salvarFiltros = (filtros: Filtros): void => {
  localStorage.setItem(FILTROS_KEY, JSON.stringify(filtros));
};

export const obterFiltros = (): Filtros | null => {
  const filtrosString = localStorage.getItem(FILTROS_KEY);
  if (!filtrosString) return null;
  
  try {
    return JSON.parse(filtrosString) as Filtros;
  } catch (error) {
    console.error('Erro ao obter filtros do localStorage:', error);
    return null;
  }
};

export const limparFiltros = (): void => {
  localStorage.removeItem(FILTROS_KEY);
};

export const obterDescricaoFiltros = (): string => {
  const filtros = obterFiltros();
  if (!filtros) return "Nenhum filtro aplicado";
  
  const partes = [];
  if (filtros.dia) partes.push(`Data: ${filtros.dia}`);
  if (filtros.numerolinha) partes.push(`Linha: ${filtros.numerolinha}`);
  if (filtros.prefixorealizado) partes.push(`Prefixo: ${filtros.prefixorealizado}`);
  if (filtros.idservico) partes.push(`Serviço: ${filtros.idservico}`);
  
  return partes.join(" | ") || "Filtros padrão";
};

export const formatarFiltrosParaRelatorio = (): Record<string, string> => {
  const filtros = obterFiltros();
  if (!filtros) return { status: "Nenhum filtro aplicado" };
  
  return {
    data: filtros.dia || filtros.dataInicio || "Não especificada",
    linha: filtros.numerolinha || "Todas",
    prefixo: filtros.prefixorealizado || "Todos",
    servico: filtros.idservico || "Todos",
    statusInicial: filtros.statusini || "Todos",
    statusFinal: filtros.statusfim || "Todos",
    dataAplicacao: new Date().toLocaleString('pt-BR')
  };
};