import React from 'react';

const pad = 'p-6 sm:p-8 md:p-10';

function Header({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="text-center mb-4">
      <div className="text-blue-700 text-xl font-bold tracking-wide">{top}</div>
      <div className="text-black text-lg font-semibold">{bottom}</div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="w-full border border-gray-400 rounded-md overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
        {headers.map((h, i) => (
          <div key={i} className="bg-gray-100 border-b border-gray-400 px-3 py-2 text-sm font-semibold text-gray-800">
            {h}
          </div>
        ))}
        {rows.map((r, idx) => (
          <React.Fragment key={idx}>
            {r.map((c, j) => (
              <div key={j} className="px-3 py-2 text-sm border-t border-gray-300">
                {typeof c === 'number' ? c.toLocaleString('pt-BR') : c}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Bar3D({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) {
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

export default function ManutencaoSlides() {
  const headers = ['Indicador', 'Descrição', 'Mês Atual'];
  const rows = [
    ['Revisão Preventiva', 'Qtd. de revisões realizadas', 128],
    ['OS Abertas', 'Ordens de serviço abertas', 54],
    ['OS Concluídas', 'Ordens de serviço fechadas', 102],
  ];

  const bars = [
    { label: 'Preventiva', value: 128, color: '#0b3d91', max: 300 },
    { label: 'OS Abertas', value: 54, color: '#f59e0b', max: 150 },
    { label: 'OS Concluídas', value: 102, color: '#10b981', max: 200 },
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${pad}`}>
      <Header top="Pioneira" bottom="Manutenção - Revisão e OS" />

      <div className="mb-6">
        <Table headers={headers} rows={rows} />
      </div>

      <div className="relative bg-gradient-to-b from-emerald-50 to-emerald-200 rounded-md border border-emerald-300 p-6">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded shadow">
          FEV  25
        </div>
        <div className="flex items-end justify-evenly">
          {bars.map((b) => (
            <Bar3D key={b.label} label={b.label} value={b.value} color={b.color} max={b.max as number} />
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-3">FONTE: - Globus em</div>
    </div>
  );
}

