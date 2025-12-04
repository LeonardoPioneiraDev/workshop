import React, { useMemo } from 'react';

type DepRow = { departamento: string; media2019: number; qtde: number; color: string };

const slidePadding = 'p-6 sm:p-8 md:p-10';

function Header({ titleTop, titleBottom }: { titleTop: string; titleBottom: string }) {
  return (
    <div className="text-center mb-4">
      <div className="text-blue-700 text-xl font-bold tracking-wide">{titleTop}</div>
      <div className="text-black text-lg font-semibold">{titleBottom}</div>
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="w-full border border-gray-400 rounded-md overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
        {headers.map((h, i) => (
          <div key={i} className="bg-gray-100 border-b border-gray-400 px-3 py-2 text-sm font-semibold text-gray-800 break-words">
            {h}
          </div>
        ))}
        {rows.map((r, idx) => (
          <React.Fragment key={idx}>
            {r.map((c, j) => (
              <div key={j} className="px-3 py-2 text-sm border-t border-gray-300 break-words">
                {typeof c === 'number' ? c.toLocaleString('pt-BR') : c}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ThreeDBar({ value, color, label }: { value: number; color: string; label: string }) {
  // Height scale: normalize by a max (e.g., 3400)
  const max = 3400;
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

function MonthBadge({ text }: { text: string }) {
  return (
    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded shadow">
      {text}
    </div>
  );
}

function FooterFonte({ text }: { text: string }) {
  return <div className="text-center text-xs text-gray-600 mt-3">{text}</div>;
}

function Slide1() {
  // Dados conforme especificação do usuário
  const data: DepRow[] = [
    { departamento: 'Tráfego', media2019: 2146, qtde: 2322, color: '#0b3d91' },
    { departamento: 'Manutenção', media2019: 394, qtde: 365, color: '#f59e0b' },
    { departamento: 'Administração', media2019: 158, qtde: 66, color: '#ef4444' },
    { departamento: 'Jovem Aprendiz', media2019: 0, qtde: 162, color: '#06b6d4' },
    { departamento: 'Total Ativos', media2019: 2693, qtde: 2915, color: '#0b3d91' },
  ];

  const tableRows = data.map((d) => [d.departamento, d.media2019, d.qtde]);

  return (
    <div className={`bg-white rounded-lg shadow ${slidePadding} relative`}>
      <Header titleTop="Pioneira" titleBottom="Depes - Funcionários  Ativos" />

      <div className="mb-6">
        <SimpleTable headers={["Departamento", "Média 2019", "Qtde Func."]} rows={tableRows} />
      </div>

      <div className="relative bg-gradient-to-b from-emerald-50 to-emerald-200 rounded-md border border-emerald-300 p-6">
        <MonthBadge text="FEV  25" />
        <div className="flex flex-wrap items-end justify-center gap-4">
          {data.map((d) => (
            <ThreeDBar key={d.departamento} value={d.qtde} color={d.color} label={d.departamento} />
          ))}
        </div>
      </div>

      <FooterFonte text="FONTE: - Globus em: 05032025 14:59:03" />
    </div>
  );
}

function ThreeDBarMoney({ value, color, label }: { value: number; color: string; label: string }) {
  const max = 320000;
  const h = Math.max(8, Math.round((value / max) * 220));
  return (
    <div className="flex flex-col items-center justify-end h-[260px] w-24 mx-2 relative">
      <div className="text-xs text-gray-900 bg-white px-2 py-0.5 rounded shadow absolute -top-5">
        {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
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

function Slide2() {
  const headers = ['Mês  Ano', 'Admitido', 'Desligado', 'Custo R.C.T.', 'Custo p R.C.T.'];
  const rows = [
    ['FEV  24', 23, 15, '105.796,18', '7.053,08'],
    ['DEZ  24', 24, 48, '208.713,91', '4.348,21'],
    ['JAN  25', 63, 52, '221.986,70', '4.268,98'],
    ['FEV  25', 23, 23, '261.559,92', '11.372,17'],
  ];

  const barras = [
    { label: 'FEV  24', value: 105796.18, color: '#0b3d91' },
    { label: 'DEZ  24', value: 208713.91, color: '#f59e0b' },
    { label: 'JAN  25', value: 221986.7, color: '#ef4444' },
    { label: 'FEV  25', value: 261559.92, color: '#10b981' },
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${slidePadding} relative`}>
      <div className="text-center mb-4">
        <div className="text-blue-700 text-xl font-bold tracking-wide">PIONEIRA</div>
        <div className="text-blue-700 text-lg font-semibold">DEPES - TOURN OVER</div>
      </div>

      <div className="mb-6">
        <SimpleTable headers={headers} rows={rows} />
      </div>

      <div className="relative bg-gradient-to-b from-emerald-50 to-emerald-200 rounded-md border border-emerald-300 p-6 overflow-hidden">
        {/* Meta line at R$ 30.000,00 */}
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

        <div className="flex flex-wrap items-end justify-center gap-4">
          {barras.map((b) => (
            <ThreeDBarMoney key={b.label} value={b.value} color={b.color} label={b.label} />
          ))}
        </div>
      </div>

      <FooterFonte text="FONTE: - Globus em: 05032025 16:02:22" />
    </div>
  );
}

export default function DepesSlides() {
  return (
    <div className="space-y-8">
      <Slide1 />
      <Slide2 />
    </div>
  );
}

