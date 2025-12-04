import React from 'react';

const pad = 'p-6 sm:p-8 md:p-10';

function Header() {
  return (
    <div className="text-center mb-4">
      <div className="text-blue-700 text-xl font-bold tracking-wide">Pioneira</div>
      <div className="text-black text-lg font-semibold">Tráfego – KM Ociosa (Odômetro)</div>
    </div>
  );
}

function Bar3D({ label, value, color, max = 200000 }: { label: string; value: number; color: string; max?: number }) {
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

export default function KMOciosaSlide() {
  const bars = [
    { label: 'Gama', value: 132000, color: '#0b3d91' },
    { label: 'SMaria', value: 98000, color: '#f59e0b' },
    { label: 'Paranoá', value: 114000, color: '#06b6d4' },
    { label: 'SSebastião', value: 87000, color: '#10b981' },
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${pad}`}>
      <Header />
      <div className="relative bg-gradient-to-b from-emerald-50 to-emerald-200 rounded-md border border-emerald-300 p-6">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-3 py-1 rounded shadow">
          FEV  25
        </div>
        <div className="flex items-end justify-evenly">
          {bars.map((b) => (
            <Bar3D key={b.label} label={b.label} value={b.value} color={b.color} />
          ))}
        </div>
      </div>
      <div className="text-center text-xs text-gray-600 mt-3">FONTE: - Globus em: </div>
    </div>
  );
}

