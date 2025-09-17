// src/contexts/FiltrosContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Tipos para os filtros
export interface FiltrosPrincipais {
  dataInicio?: string;
  dataFim?: string;
  tipoVisualizacao?: string;
  dia?: string;
  numerolinha?: string;
  idservico?: string;
  prefixorealizado?: string;
  statusini?: string;
  statusfim?: string;
  [key: string]: string | undefined;
}

// Adicionar à interface FiltrosDetalhados
export interface FiltrosDetalhados {
  motorista?: string;
  linha?: string;
  sentido?: string;
  setor?: string;
  prefixoRealizado?: string;
  // Novos campos para detalhes de viagens
  mostrarDetalhes?: boolean;
  tiposStatus?: {
    adiantado: boolean;
    atrasado: boolean;
    fora: boolean;
    parcial: boolean;
    nao: boolean;
  };
  periodoDetalhes?: 'inicio' | 'fim' | 'ambos';
  limitarRegistros?: boolean;
  limiteRegistros?: number;
  [key: string]: any;
}

export interface FiltrosHistorico {
  id: string;
  data: string;
  filtrosPrincipais: FiltrosPrincipais;
  filtrosDetalhados: FiltrosDetalhados;
  descricao: string;
}

// Interface para dados do contexto que podem ser extraídos
export interface FiltrosContextData {
  filtrosPrincipais: FiltrosPrincipais;
  filtrosDetalhados: FiltrosDetalhados;
  descricaoFiltros: string;
}

interface FiltrosContextType {
  filtrosPrincipais: FiltrosPrincipais;
  setFiltrosPrincipais: (filtros: FiltrosPrincipais) => void;
  filtrosDetalhados: FiltrosDetalhados;
  setFiltrosDetalhados: (filtros: FiltrosDetalhados) => void;
  historicoFiltros: FiltrosHistorico[];
  salvarFiltrosAtuais: (descricao?: string) => void;
  limparFiltros: () => void;
  obterDescricaoFiltros: () => string;
  ultimaAtualizacao: string | null;
  setFiltrosAplicados: (filtros: FiltrosPrincipais) => void; // Para compatibilidade com código existente
  // Nova função para obter dados do contexto
  obterDadosContext: () => FiltrosContextData;
}

// Variável global para armazenar a última instância do contexto
// Isso permitirá acesso aos dados fora do React, mas com cuidado
let ultimaInstanciaContext: FiltrosContextData | null = null;

const FiltrosContext = createContext<FiltrosContextType | undefined>(undefined);

// Chaves para localStorage
const FILTROS_PRINCIPAIS_KEY = 'dashboard_filtros_principais';
const FILTROS_DETALHADOS_KEY = 'dashboard_filtros_detalhados';
const HISTORICO_FILTROS_KEY = 'dashboard_historico_filtros';
const ULTIMA_ATUALIZACAO_KEY = 'dashboard_ultima_atualizacao';

