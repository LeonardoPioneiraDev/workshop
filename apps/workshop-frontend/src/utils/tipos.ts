// src/utils/tipos.ts

export type ViagemData = {
  AdiantadoInicio: number;
  AtrasadoInicio: number;
  ForadoHorarioInicio: number;
  AdiantadoFim: number;
  AtrasadoFim: number;
  ForadoHorarioFim: number;
  ParcialmenteCumprida: number;
  NaoCumprida: number;
  // Acrescente mais campos caso use
};

// Ajuste os campos conforme realmente usa!
export type Filtros = {
  dataInicio?: string;
  dataFim?: string;
  dia?: string;
  numerolinha?: string;
  linha?: string;
  idservico?: string;
  prefixorealizado?: string;
  statusini?: string;
  statusfim?: string;
  tipoVisualizacao?: string;
  motorista?: string;
  sentido?: string;
  setor?: string;
  // Outros campos do filtro que você usa
};