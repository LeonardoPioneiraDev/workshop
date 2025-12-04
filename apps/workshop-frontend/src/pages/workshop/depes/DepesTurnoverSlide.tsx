import React, { useEffect, useMemo, useState } from 'react';
import { getDeptPessoalTurnover } from '@/services/departments/pessoal/deptPessoalApi';
import { Skeleton } from '@/components/ui/skeleton';

const pad = 'p-6 sm:p-8 md:p-10';

function Header() {
  return (
    <div className="text-center mb-4">
      <div className="text-blue-700 text-xl font-bold tracking-wide">PIONEIRA</div>
      <div className="text-blue-700 text-lg font-semibold">DEPES - TOURN OVER</div>
    </div>
  );
}

function SimpleTable({ rows }: { rows: string[][] }) {
  const headers = ['Mês  Ano', 'Admitido', 'Desligado', 'Custo R.C.T.', 'Custo p R.C.T.'];

  return (
    <div className="w-full border border-gray-300 rounded-md overflow-hidden bg-white">
      <div className="grid" style={{ gridTemplateColumns: `repeat(5, minmax(0, 1fr))` }}>
        {headers.map((h, i) => (
          <div
            key={i}
            className={`px-3 py-2 text-sm font-semibold text-gray-900 border-b border-gray-300 bg-white flex items-center ${i === 0 ? 'text-left' : 'justify-end'}`}
          >
            {h}
          </div>
        ))}
        {rows.map((r, idx) => (
          <React.Fragment key={idx}>
            {r.map((c, j) => (
              <div
                key={j}
                className={`px-3 py-2 text-sm text-gray-900 border-t border-gray-200 bg-white flex items-center ${j === 0 ? 'text-left' : 'justify-end'}`}
              >
                {c}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Bar3DMoney({ label, value, color, max = 320000 }: { label: string; value: number; color: string; max?: number }) {
  const h = Math.max(8, Math.round((value / max) * 220));
  return (
    <div className="flex flex-col items-center justify-end h-[260px] w-24 mx-2 relative">
      {value > 0 && (
        <div className="text-xs text-gray-900 bg-white px-2 py-0.5 rounded shadow absolute -top-5">
          {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )}
      <div
        className="w-14 rounded-sm"
        style={{
          height: h,
          background: `linear-gradient(145deg, ${color}, #0a0a0a 120%)`,
          boxShadow: `inset 0 0 8px rgba(255,255,255,0.1), 6px 6px 10px rgba(0,0,0,0.4)`,
        }}
      />
      <div className="text-xs mt-2 text-center leading-tight">{label}</div>
    </div>
  );
}

export default function DepesTurnoverSlide() {
  const [rows, setRows] = useState<Array<{ referencia_date: string; admitidos: number; desligados: number }>>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        console.log('[DEPES TURNOVER] fetching...');
        const data = await getDeptPessoalTurnover();
        console.log('[DEPES TURNOVER] payload:', data);
        if (!mounted) return;
        setRows(data.rows || []);
        setLastSync(data.lastSync || null);
      } catch (e: any) {
        console.error('[DEPES TURNOVER] error:', e);
        if (mounted) setError(e?.message || 'Falha ao carregar turnover');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formatted = useMemo(() => {
    // Espera 4 linhas em ordem: m12, m2, m1, m0
    const labels = (iso: string) => {
      const d = new Date(iso);
      const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      return `${meses[d.getMonth()]}  ${String(d.getFullYear()).slice(-2)}`;
    };
    const table = rows.map((r) => ({ mes: labels(r.referencia_date), admitidos: r.admitidos, desligados: r.desligados }));
    // Custo ainda não disponível no snapshot → apresentar traço
    const tableRows: string[][] = table.map((t) => [t.mes, String(t.admitidos), String(t.desligados), '—', '—']);
    return { tableRows };
  }, [rows]);

  const bars = useMemo(() => {
    // Gráfico exibe apenas Custo R.C.T.; como não temos valor, manteremos zero (ou ocultar rótulo)
    // Mantemos 0 para não distorcer. Quando houver custo, substituir.
    const labelFromIso = (iso: string) => {
      const d = new Date(iso);
      const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      return `${meses[d.getMonth()]}  ${String(d.getFullYear()).slice(-2)}`;
    };
    const palette = ['#0b3d91', '#f59e0b', '#ef4444', '#10b981'];
    return rows.map((r, i) => ({ label: labelFromIso(r.referencia_date), value: 0, color: palette[i % palette.length] }));
  }, [rows]);

  return (
    <div className={`bg-white rounded-lg shadow ${pad}`}>
      <Header />
      <div className="mb-6 min-h-[140px]">
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <SimpleTable rows={formatted.tableRows} />
        )}
      </div>
      <div className="relative bg-gradient-to-b from-emerald-50 to-emerald-200 rounded-md border border-emerald-300 p-6 overflow-hidden min-h-[320px]">
        {/* Meta */}
        <div className="absolute left-4 right-16" style={{ top: '75%' }}>
          <div className="border-t-2 border-red-500" />
        </div>
        <div className="absolute left-4 bottom-4 text-xs flex items-center gap-3">
          <div className="bg-gray-800 text-white text-[11px] px-2 py-0.5 rounded">REALIZADO</div>
          <div className="text-red-600 text-[11px]">META R$ 30.000,00</div>
        </div>
        {/* Icono lateral */}
        <div className="absolute top-4 right-4 w-14 h-14 rounded-md shadow" style={{ background: 'linear-gradient(135deg,#b45309,#991b1b)' }}>
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[11px] text-white font-bold text-center">
              BOM
              <div style={{ lineHeight: 1 }} className="text-red-200">↓</div>
            </div>
          </div>
        </div>
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-3 py-1 rounded shadow">{rows[2] ? (()=>{const d=new Date(rows[2].referencia_date); const m=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'][d.getMonth()]; return `${m}  ${String(d.getFullYear()).slice(-2)}`;})() : '—'}</div>
        {loading ? (
          <div className="grid grid-cols-4 gap-4 mt-8">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <div className="flex items-end justify-between">
            {bars.map((b) => (
              <Bar3DMoney key={b.label} label={b.label} value={b.value} color={b.color} />
            ))}
          </div>
        )}
      </div>
      <div className="text-center text-xs text-gray-600 mt-3">
        FONTE: - Globus em: {(() => {
          if (!lastSync) return '—';
          const t = Date.parse(lastSync as string);
          if (Number.isNaN(t)) return String(lastSync);
          const d = new Date(t); const pad=(n:number)=> String(n).padStart(2,'0');
          return `${pad(d.getDate())}${pad(d.getMonth()+1)}${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        })()}
      </div>
    </div>
  );
}
