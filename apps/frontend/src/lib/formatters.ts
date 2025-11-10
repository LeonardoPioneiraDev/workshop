// src/lib/formatters.ts

/**
 * Formata um número com separador de milhares e decimais.
 * @param value O número a ser formatado.
 * @param decimals O número de casas decimais (padrão: 0).
 * @returns O número formatado como string, ou 'N/A' se inválido.
 */
export function formatNumber(value: number | string | undefined | null, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'N/A';
  }
  const numValue = Number(value);
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata um valor numérico como moeda (BRL).
 * @param value O valor a ser formatado.
 * @returns O valor formatado como string de moeda, ou 'R$ 0,00' se inválido.
 */
export function formatCurrency(value: number | string | undefined | null): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'R$ 0,00';
  }
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

/**
 * Formata uma data para um formato específico.
 * @param dateInput A data a ser formatada (Date object, ISO string, ou string válida).
 * @param format Uma string de formato (ex: 'dd/MM/yyyy', 'dd/MM/yyyy HH:mm', 'MMMM yyyy').
 * @returns A data formatada como string, ou 'N/A'/'Data Inválida' se inválida.
 */
export function formatDate(dateInput: Date | string | undefined | null, format: string = 'dd/MM/yyyy'): string {
  if (!dateInput) return 'N/A';

  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    // Tenta criar a data. ISO strings funcionam direto, outros formatos podem precisar de parsing.
    // Se o backend envia ISO strings (como '2025-10-18T17:39:46.650Z'), isso funcionará bem.
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return 'Data Inválida';

  // Usar Intl.DateTimeFormat para obter partes e montar o formato customizado
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // MM
  const day = date.getDate().toString().padStart(2, '0'); // dd
  const hours = date.getHours().toString().padStart(2, '0'); // HH
  const minutes = date.getMinutes().toString().padStart(2, '0'); // mm
  const seconds = date.getSeconds().toString().padStart(2, '0'); // ss

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthName = monthNames[date.getMonth()]; // MMMM

  let formattedString = format
    .replace(/yyyy/g, String(year))
    .replace(/MMMM/g, monthName)
    .replace(/MM/g, month)
    .replace(/dd/g, day)
    .replace(/HH/g, hours)
    .replace(/mm/g, minutes)
    .replace(/ss/g, seconds);

  return formattedString;
}

/**
 * Formata um número de telefone no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 * @param phone O número de telefone a ser formatado.
 * @returns O telefone formatado ou o original se não corresponder aos padrões.
 */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return 'N/A';
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'); // (XX) XXXXX-XXXX
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3'); // (XX) XXXX-XXXX
  }
  return phone; // Retorna original se não corresponder
}

/**
 * Calcula a diferença em dias entre duas datas.
 * @param startDateString A data de início (string ou Date).
 * @param endDateString A data de fim (string ou Date).
 * @returns A diferença em dias.
 */
export function calculateDaysBetween(startDateString: string | Date, endDateString: string | Date): number {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0; // Retorna 0 se alguma data for inválida
  }

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}