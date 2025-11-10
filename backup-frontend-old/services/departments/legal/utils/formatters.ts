// apps/frontend/src/services/departments/legal/utils/formatters.ts

import { 
  StatusMulta, 
  GravidadeInfracao, 
  TipoMulta,
  CORES_STATUS,
  CORES_GRAVIDADE,
  CORES_TIPO,
  ICONES_STATUS
} from '../types';

// =========================================================================
// FORMATADORES DE VALOR
// =========================================================================

/**
 * Formata valor monetário para Real brasileiro
 */
export const formatCurrency = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return 'R$ 0,00';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

/**
 * Formata número com separadores de milhares
 */
export const formatNumber = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('pt-BR').format(numValue);
};

/**
 * Formata percentual
 */
export const formatPercentage = (value: number | undefined | null, decimals: number = 1): string => {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

// =========================================================================
// FORMATADORES DE DATA
// =========================================================================

/**
 * Formata data para formato brasileiro
 */
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Data Inválida';
    
    return dateObj.toLocaleDateString('pt-BR');
  } catch {
    return 'Data Inválida';
  }
};

/**
 * Formata data e hora para formato brasileiro
 */
export const formatDateTime = (date: string | Date | undefined | null): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Data Inválida';
    
    return dateObj.toLocaleString('pt-BR');
  } catch {
    return 'Data Inválida';
  }
};

/**
 * Formata data para formato ISO (YYYY-MM-DD)
 */
export const formatDateISO = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Calcula dias entre duas datas
 */
export const calculateDaysBetween = (startDate: string | Date, endDate: string | Date): number => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

/**
 * Calcula dias para vencimento
 */
export const calculateDaysToExpiry = (expiryDate: string | Date | undefined | null): number => {
  if (!expiryDate) return 0;
  
  try {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const today = new Date();
    
    if (isNaN(expiry.getTime())) return 0;
    
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

/**
 * Formata tempo relativo (ex: "há 2 dias", "em 5 dias")
 */
export const formatRelativeTime = (date: string | Date | undefined | null): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Data Inválida';
    
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays > 0) return `Em ${diffDays} dias`;
    return `Há ${Math.abs(diffDays)} dias`;
  } catch {
    return 'Data Inválida';
  }
};

// =========================================================================
// FORMATADORES DE STATUS E CATEGORIAS
// =========================================================================

/**
 * Obtém cor por status da multa
 */
export const getStatusColor = (status: StatusMulta | string | undefined): string => {
  if (!status) return CORES_STATUS.PENDENTE;
  return CORES_STATUS[status as StatusMulta] || CORES_STATUS.PENDENTE;
};

/**
 * Obtém ícone por status da multa
 */
export const getStatusIcon = (status: StatusMulta | string | undefined): string => {
  if (!status) return ICONES_STATUS.PENDENTE;
  return ICONES_STATUS[status as StatusMulta] || ICONES_STATUS.PENDENTE;
};

/**
 * Obtém cor por gravidade da infração
 */
export const getGravityColor = (gravity: GravidadeInfracao | string | undefined): string => {
  if (!gravity) return CORES_GRAVIDADE.LEVE;
  
  // Normalizar variações de nomenclatura
  const normalizedGravity = gravity.toUpperCase().replace(/[^A-Z]/g, '') as GravidadeInfracao;
  return CORES_GRAVIDADE[normalizedGravity] || CORES_GRAVIDADE.LEVE;
};

/**
 * Obtém cor por tipo de multa
 */
export const getTypeColor = (type: TipoMulta | string | undefined): string => {
  if (!type) return CORES_TIPO.TRANSITO;
  return CORES_TIPO[type as TipoMulta] || CORES_TIPO.TRANSITO;
};

/**
 * Formata status para exibição amigável
 */
export const formatStatus = (status: StatusMulta | string | undefined): string => {
  const statusMap: Record<string, string> = {
    'PAGA': 'Paga',
    'VENCIDA': 'Vencida',
    'PENDENTE': 'Pendente',
    'RECURSO': 'Em Recurso',
    'CANCELADA': 'Cancelada'
  };
  
  return statusMap[status || 'PENDENTE'] || 'Não Informado';
};

/**
 * Formata gravidade para exibição amigável
 */
export const formatGravity = (gravity: GravidadeInfracao | string | undefined): string => {
  const gravityMap: Record<string, string> = {
    'LEVE': 'Leve',
    'MÉDIA': 'Média',
    'MEDIA': 'Média',
    'GRAVE': 'Grave',
    'GRAVÍSSIMA': 'Gravíssima',
    'GRAVISSIMA': 'Gravíssima'
  };
  
  return gravityMap[gravity?.toUpperCase() || 'LEVE'] || 'Não Informado';
};

/**
 * Formata tipo de multa para exibição amigável
 */
export const formatType = (type: TipoMulta | string | undefined): string => {
  const typeMap: Record<string, string> = {
    'TRANSITO': 'Trânsito',
    'SEMOB': 'SEMOB'
  };
  
  return typeMap[type || 'TRANSITO'] || 'Não Informado';
};

// =========================================================================
// FORMATADORES DE SETOR
// =========================================================================

/**
 * Obtém cor por código de setor
 */
export const getSectorColor = (sectorCode: number | undefined): string => {
  const sectorColors: Record<number, string> = {
    31: '#3B82F6',   // PARANOÁ - Azul
    124: '#10B981',  // SANTA MARIA - Verde
    239: '#F59E0B',  // SÃO SEBASTIÃO - Amarelo
    240: '#EF4444',  // GAMA - Vermelho
  };
  
  return sectorColors[sectorCode || 0] || '#6B7280';
};

