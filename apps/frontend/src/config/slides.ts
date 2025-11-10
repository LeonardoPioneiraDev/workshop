// src/config/slides.ts
import { SlideConfig } from '@/types/dashboard';
import { DepesAfastadosSlide } from '@/components/dashboard/slides/DepesAfastadosSlide';

export const slidesConfig: SlideConfig[] = [
  {
    id: 'depes-afastados',
    title: 'DEPES - Afastados',
    subtitle: 'Funcionários Afastados por INSS e Aposentadoria por Invalidez',
    component: DepesAfastadosSlide,
    meta: {
      defaultValue: 20,
      metaLabel: 'Meta Afastados',
      description: 'Meta de funcionários afastados'
    }
  },
  // ✅ EXEMPLOS DE FUTUROS SLIDES
  {
    id: 'depes-admissoes',
    title: 'DEPES - Admissões',
    subtitle: 'Novas Admissões e Demissões Mensais',
    component: DepesAfastadosSlide, // Temporário - usar o mesmo componente
    meta: {
      defaultValue: 50,
      metaLabel: 'Meta Admissões',
      description: 'Meta de novas admissões mensais'
    }
  },
  {
    id: 'depes-rotatividade',
    title: 'DEPES - Rotatividade',
    subtitle: 'Índice de Rotatividade de Funcionários',
    component: DepesAfastadosSlide, // Temporário - usar o mesmo componente
    meta: {
      defaultValue: 15,
      metaLabel: 'Meta Rotatividade (%)',
      description: 'Meta de rotatividade em percentual'
    }
  },
  {
    id: 'depes-produtividade',
    title: 'DEPES - Produtividade',
    subtitle: 'Indicadores de Produtividade por Setor',
    component: DepesAfastadosSlide, // Temporário - usar o mesmo componente
    meta: {
      defaultValue: 85,
      metaLabel: 'Meta Produtividade (%)',
      description: 'Meta de produtividade em percentual'
    }
  },
  {
    id: 'depes-custos',
    title: 'DEPES - Custos',
    subtitle: 'Análise de Custos com Pessoal',
    component: DepesAfastadosSlide, // Temporário - usar o mesmo componente
    meta: {
      defaultValue: 1000000,
      metaLabel: 'Meta Custos (R\$)',
      description: 'Meta de custos mensais com pessoal'
    }
  }
];