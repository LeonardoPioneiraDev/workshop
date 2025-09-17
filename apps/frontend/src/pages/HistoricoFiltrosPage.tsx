// src/pages/HistoricoFiltrosPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiltros } from '../contexts/FiltrosContext';
import styles from '../styles/HistoricoFiltrosPage.module.css';

export function HistoricoFiltrosPage() {
  const navigate = useNavigate();
  const { historicoFiltros, setFiltrosPrincipais, setFiltrosDetalhados } = useFiltros();

  const aplicarFiltrosSalvos = (index: number) => {
    const filtroSalvo = historicoFiltros[index];
    if (!filtroSalvo) return;
    
    setFiltrosPrincipais(filtroSalvo.filtrosPrincipais);
    setFiltrosDetalhados(filtroSalvo.filtrosDetalhados);
    
    // Redirecionar para o dashboard
    navigate('/dashboard');
  };

  const formatarFiltros = (filtros: Record<string, string | undefined>) => {
    return Object.entries(filtros)
      .filter(([_, valor]) => valor)
      .map(([chave, valor]) => `${chave}: ${valor}`)
      .join(', ');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.btnVoltar} onClick={() => navigate(-1)}>
          ← Voltar
        </button>
        <h1>Histórico de Filtros</h1>
      </div>

      {historicoFiltros.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhum filtro salvo ainda.</p>
          <p>Quando você salvar filtros no dashboard, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className={styles.historicoGrid}>
          {historicoFiltros.map((filtro, index) => (
            <div key={filtro.id} className={styles.filtroCard}>
              <div className={styles.filtroHeader}>
                <h3>{filtro.descricao}</h3>
                <span className={styles.filtroData}>{filtro.data}</span>
              </div>
              
              <div className={styles.filtroContent}>
                {Object.values(filtro.filtrosPrincipais).some(Boolean) && (
                  <div className={styles.filtroSection}>
                    <h4>Filtros Principais:</h4>
                    <p>{formatarFiltros(filtro.filtrosPrincipais)}</p>
                  </div>
                )}
                
                {Object.values(filtro.filtrosDetalhados).some(Boolean) && (
                  <div className={styles.filtroSection}>
                    <h4>Filtros Detalhados:</h4>
                    <p>{formatarFiltros(filtro.filtrosDetalhados)}</p>
                  </div>
                )}
              </div>
              
              <div className={styles.filtroActions}>
                <button 
                  onClick={() => aplicarFiltrosSalvos(index)}
                  className={styles.btnAplicar}
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}