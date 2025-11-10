// chartOptions.ts
import type { ChartOptions } from 'chart.js';

export const commonChartOptions: ChartOptions<'bar' | 'pie'> = {
  responsive: true,
  layout: {
    padding: {
      top: 20,
      right: 20,
      bottom: 40, // ⬅️ aumenta o espaço entre o gráfico e a legenda (como se fosse marginTop na legenda)
      left: 20,
    },
  },
  plugins: {
    datalabels: {
      anchor: 'end',         // fixa no final da barra (parte de cima)
      align: 'top',          // alinha acima da barra
      offset: 1,             // ⬅️ isso funciona como um "marginTop"
      color: '#1f2937',
      font: {
        weight: 'bold',
        size: 12,
      },
      formatter: (value: number) => value,
      clamp: true,
    },
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        color: '#374151',
        font: {
          size: 13,
          weight: '500',
        },
        boxWidth: 22,
        padding: 12, // padding interno da legenda
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: '#1f2937',
      titleColor: '#f9fafb',
      bodyColor: '#d1d5db',
      titleFont: {
        size: 14,
        weight: 'bold',
      },
      bodyFont: {
        size: 13,
      },
      borderColor: '#9ca3af',
      borderWidth: 2,
      padding: 10,
      cornerRadius: 6,
    },
  },
  elements: {
    bar: {
      borderRadius: 6,
      borderSkipped: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#4b5563',
        font: {
          size: 14,
        },
      },
    },
    y: {
      grid: {
        color: '#e5e7eb',
        borderDash: [4, 4],
      },
      ticks: {
        color: '#4b5563',
        font: {
          size: 14,
        },
      },
    },
  },
};
