import { apiClient } from '@/services/api/client';

export interface DeptPessoalResumo {
  referencia_date: string;
  departamento: string;
  area: string;
  situacao: string;
  total: number;
}

export interface DeptPessoalRow {
  empresa: number;
  codintfunc: number;
  referenciaDate: string;
  nome: string;
  cracha?: string;
  chapa?: string;
  cpf?: string;
  funcao?: string;
  departamento?: string;
  area?: string;
  cidade?: string;
  admissao?: string;
  situacao?: string;
}

export async function syncDeptPessoal(force = false) {
  const res = await apiClient.get('/dept-pessoal/sync', { params: { force } });
  return res.data;
}

export async function getDeptPessoalAtual(): Promise<DeptPessoalRow[]> {
  const res = await apiClient.get('/dept-pessoal');
  return res.data;
}

export async function getDeptPessoalResumo(): Promise<DeptPessoalResumo[]> {
  const res = await apiClient.get('/dept-pessoal/resumo');
  return res.data;
}

export async function getDeptPessoalTurnover(): Promise<{ rows: Array<{ referencia_date: string; admitidos: number; desligados: number }>; lastSync: string | null }>{
  console.log('[API] GET /dept-pessoal/turnover');
  const data = await apiClient.get<{ rows: any[]; lastSync: string | null }>('/dept-pessoal/turnover');
  console.log('[API] /dept-pessoal/turnover data:', data);
  return data as any;
}

export async function getDeptPessoalAfastados(): Promise<{ rows: Array<{ referencia_date: string; inss: number | null; apInvalidez: number | null; total: number }>; lastSync: string | null }>{
  console.log('[API] GET /dept-pessoal/afastados');
  const data = await apiClient.get<{ rows: any[]; lastSync: string | null }>('/dept-pessoal/afastados');
  console.log('[API] /dept-pessoal/afastados data:', data);
  return data as any;
}
