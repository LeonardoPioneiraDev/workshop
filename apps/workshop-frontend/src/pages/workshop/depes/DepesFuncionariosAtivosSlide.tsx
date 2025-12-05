import React, { useEffect, useState } from 'react';
import { apiClient } from '@/services/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LabelList } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '../../../assets/logo.png';

interface CategoriaData {
  referencia_date: string;
  categoria: string;
  total: number;
}

interface MediaData {
  categoria: string;
  media: number;
}

interface BackendResponse {
  rows: CategoriaData[];
  medias: MediaData[];
  lastSync: string | null;
}

interface DeptCounts {
  trafego: number;
  manutencao: number;
  administracao: number;
  aprendiz: number;
  total: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm text-white p-3 rounded-lg border border-slate-700 shadow-lg">
        <p className="font-bold text-base text-amber-400">{label}</p>
        <p className="text-sm mt-1">{`Total: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  try {
    // Remover a hora, deixar apenas a data
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

export default function DepesFuncionariosAtivosSlide() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dadosAtual, setDadosAtual] = useState<DeptCounts>({ trafego: 0, manutencao: 0, administracao: 0, aprendiz: 0, total: 0 });
  const [mesAtualLabel, setMesAtualLabel] = useState('DEZ 25');
  const [mesAnteriorLabel, setMesAnteriorLabel] = useState('NOV 25');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<BackendResponse>(
          '/dept-pessoal/ativos-categoria'
        );

        console.log('[DEPES ATIVOS] Resposta completa:', JSON.stringify(data, null, 2));
        console.log('[DEPES ATIVOS] data.rows:', data.rows);
        console.log('[DEPES ATIVOS] data.medias:', data.medias);
        console.log('[DEPES ATIVOS] Array.isArray(data.rows):', Array.isArray(data.rows));

        if (mounted && data && data.rows && Array.isArray(data.rows)) {
          const rows: CategoriaData[] = data.rows;
          const datas = [...new Set(rows.map(r => r.referencia_date))].sort().reverse();
          const mesAtual = datas[0];
          const anoPassado = datas[3];

          const dadosMesAtual = rows.filter(r => r.referencia_date === mesAtual);
          const countsAtual: DeptCounts = {
            trafego: Number(dadosMesAtual.find(r => r.categoria === 'TRAFEGO')?.total) || 0,
            manutencao: Number(dadosMesAtual.find(r => r.categoria === 'MANUTENCAO')?.total) || 0,
            administracao: Number(dadosMesAtual.find(r => r.categoria === 'ADMINISTRACAO')?.total) || 0,
            aprendiz: Number(dadosMesAtual.find(r => r.categoria === 'JOVEM_APRENDIZ')?.total) || 0,
            total: 0
          };
          countsAtual.total = countsAtual.trafego + countsAtual.manutencao + countsAtual.administracao + countsAtual.aprendiz;

          setDadosAtual(countsAtual);
          setLastSync(data.lastSync);

          try {
            const dataObj = new Date(mesAtual);
            const mes = dataObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
            const ano = dataObj.toLocaleDateString('pt-BR', { year: '2-digit' });
            setMesAtualLabel(`${mes} ${ano}`);

            // Calcular mês anterior (m1)
            const dataAnterior = new Date(datas[1]);
            const mesAnt = dataAnterior.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
            const anoAnt = dataAnterior.toLocaleDateString('pt-BR', { year: '2-digit' });
            setMesAnteriorLabel(`${mesAnt} ${anoAnt}`);
          } catch {
            setMesAtualLabel('DEZ 25');
            setMesAnteriorLabel('NOV 25');
          }
        } else {
          console.error('[DEPES ATIVOS] Resposta inválida:', data);
          if (mounted) setError('Dados não disponíveis. Reinicie o backend.');
        }
      } catch (e: any) {
        console.error('[DEPES ATIVOS] Erro:', e);
        if (mounted) setError(e?.message || 'Falha ao carregar. Reinicie o backend.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const tableRows = [
    ['Operação', dadosAtual.trafego.toLocaleString('pt-BR'), dadosAtual.trafego.toLocaleString('pt-BR')],
    ['Manutenção', dadosAtual.manutencao.toLocaleString('pt-BR'), dadosAtual.manutencao.toLocaleString('pt-BR')],
    ['Administração', dadosAtual.administracao.toLocaleString('pt-BR'), dadosAtual.administracao.toLocaleString('pt-BR')],
    ['Jovem Aprendiz', dadosAtual.aprendiz.toLocaleString('pt-BR'), dadosAtual.aprendiz.toLocaleString('pt-BR')],
    ['Total Ativos', dadosAtual.total.toLocaleString('pt-BR'), dadosAtual.total.toLocaleString('pt-BR')],
  ];

  const chartData = [
    { name: 'Operação', Total: dadosAtual.trafego, fill: '#3b82f6' },
    { name: 'Manutenção', Total: dadosAtual.manutencao, fill: '#f59e0b' },
    { name: 'Administração', Total: dadosAtual.administracao, fill: '#10b981' },
    { name: 'Jovem Aprendiz', Total: dadosAtual.aprendiz, fill: '#8b5cf6' },
    { name: 'Total Ativos', Total: dadosAtual.total, fill: '#ec4899' },
  ];

  return (
    <div className="bg-slate-900 text-slate-200 p-4 sm:p-6 w-full h-auto lg:h-[90vh] flex flex-col gap-4">
      <header className="text-center flex-shrink-0 relative flex items-center justify-center mb-4 sm:mb-6">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border-slate-600 hover:bg-slate-700"
        >
           <img
            src={logo}
            alt="Pioneira Logo"
            className="h-8 sm:h-12 md:h-16 w-auto object-contain"
          />
          
        </Button>
        <div className="flex flex-col items-center gap-2">
         
          <div>
            <h1 className="text-xs sm:text-sm font-semibold text-amber-400 tracking-wider mb-0.5 sm:mb-1">PIONEIRA</h1>
            <h2 className="text-sm sm:text-lg md:text-xl font-bold text-slate-300">DEPES – FUNCIONÁRIOS ATIVOS</h2>
          </div>
        </div>
      </header>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-center flex-shrink-0">{error}</div>}

      {/* Tabela sem Card */}
      <div className="flex-shrink-0 mb-4">
        {loading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-8 w-full bg-slate-700" />
            <Skeleton className="h-8 w-full bg-slate-700" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-600 shadow-lg">
            <Table className="table-auto">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800 border-slate-600">
                  <TableHead className="text-amber-300 font-bold text-xs sm:text-sm border-r border-slate-600 py-3">Departamento</TableHead>
                  <TableHead className="text-amber-300 font-bold text-xs sm:text-sm border-r border-slate-600 text-right py-3">Mês {mesAnteriorLabel}</TableHead>
                  <TableHead className="text-amber-300 font-bold text-xs sm:text-sm text-right py-3">Mês {mesAtualLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row, idx) => (
                  <TableRow key={idx} className={`border-slate-600 hover:bg-slate-700/50 transition-colors ${idx === 4 ? 'bg-slate-800/80' : idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'
                    }`}>
                    <TableCell className="py-2 sm:py-3 text-xs sm:text-base text-slate-200 border-r border-slate-600 font-medium">{row[0]}</TableCell>
                    <TableCell className="py-2 sm:py-3 text-xs sm:text-base text-slate-300 border-r border-slate-600 text-right">{row[1]}</TableCell>
                    <TableCell className={`py-2 sm:py-3 text-xs sm:text-base text-right ${idx === 4 ? 'font-bold text-amber-400 text-base sm:text-lg' : 'font-semibold text-green-400'
                      }`}>{row[2]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Faixa do Mês */}
      <div className="flex-shrink-0 text-center mb-4">
        <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg font-bold text-base sm:text-lg shadow-lg">
          {mesAtualLabel}
        </div>
      </div>

      {/* Gráfico sem título no Card */}
      <Card className="bg-slate-800/50 border-slate-700 min-h-[400px] lg:flex-1 lg:max-h-96 lg:min-h-0 flex flex-col overflow-hidden min-w-0">
        <CardContent className="h-[350px] lg:flex-1 lg:min-h-0 p-4 min-w-0">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <Skeleton className="w-full h-full bg-slate-700" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="Total">
                  {chartData.map((entry, index) => (
                    <rect key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="Total" position="top" fill="#fde68a" fontSize={14} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-slate-500 flex-shrink-0 pt-2">
        FONTE: Globus | Última sincronização: {formatDate(lastSync)}
      </footer>
    </div>
  );
}
