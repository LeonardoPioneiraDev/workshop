import React, { useEffect, useMemo, useState } from 'react';
import { getDeptPessoalTurnover } from '@/services/departments/pessoal/deptPessoalApi';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ReferenceLine, LabelList } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// Component for a custom tooltip in the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm text-white p-3 rounded-lg border border-slate-700 shadow-lg">
        <p className="font-bold text-base text-amber-400">{label}</p>
        <p className="text-sm mt-1">{`Custo: ${payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}</p>
      </div>
    );
  }
  return null;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleString('pt-BR');
}

export default function DepesTurnoverSlide() {
  const [rows, setRows] = useState<Array<{ referencia_date: string; admitidos: number; desligados: number }>>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState(30000); // Meta padrão R$ 30.000,00
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getDeptPessoalTurnover();
        if (!mounted) return;
        setRows(data.rows || []);
        setLastSync(data.lastSync || null);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Falha ao carregar turnover');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const chartData = useMemo(() => {
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const formatLabel = (iso: string) => {
      const d = new Date(iso);
      const year = d.getFullYear();
      const month = d.getMonth();

      // Backend já retorna as datas corretas (m12, m2, m1, m0)
      // Não é necessário ajuste manual de ano

      return `${meses[month]}/${String(year).slice(-2)}`;
    };

    // Mapeando dados. Como não temos custo real na API ainda, usaremos 0 ou um valor simulado se necessário.
    // O original usava 0.
    return rows.map(r => ({
      name: formatLabel(r.referencia_date),
      'Custo': 0, // Placeholder, já que a API não retorna custo
      admitidos: r.admitidos,
      desligados: r.desligados,
    })).reverse(); // Mais recente primeiro (se a API vier ordenada desc, remover reverse. Assumindo ordem cronológica da API)
    // Nota: AfastadosSlide usa .reverse() no final para inverter a ordem cronológica (API manda antigo -> novo, queremos novo -> antigo na tabela?)
    // O usuário pediu "mesma ordem" do Afastados que agora é "mais recente primeiro".
    // Se a API manda [m12, m2, m1, m0] (antigo -> novo), reverse faz [m0, m1, m2, m12] (novo -> antigo).
  }, [rows]);

  const tableRows = useMemo(() => {
    // Tabela deve mostrar do mais recente para o mais antigo
    // chartData já está invertido (novo -> antigo) se usarmos .reverse() acima
    return chartData.map(d => [
      d.name,
      String(d.admitidos),
      String(d.desligados),
      'Não Informado', // Custo R.C.T.
      'Não Informado'  // Custo p/ R.C.T.
    ]);
  }, [chartData]);


  return (
    <div className="bg-slate-900 text-slate-200 p-4 sm:p-6 w-full h-auto lg:h-[90vh] flex flex-col gap-4">
      <header className="text-center flex-shrink-0 relative flex items-center justify-center">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border-slate-600 hover:bg-slate-700"
        >
          <img
            src="/assets/logo.png"
            alt="Pioneira Logo"
            className="h-8 sm:h-12 md:h-16 w-auto object-contain"
          />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-amber-400 tracking-wider">PIONEIRA</h1>
          <h2 className="text-xl font-semibold text-slate-300">DEPES – TURNOVER</h2>
        </div>
      </header>

      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-center flex-shrink-0">{error}</div>}

      <Card className="bg-slate-800/50 border-slate-700 flex-shrink-0 max-h-45 overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="text-amber-500 text-lg">Resumo de Turnover</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-4">
          {loading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-8 w-full bg-slate-700" />
              <Skeleton className="h-8 w-full bg-slate-700" />
            </div>
          ) : tableRows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="table-auto">
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800">
                    {['Mês/Ano', 'Admitido', 'Desligado', 'Custo R.C.T.', 'Custo p/ R.C.T.'].map(h => (
                      <TableHead key={h} className="text-slate-300 font-bold text-sm">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row, idx) => (
                    <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50">
                      {row.map((cell, cellIdx) => (
                        <TableCell key={cellIdx} className={`py-2 text-base ${cellIdx === 0 ? 'font-medium text-slate-200' : 'text-slate-300 text-right'}`}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">Sem dados para exibir.</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700 min-h-[400px] lg:flex-1 lg:max-h-96 lg:min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0 flex-row items-center justify-between py-4">
          <CardTitle className="text-amber-500 text-lg">Gráfico de Custo R.C.T.</CardTitle>
          <div className="flex items-center gap-3 w-full max-w-[12rem]">
            <Label htmlFor="meta-input" className="text-slate-300 whitespace-nowrap">Meta:</Label>
            <Input
              id="meta-input"
              type="number"
              value={meta}
              onChange={(e) => setMeta(Number(e.target.value))}
              className="bg-slate-900 border-slate-600 text-white w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="h-[300px] lg:flex-1 lg:h-auto lg:min-h-0 p-2">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <Skeleton className="w-full h-full bg-slate-700" />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                <ReferenceLine
                  y={meta}
                  label={{ value: `Meta: ${meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, position: 'right', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }}
                  stroke="#ef4444"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                />
                <Bar dataKey="Custo" shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const value = payload['Custo'];
                  const fill = value <= meta ? '#10b981' : '#ef4444'; // Verde se <= meta (bom), vermelho se > meta (ruim)
                  return <rect x={x} y={y} width={width} height={height} fill={fill} />;
                }}>
                  <LabelList
                    dataKey="Custo"
                    position="top"
                    fill="#fde68a"
                    fontSize={12}
                    formatter={(value: any) => Number(value) === 0 ? '' : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center h-full flex items-center justify-center text-slate-500">Gráfico indisponível.</div>
          )}
        </CardContent>
      </Card>

      {/* Legenda explicativa das cores */}
      <div className="flex justify-center items-center gap-6 flex-shrink-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-xs sm:text-sm text-slate-300">Abaixo da Meta (Bom)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-xs sm:text-sm text-slate-300">Acima da Meta (Ruim)</span>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 flex-shrink-0 pt-2">
        FONTE: Globus | Última sincronização: {formatDate(lastSync)}
      </footer>
    </div>
  );
}