/**
 * Obtém nome do setor por código
 */
export const getSectorName = (sectorCode: number | undefined): string => {
  const sectorNames: Record<number, string> = {
    31: 'PARANOÁ',
    124: 'SANTA MARIA',
    239: 'SÃO SEBASTIÃO',
    240: 'GAMA',
  };
  
  return sectorNames[sectorCode || 0] || `Setor ${sectorCode || 'Desconhecido'}`;
};

/**
 * Obtém ícone do setor por código
 */
export const getSectorIcon = (sectorCode: number | undefined): string => {
  const sectorIcons: Record<number, string> = {
    31: '🏢',   // PARANOÁ
    124: '��️',  // SANTA MARIA
    239: '��️',  // SÃO SEBASTIÃO
    240: '🏭',   // GAMA
  };
  
  return sectorIcons[sectorCode || 0] || '��';
};

// =========================================================================
// FORMATADORES DE TEXTO
// =========================================================================

/**
 * Trunca texto com reticências
 */
export const truncateText = (text: string | undefined | null, maxLength: number = 50): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitaliza primeira letra de cada palavra
 */
export const capitalizeWords = (text: string | undefined | null): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Remove acentos de texto
 */
export const removeAccents = (text: string | undefined | null): string => {
  if (!text) return '';
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Formata número de multa (AIT)
 */
export const formatMultaNumber = (numero: string | undefined | null): string => {
  if (!numero) return 'N/A';
  
  // Remove caracteres não numéricos
  const cleaned = numero.replace(/\D/g, '');
  
  // Formata como XXX.XXX.XXX-X se tiver 10 dígitos
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
  }
  
  return numero;
};

/**
 * Formata prefixo de veículo
 */
export const formatVehiclePrefix = (prefixo: string | undefined | null): string => {
  if (!prefixo) return 'N/A';
  return prefixo.toUpperCase().trim();
};

/**
 * Formata placa de veículo
 */
export const formatVehiclePlate = (placa: string | undefined | null): string => {
  if (!placa) return 'N/A';
  
  const cleaned = placa.replace(/[^A-Z0-9]/g, '').toUpperCase();
  
  // Formato antigo: ABC-1234
  if (cleaned.length === 7 && /^[A-Z]{3}[0-9]{4}$/.test(cleaned)) {
    return cleaned.replace(/([A-Z]{3})([0-9]{4})/, '$1-$2');
  }
  
  // Formato Mercosul: ABC1D23
  if (cleaned.length === 7 && /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleaned)) {
    return cleaned.replace(/([A-Z]{3})([0-9][A-Z][0-9]{2})/, '$1$2');
  }
  
  return placa.toUpperCase();
};

// =========================================================================
// FORMATADORES DE TEMPO
// =========================================================================

/**
 * Formata duração em milissegundos para formato legível
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}min`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

/**
 * Calcula tempo no setor
 */
export const calculateTimeInSector = (
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null
): string => {
  if (!startDate) return 'N/A';
  
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = endDate ? 
      (typeof endDate === 'string' ? new Date(endDate) : endDate) : 
      new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} ano${years > 1 ? 's' : ''}`;
    } else if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} mês${months > 1 ? 'es' : ''}`;
    } else {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }
  } catch {
    return 'Erro no cálculo';
  }
};

// =========================================================================
// FORMATADORES DE PRIORIDADE
// =========================================================================

/**
 * Determina prioridade de cobrança baseada no status e valor
 */
export const calculateCollectionPriority = (
  status: StatusMulta | string | undefined,
  daysToExpiry: number,
  value: number
): 'QUITADA' | 'URGENTE' | 'ALTA' | 'NORMAL' => {
  if (status === 'PAGA') return 'QUITADA';
  if (daysToExpiry <= 0) return 'URGENTE';
  if (daysToExpiry <= 15 && value > 500) return 'ALTA';
  if (daysToExpiry <= 30) return 'ALTA';
  return 'NORMAL';
};

/**
 * Obtém cor da prioridade
 */
export const getPriorityColor = (priority: string): string => {
  const priorityColors: Record<string, string> = {
    'QUITADA': '#22c55e',
    'URGENTE': '#ef4444',
    'ALTA': '#f97316',
    'NORMAL': '#3b82f6'
  };
  
  return priorityColors[priority] || priorityColors.NORMAL;
};

// =========================================================================
// VALIDADORES E SANITIZADORES
// =========================================================================

/**
 * Valida se um valor é um número válido
 */
export const isValidNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Valida se uma data é válida
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Sanitiza valor numérico
 */
export const sanitizeNumber = (value: any, defaultValue: number = 0): number => {
  if (isValidNumber(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isValidNumber(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
};

/**
 * Sanitiza string
 */
export const sanitizeString = (value: any, defaultValue: string = ''): string => {
  if (typeof value === 'string') return value.trim();
  if (value !== null && value !== undefined) return String(value).trim();
  return defaultValue;
};

// =========================================================================
// FORMATADORES DE EXPORTAÇÃO
// =========================================================================

/**
 * Formata dados para exportação CSV
 */
export const formatForCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // Escapar aspas duplas
  if (str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  // Envolver em aspas se contém vírgula, quebra de linha ou espaços
  if (str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str}"`;
  }
  
  return str;
};

/**
 * Formata nome de arquivo para download
 */
export const formatFileName = (baseName: string, extension: string = 'xlsx'): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${sanitizedName}_${timestamp}.${extension}`;
};