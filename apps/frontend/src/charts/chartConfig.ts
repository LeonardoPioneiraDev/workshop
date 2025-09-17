// src/charts/chartConfig.ts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registra todos os componentes usados nos gráficos
ChartJS.register(
  CategoryScale,  // escala para eixos x/y com categorias
  LinearScale,    // escala linear (para o eixo y)
  BarElement,     // gráfico de barras
  LineElement,    // gráfico de linha
  ArcElement,     // gráfico de pizza, donut
  PointElement,   // pontos em gráficos de linha
  Title,
  Tooltip,
  Legend
);
