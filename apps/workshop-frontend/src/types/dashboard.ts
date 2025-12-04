// src/types/dashboard.ts
export interface SlideConfig {
  id: string;
  title: string;
  subtitle: string;
  component: React.ComponentType<SlideProps>;
  meta?: {
    defaultValue?: number;
    metaLabel?: string;
    description?: string;
  };
}

export interface SlideProps {
  meta: number;
  onMetaChange: (value: number) => void;
  isActive: boolean;
  slideNumber: number;
  totalSlides: number;
}

export interface DashboardMes {
  mes: string;
  mesFormatado: string;
  totalFuncionarios: number;
  funcionariosAtivos: number;
  funcionariosAfastados: number;
  funcionariosDemitidos: number;
  percentualAfastados: number;
  inss: number;
  aposentadoriaInvalidez: number;
  totalAfastados: number;
  isAtual?: boolean;
  isAnoAnterior?: boolean;
}