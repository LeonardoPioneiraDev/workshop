import React, { useEffect, useMemo, useState } from 'react';
import { getDeptPessoalAfastados } from '@/services/departments/pessoal/deptPessoalApi';
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
        <p className="text-sm mt-1">{`Realizado: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString; // Fallback to raw string if parsing fails
    }
    return date.toLocaleString('pt-BR');
}

export default function DepesAfastadosSlide() {
  const [rows, setRows] = useState<Array<{ referencia_date: string; inss: number | null; apInvalidez: number | null; total: number }>>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState(363);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getDeptPessoalAfastados();
        if (!mounted) return;
        setRows(data.rows || []);
        setLastSync(data.lastSync || null);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Falha ao carregar afastados');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const chartData = useMemo(() => {
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const formatLabel = (iso: string) => { const d = new Date(iso); return `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`; };
    
    return rows.map(r => ({
      name: formatLabel(r.referencia_date),
      'Realizado': r.total,
      inss: r.inss ?? 0,
      apInvalidez: r.apInvalidez ?? 0,
    }));
  }, [rows]);

  const tableRows = useMemo(() => {
    return [...chartData].reverse().map(d => [d.name, String(d.inss), String(d.apInvalidez), String(d['Realizado'])]);
  }, [chartData]);


  return (
    <div className="bg-slate-900 text-slate-200 p-4 sm:p-6 w-full h-screen flex flex-col gap-4">
      <header className="text-center flex-shrink-0 relative flex items-center justify-center">
        <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            size="icon" 
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-transparent border-slate-600 hover:bg-slate-700"
        >
            <ChevronLeft className="h-6 w-6 text-slate-300" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold text-amber-400 tracking-wider">PIONEIRA</h1>
            <h2 className="text-xl font-semibold text-slate-300">DEPES – AFASTADOS</h2>
        </div>
      </header>
      
      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-center flex-shrink-0">{error}</div>}

      <Card className="bg-slate-800/50 border-slate-700 flex-shrink-0">
        <CardHeader className="py-3">
          <CardTitle className="text-amber-500 text-lg">Resumo de Afastados</CardTitle>
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
                    {['Mês/Ano', 'INSS', 'Ap. Invalidez', 'Total Afastados'].map(h => (
                      <TableHead key={h} className="text-slate-300 font-bold text-sm">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row, idx) => (
                    <TableRow key={idx} className="border-slate-700 hover:bg-slate-700/50">
                      {row.map((cell, cellIdx) => (
                        <TableCell key={cellIdx} className={`py-2 text-base ${cellIdx === 3 ? 'font-bold text-amber-300' : 'text-slate-300'}`}>{cell}</TableCell>
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
      
      <Card className="bg-slate-800/50 border-slate-700 flex-1 min-h-0 flex flex-col">
        <CardHeader className="flex-shrink-0 flex-row items-center justify-between py-4">
            <CardTitle className="text-amber-500 text-lg">Gráfico de Afastados</CardTitle>
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
        <CardContent className="flex-1 min-h-0 p-2">
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
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                <ReferenceLine y={meta} label={{ value: `Meta: ${meta}`, position: 'insideRight', fill: '#f87171', fontSize: 12 }} stroke="#f87171" strokeWidth={2} />
                <Bar dataKey="Realizado" fill="#f59e0b">
                   <LabelList dataKey="Realizado" position="top" fill="#fde68a" fontSize={14} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center h-full flex items-center justify-center text-slate-500">Gráfico indisponível.</div>
          )}
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-slate-500 flex-shrink-0 pt-2">
        FONTE: Globus | Última sincronização: {formatDate(lastSync)}
      </footer>
    </div>
  );
}
