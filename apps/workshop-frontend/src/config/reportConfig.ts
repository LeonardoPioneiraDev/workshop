export const REPORT_CONFIG = {
  // Tipos de relatório disponíveis
  TIPOS: {
    MULTAS_GERAL: 'multas_geral',
    MULTAS_TRANSITO: 'multas_transito',
    MULTAS_SEMOB: 'multas_semob',
    AGENTES_RANKING: 'agentes_ranking',
    SETORES_ANALISE: 'setores_analise',
    FINANCEIRO: 'financeiro',
    ESTATISTICO: 'estatistico'
  },

  // Formatos suportados
  FORMATOS: {
    PDF: 'pdf',
    EXCEL: 'excel',
    HTML: 'html',
    CSV: 'csv',
    JSON: 'json'
  },

  // Status possíveis
  STATUS: {
    PROCESSANDO: 'processando',
    CONCLUIDO: 'concluido',
    ERRO: 'erro',
    AGENDADO: 'agendado',
    CANCELADO: 'cancelado'
  },

  // Configurações de agendamento
  AGENDAMENTO: {
    MANUAL: 'manual',
    DIARIO: 'diario',
    SEMANAL: 'semanal',
    MENSAL: 'mensal',
    TRIMESTRAL: 'trimestral'
  },

  // Configurações de Excel
  EXCEL_CONFIG: {
    MAX_ROWS_PER_SHEET: 65000,
    DEFAULT_COLUMN_WIDTH: 15,
    HEADER_HEIGHT: 25,
    DATA_ROW_HEIGHT: 20
  },

  // Configurações de API
  API_CONFIG: {
    BASE_URL: import.meta.env.VITE_API_BASE_URL,
    TIMEOUT: 900000,
    MAX_RETRIES: 3
  },

  // Configurações de armazenamento
  STORAGE_CONFIG: {
    LOCAL_STORAGE_KEY: 'juridico_relatorios_salvos',
    MAX_REPORTS_STORED: 100,
    AUTO_CLEANUP_DAYS: 90
  }
};