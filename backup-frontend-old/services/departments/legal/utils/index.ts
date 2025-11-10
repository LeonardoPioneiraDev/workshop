// Legal department utilities
export const formatCurrency = (value: any) => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatNumber = (value: any): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

export const formatPercentage = (value: any): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0%';
  }
  
  return `${Number(value).toFixed(1)}%`;
};

export const calculateDaysUntilDue = (dueDate: Date | string): number => {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pendente': return 'yellow';
    case 'pago': return 'green';
    case 'vencido': return 'red';
    case 'cancelado': return 'gray';
    default: return 'blue';
  }
};

export const formatCompactNumber = (value: any): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  
  const num = Number(value);
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toString();
};