// Legal department types and constants

// Interfaces básicas
export interface LegalData {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
}

export interface LegalFilters {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  department?: string;
}

export interface MultaData {
  id: string;
  numero: string;
  valor: number;
  status: string;
  dataVencimento: Date;
  setor: string;
  gravidade?: string;
  tipo?: string;
  orgao?: string;
}

// Constantes de cores
export const CORES_GRAVIDADE = {
  LEVE: "#10B981",      // Verde
  MEDIA: "#F59E0B",     // Amarelo
  GRAVE: "#EF4444",     // Vermelho
  GRAVISSIMA: "#7C2D12" // Vermelho escuro
} as const;

export const CORES_STATUS = {
  PENDENTE: "#F59E0B",   // Amarelo
  PAGO: "#10B981",       // Verde
  VENCIDO: "#EF4444",    // Vermelho
  CANCELADO: "#6B7280",  // Cinza
  EM_ANALISE: "#3B82F6", // Azul
  PROTESTADO: "#7C2D12"  // Vermelho escuro
} as const;

export const CORES_SETOR = {
  TRANSITO: "#3B82F6",     // Azul
  SEMOB: "#8B5CF6",        // Roxo
  AMBIENTAL: "#10B981",    // Verde
  FISCAL: "#F59E0B",       // Amarelo
  TRABALHISTA: "#EF4444",  // Vermelho
  OUTROS: "#6B7280"        // Cinza
} as const;

export const CORES_TIPO = {
  MULTA_TRANSITO: "#3B82F6",
  MULTA_AMBIENTAL: "#10B981",
  MULTA_FISCAL: "#F59E0B",
  MULTA_TRABALHISTA: "#EF4444",
  MULTA_SANITARIA: "#8B5CF6",
  OUTRAS: "#6B7280"
} as const;

// Constantes de ícones
export const ICONES_STATUS = {
  PENDENTE: "⏳",
  PAGO: "✅",
  VENCIDO: "❌",
  CANCELADO: "🚫",
  EM_ANALISE: "🔍",
  PROTESTADO: "⚠️"
} as const;

export const ICONES_GRAVIDADE = {
  LEVE: "🟢",
  MEDIA: "🟡",
  GRAVE: "🟠",
  GRAVISSIMA: "🔴"
} as const;

export const ICONES_SETOR = {
  TRANSITO: "🚗",
  SEMOB: "��",
  AMBIENTAL: "🌱",
  FISCAL: "💰",
  TRABALHISTA: "��",
  OUTROS: "📋"
} as const;

export const ICONES_TIPO = {
  MULTA_TRANSITO: "🚗",
  MULTA_AMBIENTAL: "🌱",
  MULTA_FISCAL: "💰",
  MULTA_TRABALHISTA: "��",
  MULTA_SANITARIA: "🏥",
  OUTRAS: "📋"
} as const;

export const ICONES_PRIORIDADE = {
  ALTA: "🔴",
  MEDIA: "��",
  BAIXA: "🟢"
} as const;

export const ICONES_DEPARTAMENTO = {
  JURIDICO: "⚖️",
  FINANCEIRO: "💰",
  OPERACIONAL: "⚙️",
  ADMINISTRATIVO: "📊"
} as const;

// Enums
export enum StatusMulta {
  PENDENTE = "PENDENTE",
  PAGO = "PAGO",
  VENCIDO = "VENCIDO",
  CANCELADO = "CANCELADO",
  EM_ANALISE = "EM_ANALISE",
  PROTESTADO = "PROTESTADO"
}

export enum GravidadeMulta {
  LEVE = "LEVE",
  MEDIA = "MEDIA",
  GRAVE = "GRAVE",
  GRAVISSIMA = "GRAVISSIMA"
}

// Constantes de labels/textos
export const LABELS_STATUS = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  VENCIDO: 'Vencido',
  CANCELADO: 'Cancelado',
  EM_ANALISE: 'Em Análise',
  PROTESTADO: 'Protestado'
} as const;

export const LABELS_GRAVIDADE = {
  LEVE: 'Leve',
  MEDIA: 'Média',
  GRAVE: 'Grave',
  GRAVISSIMA: 'Gravíssima'
} as const;

export const LABELS_SETOR = {
  TRANSITO: 'Trânsito',
  SEMOB: 'SEMOB',
  AMBIENTAL: 'Ambiental',
  FISCAL: 'Fiscal',
  TRABALHISTA: 'Trabalhista',
  OUTROS: 'Outros'
} as const;

export const LABELS_TIPO = {
  MULTA_TRANSITO: 'Multa de Trânsito',
  MULTA_AMBIENTAL: 'Multa Ambiental',
  MULTA_FISCAL: 'Multa Fiscal',
  MULTA_TRABALHISTA: 'Multa Trabalhista',
  MULTA_SANITARIA: 'Multa Sanitária',
  OUTRAS: 'Outras'
} as const;

export const LABELS_PRIORIDADE = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa'
} as const;

export const TOOLTIPS_STATUS = {
  PENDENTE: 'Multa aguardando pagamento',
  PAGO: 'Multa quitada',
  VENCIDO: 'Multa com prazo vencido',
  CANCELADO: 'Multa cancelada',
  EM_ANALISE: 'Multa em processo de análise',
  PROTESTADO: 'Multa protestada'
} as const;

// Tipos auxiliares
export type CoreGravidade = keyof typeof CORES_GRAVIDADE;
export type CoreStatus = keyof typeof CORES_STATUS;
export type CoreSetor = keyof typeof CORES_SETOR;
export type IconeStatus = keyof typeof ICONES_STATUS;
export type IconeGravidade = keyof typeof ICONES_GRAVIDADE;
export type IconeSetor = keyof typeof ICONES_SETOR;