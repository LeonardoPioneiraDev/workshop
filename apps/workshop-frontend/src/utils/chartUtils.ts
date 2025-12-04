export function countByKey(data: ViagemData[], key: keyof ViagemData): number {
  return data.reduce((acc, item) => {
    const value = item[key];
    return acc + (typeof value === 'number' ? value : 0);
  }, 0);
}

export function buildChartData(
  data: ViagemData[],
  keys: (keyof ViagemData)[],
  labels: string[],
  colors: string[],
  datasetLabel: string
) {
  const counts = keys.map((key) => countByKey(data, key));

  return {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data: counts,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };
}
