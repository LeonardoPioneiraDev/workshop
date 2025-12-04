import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DepesSlides from '@/pages/workshop/DepesSlides';
import DepesFuncionariosAtivosSlide from '@/pages/workshop/depes/DepesFuncionariosAtivosSlide';
import DepesTurnoverSlide from '@/pages/workshop/depes/DepesTurnoverSlide';
import DepesAfastadosSlide from '@/pages/workshop/depes/DepesAfastadosSlide';
import TrafegoSlides from '@/pages/workshop/TrafegoSlides';
import IpKSlide from '@/pages/workshop/trafego/IpKSlide';
import HoraExtraSlide from '@/pages/workshop/trafego/HoraExtraSlide';
import KMOciosaSlide from '@/pages/workshop/trafego/KMOciosaSlide';
import ManutencaoSlides from '@/pages/workshop/ManutencaoSlides';
import PreventivaGeralSlide from '@/pages/workshop/manutencao/PreventivaGeralSlide';
import PreventivaSetoresSlide from '@/pages/workshop/manutencao/PreventivaSetoresSlide';
import DemanSlides from '@/pages/workshop/DemanSlides';
import DieselGeralSlide from '@/pages/workshop/deman/DieselGeralSlide';
import DieselSetoresSlide from '@/pages/workshop/deman/DieselSetoresSlide';
import SegurancaSlides from '@/pages/workshop/SegurancaSlides';
import ColisoesMesSlide from '@/pages/workshop/seguranca/ColisoesMesSlide';
import ColisoesTiposSlide from '@/pages/workshop/seguranca/ColisoesTiposSlide';

export default function WorkshopAllSlides() {
  const slides = useMemo(
    () => [
      // DEPES (separado em 2 slides)
      <DepesFuncionariosAtivosSlide key="depes-func-ativos" />, 
      <DepesTurnoverSlide key="depes-turnover" />,
      <DepesAfastadosSlide key="depes-afastados" />,
      // TRÁFEGO / OPERAÇÃO
      <TrafegoSlides key="trafego-visao" />, 
      <IpKSlide key="ipk" />, 
      <HoraExtraSlide key="hora-extra" />, 
      <KMOciosaSlide key="km-ociosa" />, 
      // MANUTENÇÃO
      <ManutencaoSlides key="manutencao-visao" />, 
      <PreventivaGeralSlide key="preventiva-geral" />, 
      <PreventivaSetoresSlide key="preventiva-setores" />, 
      // DEMAN - DIESEL
      <DemanSlides key="deman-visao" />, 
      <DieselGeralSlide key="diesel-geral" />, 
      <DieselSetoresSlide key="diesel-setores" />, 
      // SEGURANÇA - COLISÕES
      <SegurancaSlides key="seguranca-visao" />, 
      <ColisoesMesSlide key="colisoes-mes" />, 
      <ColisoesTiposSlide key="colisoes-tipos" />,
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [slides.length]);
  const goTo = useCallback((i: number) => setIndex(((i % slides.length) + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (!auto) return;
    intervalRef.current && clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => next(), 7000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [auto, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-sm text-gray-400">Slide {index + 1} / {slides.length}</div>
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded text-xs border ${auto ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'text-gray-300 border-gray-600'}`}
            onClick={() => setAuto((v) => !v)}
            title="Alternar autoplay"
          >
            {auto ? 'Auto' : 'Manual'}
          </button>
          <button className="px-3 py-1 rounded text-xs border text-gray-300 border-gray-600" onClick={prev} title="Anterior">◀</button>
          <button className="px-3 py-1 rounded text-xs border text-gray-300 border-gray-600" onClick={next} title="Próximo">▶</button>
        </div>
      </div>

      {/* Slide viewport */}
      <div className="px-4 sm:px-6 md:px-8">
        <div className="relative overflow-hidden">
          <div className="transition-opacity duration-500 ease-in-out">
            {slides[index]}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex flex-wrap items-center justify-center gap-2 py-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full ${i === index ? 'bg-yellow-400' : 'bg-gray-500'}`}
            aria-label={`Ir para slide ${i + 1}`}
          />)
        )}
      </div>
    </div>
  );
}
