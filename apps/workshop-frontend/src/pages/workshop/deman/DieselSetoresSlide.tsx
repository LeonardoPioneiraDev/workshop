import React from 'react';

const pad = 'p-6 sm:p-8 md:p-10';

function Bar3D({ label, value, color, max = 300000 }: { label: string; value: number; color: string; max?: number }) {
  const h = Math.max(8, Math.round((value / max) * 220));
  return (
    <div className="flex flex-col items-center justify-end h-[260px] w-24 mx-2 relative">
      <div className="text-xs text-gray-900 bg-white px-2 py-0.5 rounded shadow absolute -top-5">
        {value.toLocaleString('pt-BR')}
      </div>
      <div className="w-14 rounded-sm" style={{ height: h, background: `linear-gradient(145deg, ${color}, #0a0a0a 120%)`, boxShadow: 'inset 0 0 8px rgba(255,255,255,0.1), 6px 6px 10px rgba(0,0,0,0.4)' }} />
      <div className="text-xs mt-2 text-center leading-tight">{label}</div>
    </div>
  );
}

export default function DieselSetoresSlide() {
  const bars = [
    { label: 'Gama', value: 112345, color: '#0b3d91' },
    { label: 'SMaria', value: 98321, color: '#f59e0b' },
    { label: 'Paranoá', value: 124550, color: '#06b6d4' },
    { label: 'SSebastião', value: 80420, color: '#10b981' },
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${pad}`}>
      <div className="text-center mb-4">
        <div className="text-blue-700 text-xl font-bold tracking-wide">Pioneira</div>
        <div className="text-black text-lg font-semibold">DEMAN – Consumo de Diesel (por Setor)</div>
      </div>
      <div className="relative bg-gradient-to-b from-blue-50 to-blue-200 rounded-md border border-blue-200 p-6">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-3 py-1 rounded shadow">FEV  25</div>
        <div className="flex items-end justify-evenly">
          {bars.map((b) => (
            <Bar3D key={b.label} label={b.label} value={b.value} color={b.color} />
          ))}
        </div>
        <div className="absolute left-6 bottom-4 text-xs flex items-center gap-3">
          <div className="bg-gray-800 text-white text-[11px] px-2 py-0.5 rounded">REALIZADO</div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-600 mt-3">FONTE: - Globus em: </div>
    </div>
  );
}

