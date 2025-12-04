import React from 'react';

const pad = 'p-6 sm:p-8 md:p-10';

export default function DieselGeralSlide() {
  return (
    <div className={`bg-white rounded-lg shadow ${pad}`}>
      <div className="text-center mb-4">
        <div className="text-blue-700 text-xl font-bold tracking-wide">Pioneira</div>
        <div className="text-black text-lg font-semibold">DEMAN – Consumo de Diesel (Geral)</div>
      </div>
      <div className="mb-4 w-full border border-gray-300 rounded">
        <div className="grid grid-cols-2">
          <div className="bg-gray-100 px-3 py-2 text-sm font-semibold border-b border-gray-300">Mês Atual</div>
          <div className="bg-gray-100 px-3 py-2 text-sm font-semibold border-b border-gray-300">Mês Anterior</div>
          <div className="px-3 py-2 text-sm border-t">261.559,92 L</div>
          <div className="px-3 py-2 text-sm border-t">208.713,91 L</div>
        </div>
      </div>
      <div className="relative bg-gradient-to-b from-blue-50 to-blue-200 rounded-md border border-blue-200 p-6">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-3 py-1 rounded shadow">FEV  25</div>
        <div className="flex items-end justify-center h-[260px]">
          <div className="flex flex-col items-center justify-end h-full w-28 mx-2 relative">
            <div className="text-xs text-gray-900 bg-white px-2 py-0.5 rounded shadow absolute -top-5">R$ 261.559,92</div>
            <div className="w-16 rounded-sm" style={{ height: 220, background: 'linear-gradient(145deg,#0b3d91,#0a0a0a 120%)', boxShadow: '6px 6px 10px rgba(0,0,0,0.4)' }} />
            <div className="text-xs mt-2">Total Diesel</div>
          </div>
        </div>
        <div className="absolute left-6 bottom-4 text-xs flex items-center gap-3">
          <div className="bg-gray-800 text-white text-[11px] px-2 py-0.5 rounded">REALIZADO</div>
          <div className="text-red-600 text-[11px]">META</div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-600 mt-3">FONTE: - Globus em: </div>
    </div>
  );
}