export function FiltrosProvider({ children }: { children: ReactNode }) {
  // Estados para os filtros
  const [filtrosPrincipais, setFiltrosPrincipaisState] = useState<FiltrosPrincipais>({});
  const [filtrosDetalhados, setFiltrosDetalhadosState] = useState<FiltrosDetalhados>({});
  const [historicoFiltros, setHistoricoFiltros] = useState<FiltrosHistorico[]>([]);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);
  // Flag para controlar a inicialização
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar filtros do localStorage ao montar
  useEffect(() => {
    if (!isInitialized) {
      try {
        const filtrosPrincipaisSalvos = localStorage.getItem(FILTROS_PRINCIPAIS_KEY);
        const filtrosDetalhadosSalvos = localStorage.getItem(FILTROS_DETALHADOS_KEY);
        const historicoSalvo = localStorage.getItem(HISTORICO_FILTROS_KEY);
        const ultimaAtualizacaoSalva = localStorage.getItem(ULTIMA_ATUALIZACAO_KEY);
        
        if (filtrosPrincipaisSalvos) {
          setFiltrosPrincipaisState(JSON.parse(filtrosPrincipaisSalvos));
        }
        
        if (filtrosDetalhadosSalvos) {
          setFiltrosDetalhadosState(JSON.parse(filtrosDetalhadosSalvos));
        }
        
        if (historicoSalvo) {
          setHistoricoFiltros(JSON.parse(historicoSalvo));
        }
        
        if (ultimaAtualizacaoSalva) {
          setUltimaAtualizacao(ultimaAtualizacaoSalva);
        }
        
        // Marcar como inicializado após carregar dados
        setIsInitialized(true);
      } catch (error) {
        console.error('Erro ao carregar filtros do localStorage:', error);
        setIsInitialized(true); // Marcar como inicializado mesmo em caso de erro
      }
    }
  }, [isInitialized]);

  // Função para atualizar filtros principais - usando useCallback para evitar recriação
  const setFiltrosPrincipais = useCallback((filtros: FiltrosPrincipais) => {
    setFiltrosPrincipaisState(filtros);
    
    const agora = new Date().toLocaleString('pt-BR');
    setUltimaAtualizacao(agora);
    
    try {
      localStorage.setItem(FILTROS_PRINCIPAIS_KEY, JSON.stringify(filtros));
      localStorage.setItem(ULTIMA_ATUALIZACAO_KEY, agora);
    } catch (error) {
      console.error('Erro ao salvar filtros principais no localStorage:', error);
    }
  }, []);

  // Função para atualizar filtros detalhados - usando useCallback para evitar recriação
  const setFiltrosDetalhados = useCallback((filtros: FiltrosDetalhados) => {
    setFiltrosDetalhadosState(prevFiltros => {
      // Comparar para evitar atualizações desnecessárias
      if (JSON.stringify(prevFiltros) === JSON.stringify(filtros)) {
        return prevFiltros; // Retorna o estado anterior se não houver mudanças
      }
      
      // Se houver mudanças, atualiza o localStorage e retorna o novo estado
      const agora = new Date().toLocaleString('pt-BR');
      setUltimaAtualizacao(agora);
      
      try {
        localStorage.setItem(FILTROS_DETALHADOS_KEY, JSON.stringify(filtros));
        localStorage.setItem(ULTIMA_ATUALIZACAO_KEY, agora);
      } catch (error) {
        console.error('Erro ao salvar filtros detalhados no localStorage:', error);
      }
      
      return filtros;
    });
  }, []);

  // Função para salvar os filtros atuais no histórico - usando useCallback
  const salvarFiltrosAtuais = useCallback((descricao?: string) => {
    // Verificar se há filtros para salvar
    const temFiltrosPrincipais = Object.values(filtrosPrincipais).some(Boolean);
    const temFiltrosDetalhados = Object.values(filtrosDetalhados).some(Boolean);
    
    if (!temFiltrosPrincipais && !temFiltrosDetalhados) {
      console.warn('Nenhum filtro para salvar no histórico');
      return;
    }
    
    const novoHistorico: FiltrosHistorico = {
      id: Date.now().toString(),
      data: new Date().toLocaleString('pt-BR'),
      filtrosPrincipais: { ...filtrosPrincipais },
      filtrosDetalhados: { ...filtrosDetalhados },
      descricao: descricao || `Consulta de ${new Date().toLocaleDateString('pt-BR')}`
    };
    
    setHistoricoFiltros(prevHistorico => {
      const historicoAtualizado = [novoHistorico, ...prevHistorico].slice(0, 10);
      
      try {
        localStorage.setItem(HISTORICO_FILTROS_KEY, JSON.stringify(historicoAtualizado));
      } catch (error) {
        console.error('Erro ao salvar histórico de filtros no localStorage:', error);
      }
      
      return historicoAtualizado;
    });
  }, [filtrosPrincipais, filtrosDetalhados]);

  // Função para limpar todos os filtros - usando useCallback
  const limparFiltros = useCallback(() => {
    setFiltrosPrincipaisState({});
    setFiltrosDetalhadosState({});
    setUltimaAtualizacao(null);
    
    localStorage.removeItem(FILTROS_PRINCIPAIS_KEY);
    localStorage.removeItem(FILTROS_DETALHADOS_KEY);
    localStorage.removeItem(ULTIMA_ATUALIZACAO_KEY);
  }, []);

  // Função para obter descrição textual dos filtros - usando useCallback
  const obterDescricaoFiltros = useCallback(() => {
    const partesPrincipais = Object.entries(filtrosPrincipais)
      .filter(([_, valor]) => valor)
      .map(([chave, valor]) => {
        const nomeChave = {
          'dia': 'Data',
          'dataInicio': 'Data Início',
          'dataFim': 'Data Fim',
          'numerolinha': 'Linha',
          'idservico': 'ID Serviço',
          'prefixoprevisto': 'Prefixo Previsto',
          'prefixorealizado': 'Prefixo Realizado',
          'statusini': 'Status Inicial',
          'statusfim': 'Status Final'
        }[chave] || chave;
        
        return `${nomeChave}: ${valor}`;
      });
    
    const partesDetalhadas = Object.entries(filtrosDetalhados)
      .filter(([chave, valor]) => valor && typeof valor !== 'object')
      .map(([chave, valor]) => {
        const nomeChave = {
          'motorista': 'Motorista',
          'linha': 'Linha',
          'sentido': 'Sentido',
          'setor': 'Setor',
          'prefixoRealizado': 'Prefixo'
        }[chave] || chave;
        
        return `${nomeChave}: ${valor}`;
      });
    
    const todasPartes = [...partesPrincipais, ...partesDetalhadas];
    
    if (todasPartes.length === 0) {
      return "Nenhum filtro aplicado";
    }
    
    return todasPartes.join(" | ");
  }, [filtrosPrincipais, filtrosDetalhados]);

  // Função para compatibilidade com código existente
  const setFiltrosAplicados = useCallback((filtros: FiltrosPrincipais) => {
    setFiltrosPrincipais(filtros);
  }, [setFiltrosPrincipais]);

  // Nova função para obter dados do contexto - usando useCallback
  const obterDadosContext = useCallback(() => {
    const dados: FiltrosContextData = {
      filtrosPrincipais,
      filtrosDetalhados,
      descricaoFiltros: obterDescricaoFiltros()
    };
    
    // Armazenar a última instância para uso fora do React
    ultimaInstanciaContext = dados;
    
    return dados;
  }, [filtrosPrincipais, filtrosDetalhados, obterDescricaoFiltros]);

  // Atualizar a instância global quando os filtros mudarem
  useEffect(() => {
    if (isInitialized) {
      ultimaInstanciaContext = {
        filtrosPrincipais,
        filtrosDetalhados,
        descricaoFiltros: obterDescricaoFiltros()
      };
    }
  }, [filtrosPrincipais, filtrosDetalhados, obterDescricaoFiltros, isInitialized]);

  return (
    <FiltrosContext.Provider 
      value={{ 
        filtrosPrincipais, 
        setFiltrosPrincipais,
        filtrosDetalhados,
        setFiltrosDetalhados,
        historicoFiltros,
        salvarFiltrosAtuais,
        limparFiltros,
        obterDescricaoFiltros,
        ultimaAtualizacao,
        setFiltrosAplicados,
        obterDadosContext
      }}
    >
      {children}
    </FiltrosContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export function useFiltros() {
  const context = useContext(FiltrosContext);
  if (context === undefined) {
    throw new Error('useFiltros deve ser usado dentro de um FiltrosProvider');
  }
  return context;
}

// Função auxiliar para obter dados do contexto fora de componentes React
// IMPORTANTE: Isso só funcionará se o contexto já tiver sido inicializado em algum componente
export function getFiltrosContextData(): FiltrosContextData | null {
  return ultimaInstanciaContext;
}