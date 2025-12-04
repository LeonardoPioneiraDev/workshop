import React from 'react';

const pad = 'p-6 sm:p-8 md:p-10';

function Bar3D({ label, value, color, max = 20 }: { label: string; value: number; color: string; max?: number }) {
  const h = Math.max(8, Math.round((value / max) * 220));
  return (
    <div className="flex flex-col items-center justify-end h-[220px] w-20 mx-2 relative">
      <div className="text-xs text-white bg-black/70 px-2 py-0.5 rounded absolute -top-4">{value}</div>
      <div className="w-10 rounded-sm" style={{ height: h, background: `linear-gradient(145deg, ${color}, #0a0a0a 120%)`, boxShadow: 'inset 0 0 8px rgba(255,255,255,0.1), 6px 6px 10px rgba(0,0,0,0.4)' }} />
      <div className="text-[10px] mt-2 text-center leading-tight">{label}</div>
    </div>
  );
}

export default function ColisoesMesSlide() {
  const rows = [
    ['Mês', 'Total', 'Tipo Majoritário', 'Garagem Top'],
    ['FEV  25', '42', 'Leve', 'Gama'],
  ];

  const bars = [
    { label: 'NOV  24', value: 12, color: '#0b3d91' },
    { label: 'DEZ  24', value: 8, color: '#10b981' },
    { label: 'JAN  25', value: 15, color: '#f59e0b' },
    { label: 'FEV  25', value: 17, color: '#ef4444' },
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${pad}`}>
      <div className="text-center mb-4">
        <div className="text-blue-700 text-xl font-bold tracking-wide">Pioneira</div>
        <div className="text-black text-lg font-semibold">Segurança – Colisões (por Mês)</div>
      </div>
      <div className="mb-4 w-full border border-gray-300 rounded overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          {rows.flat().map((c, i) => (
            <div key={i} className={`px-3 py-2 text-sm ${i < 4 ? 'bg-gray-100 font-semibold border-b' : ''} border-gray-300`}>{c}</div>
          ))}
        </div>
      </div>
      <div className="relative bg-gradient-to-b from-blue-50 to-blue-200 rounded-md border border-blue-200 p-6">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-3 py-1 rounded shadow">FEV  25</div>
        <div className="flex items-end justify-evenly">
          {bars.map((b) => (
            <Bar3D key={b.label} label={b.label} value={b.value} color={b.color} />
          ))}
        </div>
      </div>
      <div className="text-center text-xs text-gray-600 mt-3">Fonte: – Globus em: </div>
    </div>
  );
}

