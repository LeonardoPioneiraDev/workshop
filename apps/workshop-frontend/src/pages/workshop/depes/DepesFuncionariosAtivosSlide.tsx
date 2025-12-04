import React, { useEffect, useMemo, useState } from 'react';
import { getDeptPessoalAtual } from '@/services/departments/pessoal/deptPessoalApi';
import { Skeleton } from '@/components/ui/skeleton';

const pad = 'p-6 sm:p-8 md:p-10';

function Header() {
  return (
    <div className="text-center mb-4">
      <div className="text-blue-700 text-xl font-bold tracking-wide">Pioneira</div>
      <div className="text-black text-lg font-semibold">Depes - Funcionários  Ativos</div>
    </div>
  );
}

function Bar3D({ label, value, color, max = 3400 }: { label: string; value: number; color: string; max?: number }) {
  const h = Math.max(8, Math.round((value / max) * 220));
  return (
    <div className="flex flex-col items-center justify-end h-[260px] w-24 mx-2 relative">
      <div className="text-xs text-white bg-black/70 px-2 py-0.5 rounded absolute -top-4">
        {value.toLocaleString('pt-BR')}
      </div>
      <div
        className="w-14 rounded-sm shadow-lg"
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

export default function DepesFuncionariosAtivosSlide() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        console.log('[DEPES ATIVOS] fetching...');
        const rows = await getDeptPessoalAtual();
        console.log('[DEPES ATIVOS] payload size:', Array.isArray(rows) ? rows.length : 'n/a');
        if (mounted) setData(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        console.error('[DEPES ATIVOS] error:', e);
        if (mounted) setError(e?.message || 'Falha ao carregar funcionários');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const isAtivo = (s: string | null | undefined) => (s || '').toUpperCase() === 'A';
    const has = (v: any, k: string) => (typeof v === 'string' ? v.toUpperCase().includes(k) : false);
    const rows = data || [];
    const ativos = rows.filter((r) => isAtivo(r?.situacao));
    let aprendiz = 0, manut = 0, admin = 0, trafego = 0;
    for (const r of ativos) {
      const funcao = (r?.funcao || '') as string;
      const area = (r?.area || '') as string;
      if (has(funcao, 'APREND')) { aprendiz++; continue; }
      if (has(funcao, 'MANUT')) { manut++; continue; }
      if (area === 'GESTAO') { admin++; continue; }
      if (area === 'TRANSPORTE') { trafego++; continue; }
    }
    const total = ativos.length;
    return { trafego, manut, admin, aprendiz, total };
  }, [data]);

  const bars = [
    { label: 'Tráfego', value: counts.trafego || 0, color: '#0b3d91' },
    { label: 'Manutenção', value: counts.manut || 0, color: '#f59e0b' },
    { label: 'Administração', value: counts.admin || 0, color: '#ef4444' },
    { label: 'Jovem Aprendiz', value: counts.aprendiz || 0, color: '#06b6d4' },
    { label: 'Total Ativos', value: counts.total || 0, color: '#0b3d91' },
  ];

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
          <div className="w-full border border-gray-400 rounded-md overflow-hidden">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {['Departamento', 'Média 2019', 'Qtde Func.'].map((h, i) => (
                <div key={i} className="bg-gray-100 border-b border-gray-400 px-3 py-2 text-sm font-semibold text-gray-800">{h}</div>
              ))}
              <div className="px-3 py-2 text-sm border-t border-gray-300">Tráfego</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(2146).toLocaleString('pt-BR')}</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(bars[0].value).toLocaleString('pt-BR')}</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">Manutenção</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(394).toLocaleString('pt-BR')}</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(bars[1].value).toLocaleString('pt-BR')}</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">Administração</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(158).toLocaleString('pt-BR')}</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(bars[2].value).toLocaleString('pt-BR')}</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">Jovem Aprendiz</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(0).toLocaleString('pt-BR')}</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(bars[3].value).toLocaleString('pt-BR')}</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">Total Ativos</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(2693).toLocaleString('pt-BR')}</div>
              <div className="px-3 py-2 text-sm border-t border-gray-300">{(bars[4].value).toLocaleString('pt-BR')}</div>
            </div>
          </div>
        )}
      </div>
      <div className="relative bg-gradient-to-b from-emerald-50 to-emerald-200 rounded-md border border-emerald-300 p-6 min-h-[320px]">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-3 py-1 rounded shadow">FEV  25</div>
        {loading ? (
          <div className="grid grid-cols-5 gap-4 mt-8">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <div className="flex items-end justify-between">
            {bars.map((b) => (
              <Bar3D key={b.label} label={b.label} value={b.value} color={b.color} />
            ))}
          </div>
        )}
      </div>
      <div className="text-center text-xs text-gray-600 mt-3">FONTE: - Globus em: 05032025 14:59:03</div>
    </div>
  );
}
