import React, { useState, useMemo, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './BarChart.css';
import { buildChartData } from '../../utils/chartUtils';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { commonChartOptions } from '../../utils/chartOptions';
import { ChartFilters } from '../ChartFilters/ChartFilters';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ErrorBoundary } from '../../ErrorBoundary/ErrorBoundary';
import { mapearSetor } from '../../utils/setorUtils';
import { useFiltros } from '../../contexts/FiltrosContext';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement, ChartDataLabels);

interface ViagemData {
  StatusInicio: number;
  StatusFim: number;
  NaoCumprida: number;
  ParcialmenteCumprida: number;
  AdiantadoInicio: number;
  AtrasadoInicio: number;
  ForadoHorarioInicio: number;
  AdiantadoFim: number;
  AtrasadoFim: number;
  ForadoHorarioFim: number;
  NomeMotorista?: string;
  NomeLinha?: string;
  SentidoText?: string;
  InicioRealizadoText?: string;
  FimRealizadoText?: string;
  SetorText?: string;
  PrefixoRealizado?: string;
  NumeroViagem?: number;
  InicioPrevisto?: string;
  InicioRealizado?: string;
  DiferencaInicio?: number;
  FimPrevisto?: string;
  FimRealizado?: string;
  DiferencaFim?: number;
  NomePI?: string;
  NomePF?: string;
}

interface BarChartProps {
  data: ViagemData[];
  corBarra?: string;
  filtroAtual?: string;
}

export function BarChart({ data, corBarra }: BarChartProps) {
  const [view, setView] = useState<'inicio' | 'fim' | 'ambos'>('ambos');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'both'>('both');
  const [filtrosSelecionados, setFiltrosSelecionados] = useState<{ [key: string]: string }>({});
  
  // Estados para o filtro de detalhes de viagens
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [tiposStatus, setTiposStatus] = useState({
    adiantado: true,
    atrasado: true,
    fora: true,
    parcial: false,
    nao: false
  });
  const [periodoDetalhes, setPeriodoDetalhes] = useState<'inicio' | 'fim' | 'ambos'>('ambos');
  const [limitarRegistros, setLimitarRegistros] = useState(true);
  const [limiteRegistros, setLimiteRegistros] = useState(20);

  // Usar o contexto de filtros
  const { filtrosDetalhados, setFiltrosDetalhados } = useFiltros();

  // Sincronizar filtros com o contexto
  useEffect(() => {
    if (Object.keys(filtrosSelecionados).length > 0) {
      setFiltrosDetalhados(filtrosSelecionados);
    } else if (Object.keys(filtrosDetalhados).length > 0) {
      setFiltrosSelecionados(filtrosDetalhados);
    }
  }, [filtrosSelecionados, filtrosDetalhados, setFiltrosDetalhados]);

  const mapearSetor = (item: ViagemData) => {
    const origem = (item?.NomePI ?? '').toLowerCase();
    const destino = (item?.NomePF ?? '').toLowerCase();
  
    // ... (resto da função mapearSetor, mantida como está)
    
    return 'Outro';
  };
  
  // Primeiro: adiciona SetorText aos dados
  const dadosComSetor = useMemo(() => {
    return data.map((item) => ({
      ...item,
      SetorText: mapearSetor(item),
    }));
  }, [data]);
  
  // Depois: aplica os filtros (inclusive setor) sobre os dados com SetorText
  const dadosFiltrados = useMemo(() => {
    return dadosComSetor.filter((item) => {
      const motorista = filtrosSelecionados['motorista'];
      const linha = filtrosSelecionados['linha'];
      const sentido = filtrosSelecionados['sentido'];
      const setor = filtrosSelecionados['setor'];
      const prefixo = filtrosSelecionados['prefixoRealizado'];
      return (
        (!motorista || item.NomeMotorista === motorista) &&
        (!linha || item.NomeLinha === linha) &&
        (!sentido || item.SentidoText === sentido) &&
        (!setor || item.SetorText === setor) &&
        (!prefixo || item.PrefixoRealizado === prefixo)
      );
    });
  }, [dadosComSetor, filtrosSelecionados]);

  // Filtrar viagens para detalhes específicos
  const viagensDetalhadas = useMemo(() => {
    let resultado: ViagemData[] = [];
    
    dadosFiltrados.forEach(viagem => {
      let incluir = false;
      
      // Verificar período de início
      if (periodoDetalhes === 'inicio' || periodoDetalhes === 'ambos') {
        if (
          (tiposStatus.adiantado && viagem.AdiantadoInicio > 0) ||
          (tiposStatus.atrasado && viagem.AtrasadoInicio > 0) ||
          (tiposStatus.fora && viagem.ForadoHorarioInicio > 0) ||
          (tiposStatus.parcial && viagem.ParcialmenteCumprida > 0) ||
          (tiposStatus.nao && viagem.NaoCumprida > 0)
        ) {
          incluir = true;
        }
      }
      
      // Verificar período de fim
      if (periodoDetalhes === 'fim' || periodoDetalhes === 'ambos') {
        if (
          (tiposStatus.adiantado && viagem.AdiantadoFim > 0) ||
          (tiposStatus.atrasado && viagem.AtrasadoFim > 0) ||
          (tiposStatus.fora && viagem.ForadoHorarioFim > 0) ||
          (tiposStatus.parcial && viagem.ParcialmenteCumprida > 0) ||
          (tiposStatus.nao && viagem.NaoCumprida > 0)
        ) {
          incluir = true;
        }
      }
      
      if (incluir) {
        resultado.push(viagem);
      }
    });
    
    // Ordenar por número de viagem
    resultado.sort((a, b) => {
      const numA = a.NumeroViagem || 0;
      const numB = b.NumeroViagem || 0;
      return numA - numB;
    });
    
    // Limitar quantidade de registros se necessário
    if (limitarRegistros && resultado.length > limiteRegistros) {
      resultado = resultado.slice(0, limiteRegistros);
    }
    
    return resultado;
  }, [dadosFiltrados, tiposStatus, periodoDetalhes, limitarRegistros, limiteRegistros]);

  const handleExportExcel = () => {
    exportToExcel(dadosFiltrados, {
      filtros: filtrosSelecionados,
      tipoVisualizacao: view,
      tipoGrafico: chartType,
      totais: totaisViagens,
      dataReferencia: formattedDate,
    });
  };

  const handleExportPDF = () => {
    exportToPDF(dadosFiltrados, {
      filtros: filtrosSelecionados,
      tipoVisualizacao: view,
      tipoGrafico: chartType,
      totais: totaisViagens,
      dataReferencia: formattedDate,
    });
  };

  const statusInicioKeys: (keyof ViagemData)[] = [
    'AdiantadoInicio',
    'AtrasadoInicio',
    'ForadoHorarioInicio',
    'ParcialmenteCumprida',
    'NaoCumprida',
  ];

  const statusFimKeys: (keyof ViagemData)[] = [
    'AdiantadoFim',
    'AtrasadoFim',
    'ForadoHorarioFim',
    'ParcialmenteCumprida',
    'NaoCumprida',
  ];

  const labels = ['Adiantado', 'Atrasado', 'Fora do Horário', 'Parcialmente', 'Não Realizada'];
  const colorsInicio = ['#2563eb', '#dc2626', '#f97316', '#eab308', '#6b7280'];
  const colorsFim = ['#16a34a', '#ef4444', '#f97316', '#a855f7', '#4b5563'];

  const barChartDataInicio = useMemo(
    () => buildChartData(dadosFiltrados, statusInicioKeys, labels, [corBarra || colorsInicio[0]], 'Status Início'),
    [dadosFiltrados, corBarra]
  );

  const barChartDataFim = useMemo(
    () => buildChartData(dadosFiltrados, statusFimKeys, labels, [corBarra || colorsFim[0]], 'Status Fim'),
    [dadosFiltrados, corBarra]
  );

  const pieChartDataInicio = useMemo(
    () => buildChartData(dadosFiltrados, statusInicioKeys, labels, colorsInicio, 'Status Início'),
    [dadosFiltrados]
  );

  const pieChartDataFim = useMemo(
    () => buildChartData(dadosFiltrados, statusFimKeys, labels, colorsFim, 'Status Fim'),
    [dadosFiltrados]
  );

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);
  
  const totaisViagens = useMemo(() => {
    const total = dadosFiltrados.length;
    const analisadas = dadosFiltrados.filter(
      v => v.InicioRealizadoText !== '-' || v.FimRealizadoText !== '-'
    ).length;
    const pendentes = total - analisadas;
    return { total, analisadas, pendentes };
  }, [dadosFiltrados]);
  
  // Função para formatar a diferença de tempo
  const formatarDiferenca = (minutos?: number) => {
    if (minutos === undefined) return "N/A";
    
    const valorAbsoluto = Math.abs(minutos);
    return valorAbsoluto.toFixed(2) + " minutos";
  };

  // Função para renderizar detalhes da viagem
  const renderizarDetalheViagem = (viagem: ViagemData) => {
    const detalhes = [];
    
    // Verificar status de início
    if (periodoDetalhes === 'inicio' || periodoDetalhes === 'ambos') {
      if (tiposStatus.adiantado && viagem.AdiantadoInicio > 0) {
        detalhes.push(
          <div key={`inicio-adiantado-${viagem.NumeroViagem}`} className="detalhe-viagem adiantado">
            <div className="detalhe-header">
              <span className="detalhe-badge adiantado">ADIANTAMENTO</span>
              <span className="detalhe-periodo">INÍCIO</span>
            </div>
            <div className="detalhe-content">
              <p className="detalhe-linha">
                <strong>Viagem {viagem.NumeroViagem}</strong> na Linha {viagem.NomeLinha}
              </p>
              <p className="detalhe-veiculo">
                Carro {viagem.PrefixoRealizado || '-'}, Motorista: {viagem.NomeMotorista || '--'}
              </p>
              <p className="detalhe-horarios">
                Previsto: {viagem.InicioPrevisto}, 
                Realizado: {viagem.InicioRealizado}
              </p>
              <p className="detalhe-diferenca">
                Diferença: <strong>{formatarDiferenca(viagem.DiferencaInicio)}</strong>
              </p>
            </div>
          </div>
        );
      }
      
      if (tiposStatus.atrasado && viagem.AtrasadoInicio > 0) {
        detalhes.push(
          <div key={`inicio-atrasado-${viagem.NumeroViagem}`} className="detalhe-viagem atrasado">
            <div className="detalhe-header">
              <span className="detalhe-badge atrasado">ATRASO</span>
              <span className="detalhe-periodo">INÍCIO</span>
            </div>
            <div className="detalhe-content">
              <p className="detalhe-linha">
                <strong>Viagem {viagem.NumeroViagem}</strong> na Linha {viagem.NomeLinha}
              </p>
              <p className="detalhe-veiculo">
                Carro {viagem.PrefixoRealizado || '-'}, Motorista: {viagem.NomeMotorista || '--'}
              </p>
              <p className="detalhe-horarios">
                Previsto: {viagem.InicioPrevisto}, 
                Realizado: {viagem.InicioRealizado}
              </p>
              <p className="detalhe-diferenca">
                Diferença: <strong>{formatarDiferenca(viagem.DiferencaInicio)}</strong>
              </p>
            </div>
          </div>
        );
      }
      
      if (tiposStatus.fora && viagem.ForadoHorarioInicio > 0) {
        detalhes.push(
          <div key={`inicio-fora-${viagem.NumeroViagem}`} className="detalhe-viagem fora">
            <div className="detalhe-header">
              <span className="detalhe-badge fora">FURO DE HORÁRIO</span>
              <span className="detalhe-periodo">INÍCIO</span>
            </div>
            <div className="detalhe-content">
              <p className="detalhe-linha">
                <strong>Viagem {viagem.NumeroViagem}</strong> na Linha {viagem.NomeLinha}
              </p>
              <p className="detalhe-veiculo">
                Carro {viagem.PrefixoRealizado || '-'}, Motorista: {viagem.NomeMotorista || '--'}
              </p>
              <p className="detalhe-horarios">
                Previsto: {viagem.InicioPrevisto}, 
                Realizado: {viagem.InicioRealizado || 'Não informado'}
              </p>
              <p className="detalhe-diferenca">
                Diferença: <strong>{formatarDiferenca(viagem.DiferencaInicio)}</strong>
              </p>
            </div>
          </div>
        );
      }
      
      if (tiposStatus.parcial && viagem.ParcialmenteCumprida > 0) {
        detalhes.push(
          <div key={`parcial-${viagem.NumeroViagem}`} className="detalhe-viagem parcial">
            <div className="detalhe-header">
              <span className="detalhe-badge parcial">PARCIALMENTE CUMPRIDA</span>
              <span className="detalhe-periodo">VIAGEM</span>
            </div>
            <div className="detalhe-content">
              <p className="detalhe-linha">
                <strong>Viagem {viagem.NumeroViagem}</strong> na Linha {viagem.NomeLinha}
              </p>
              <p className="detalhe-veiculo">
                Carro {viagem.PrefixoRealizado || '-'}, Motorista: {viagem.NomeMotorista || '--'}
              </p>
              <p className="detalhe-horarios">
                Início: {viagem.InicioPrevisto || 'N/A'} → {viagem.InicioRealizado || 'N/A'}
              </p>
              <p className="detalhe-horarios">
                Fim: {viagem.FimPrevisto || 'N/A'} → {viagem.FimRealizado || 'N/A'}
              </p>
            </div>
          </div>
        );
      }
      
      if (tiposStatus.nao && viagem.NaoCumprida > 0) {
        detalhes.push(
          <div key={`nao-${viagem.NumeroViagem}`} className="detalhe-viagem nao">
            <div className="detalhe-header">
              <span className="detalhe-badge nao">NÃO REALIZADA</span>
              <span className="detalhe-periodo">VIAGEM</span>
            </div>
            <div className="detalhe-content">
              <p className="detalhe-linha">
                <strong>Viagem {viagem.NumeroViagem}</strong> na Linha {viagem.NomeLinha}
              </p>
              <p className="detalhe-veiculo">
                Carro {viagem.PrefixoRealizado || '-'}, Motorista: {viagem.NomeMotorista || '--'}
              </p>
              <p className="detalhe-horarios">
                Início Previsto: {viagem.InicioPrevisto || 'N/A'}
              </p>
              <p className="detalhe-horarios">
                Fim Previsto: {viagem.FimPrevisto || 'N/A'}
              </p>
            </div>
          </div>
        );
      }
    }
    
    // Verificar status de fim
    if (periodoDetalhes === 'fim' || periodoDetalhes === 'ambos') {
      if (tiposStatus.adiantado && viagem.AdiantadoFim > 0) {
        detalhes.push(
          <div key={`fim-adiantado-${viagem.NumeroViagem}`} className="detalhe-viagem adiantado">
            <div className="detalhe-header">
              <span className="detalhe-badge adiantado">ADIANTAMENTO</span>
              <span className="detalhe-periodo">FIM</span>
            </div>
            <div className="detalhe-content">
              <p className="detalhe-linha">
                <strong>Viagem {viagem.NumeroViagem}</strong> na Linha {viagem.NomeLinha}
              </p>
              <p className="detalhe-veiculo">
                Carro {viagem.PrefixoRealizado || '-'}, Motorista: {viagem.NomeMotorista || '--'}
              </p>
              <p className="detalhe-horarios">
                Previsto: {viagem.FimPrevisto}, 
                Realizado: {viagem.FimRealizado}
              </p>
              <p className="detalhe-diferenca">
                Diferença: <strong>{formatarDiferenca(viagem.DiferencaFim)}</strong>
              </p>
            </div>
          </div>
        );
      }
      
      if (tiposStatus.atrasado && viagem.AtrasadoFim > 0) {
        detalhes.push(
          <div key={`fim-atrasado-${viagem.NumeroViagem}`} className="detalhe-viagem atrasado">
            <div className="detalhe-header">
              <span className="detalhe-badge atrasado">ATRASO</span>
              <span className="detalhe-periodo">FIM</span>
            </div>
            <div className="detalhe-content">
              <p className="detalhe-linha">
                <strong>Viagem {viagem.NumeroViagem}</strong> na Linha {viagem.NomeLinha}
              </p>
              <p className="detalhe-veiculo">
                Carro {viagem.PrefixoRealizado || '-'}, Motorista: {viagem.NomeMotorista || '--'}
              </p>
              <p className="detalhe-horarios">
                Previsto: {viagem.FimPrevisto}, 
                Realizado: {viagem.FimRealizado}
              </p>
              <p className="detalhe-diferenca">
                Diferença: <strong>{formatarDiferenca(viagem.DiferencaFim)}</strong>
              </p>
            </div>
          </div>
        );
      }
      
      if (tiposStatus.fora && viagem.ForadoHorarioFim > 0) {
        detalhes.push(
          <div key={`fim-fora-${viagem.NumeroViagem}`} className="detalhe-viagem fora">
            <div className="detalhe-header">
              <span className="detalhe-badge fora">FURO DE HORÁRIO</span>
              <span className="detalhe-periodo">FIM</span>
            </div>
            <div className="detalhe-content">
              <p className="detalhe-linha">
                <strong>Viagem {viagem.NumeroViagem}</strong> na Linha {viagem.NomeLinha}
              </p>
              <p className="detalhe-veiculo">
                Carro {viagem.PrefixoRealizado || '-'}, Motorista: {viagem.NomeMotorista || '--'}
              </p>
              <p className="detalhe-horarios">
                Previsto: {viagem.FimPrevisto}, 
                Realizado: {viagem.FimRealizado || 'Não informado'}
              </p>
              <p className="detalhe-diferenca">
                Diferença: <strong>{formatarDiferenca(viagem.DiferencaFim)}</strong>
              </p>
            </div>
          </div>
        );
      }
    }
    
    return detalhes;
  };

  // Toggle para tipos de status
  const toggleTipoStatus = (tipo: keyof typeof tiposStatus) => {
    setTiposStatus(prev => ({
      ...prev,
      [tipo]: !prev[tipo]
    }));
  };

  return (
    <div className="chart-container">
      {/* Filtros e controles */}
      <div className="chart-controls">
        <ChartFilters
          view={view}
          chartType={chartType}
          setView={setView}
          setChartType={setChartType}
          dados={dadosComSetor}
          filtrosSelecionados={filtrosSelecionados}
          setFiltrosSelecionados={setFiltrosSelecionados}
        />
      </div>

      {/* Gráficos */}
      <div className="charts">
        {(view === 'inicio' || view === 'ambos') && (
          <div className="chart-group">
            {(chartType === 'bar' || chartType === 'both') && (
              <div className="chart-item">
                <h3>Status de Início - Barras</h3>
                <ErrorBoundary>
                  <Bar data={barChartDataInicio} options={commonChartOptions} />
                </ErrorBoundary>
              </div>
            )}
            {(chartType === 'pie' || chartType === 'both') && (
              <div className="chart-item small-pie">
                <h3>Status de Início - Pizza</h3>
                <Pie data={pieChartDataInicio} options={commonChartOptions} />
              </div>
            )}
          </div>
        )}

        {(view === 'fim' || view === 'ambos') && (
          <div className="chart-group">
            {(chartType === 'bar' || chartType === 'both') && (
              <div className="chart-item">
                <h3>Status de Fim - Barras</h3>
                <Bar data={barChartDataFim} options={commonChartOptions} />
              </div>
            )}
            {(chartType === 'pie' || chartType === 'both') && (
              <div className="chart-item small-pie">
                <h3 style={{ paddingBottom: '10px' }}>Status de Fim - Pizza</h3>
                <Pie data={pieChartDataFim} options={commonChartOptions} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seção de detalhes das viagens */}
      <div className="viagens-detalhes-section">
        <div className="viagens-detalhes-header">
          <h3>Detalhes das Viagens</h3>
          <div className="toggle-container">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={mostrarDetalhes}
                onChange={() => setMostrarDetalhes(!mostrarDetalhes)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span>Mostrar detalhes das viagens</span>
          </div>
        </div>

        {mostrarDetalhes && (
          <div className="viagens-detalhes-container">
            <div className="viagens-filtros-container">
              <div className="viagens-filtros-grupo">
                <h4>Filtrar por Status:</h4>
                <div className="filtro-checkbox-grupo">
                  <label className="filtro-checkbox-label">
                    <input
                      type="checkbox"
                      checked={tiposStatus.adiantado}
                      onChange={() => toggleTipoStatus('adiantado')}
                    />
                    <span className="filtro-checkbox-custom adiantado"></span>
                    Adiantados
                  </label>
                  <label className="filtro-checkbox-label">
                    <input
                      type="checkbox"
                      checked={tiposStatus.atrasado}
                      onChange={() => toggleTipoStatus('atrasado')}
                    />
                    <span className="filtro-checkbox-custom atrasado"></span>
                    Atrasados
                  </label>
                  <label className="filtro-checkbox-label">
                    <input
                      type="checkbox"
                      checked={tiposStatus.fora}
                      onChange={() => toggleTipoStatus('fora')}
                    />
                    <span className="filtro-checkbox-custom fora"></span>
                    Furos de Horário
                  </label>
                  <label className="filtro-checkbox-label">
                    <input
                      type="checkbox"
                      checked={tiposStatus.parcial}
                      onChange={() => toggleTipoStatus('parcial')}
                    />
                    <span className="filtro-checkbox-custom parcial"></span>
                    Parcialmente Cumpridas
                  </label>
                  <label className="filtro-checkbox-label">
                    <input
                      type="checkbox"
                      checked={tiposStatus.nao}
                      onChange={() => toggleTipoStatus('nao')}
                    />
                    <span className="filtro-checkbox-custom nao"></span>
                    Não Realizadas
                  </label>
                </div>
              </div>

              <div className="viagens-filtros-grupo">
                <h4>Filtrar por Período:</h4>
                <div className="filtro-radio-grupo">
                  <label className="filtro-radio-label">
                    <input
                      type="radio"
                      name="periodo"
                      checked={periodoDetalhes === 'inicio'}
                      onChange={() => setPeriodoDetalhes('inicio')}
                    />
                    <span className="filtro-radio-custom"></span>
                    Início
                  </label>
                  <label className="filtro-radio-label">
                    <input
                      type="radio"
                      name="periodo"
                      checked={periodoDetalhes === 'fim'}
                      onChange={() => setPeriodoDetalhes('fim')}
                    />
                    <span className="filtro-radio-custom"></span>
                    Fim
                  </label>
                  <label className="filtro-radio-label">
                    <input
                      type="radio"
                      name="periodo"
                      checked={periodoDetalhes === 'ambos'}
                      onChange={() => setPeriodoDetalhes('ambos')}
                    />
                    <span className="filtro-radio-custom"></span>
                    Ambos
                  </label>
                </div>
              </div>

              <div className="viagens-filtros-grupo">
                <h4>Limitar Registros:</h4>
                <div className="filtro-limite-container">
                  <label className="filtro-checkbox-label">
                    <input
                      type="checkbox"
                      checked={limitarRegistros}
                      onChange={() => setLimitarRegistros(!limitarRegistros)}
                    />
                    <span className="filtro-checkbox-custom"></span>
                    Limitar a
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={limiteRegistros}
                    onChange={(e) => setLimiteRegistros(parseInt(e.target.value) || 20)}
                    disabled={!limitarRegistros}
                    className="filtro-limite-input"
                    />
                    <span>registros</span>
                  </div>
                </div>
              </div>
  
              <div className="viagens-resultados">
                <div className="viagens-resultados-header">
                  <h4>Resultados ({viagensDetalhadas.length} viagens encontradas)</h4>
                  {limitarRegistros && viagensDetalhadas.length === limiteRegistros && (
                    <p className="viagens-limite-aviso">
                      Mostrando apenas os primeiros {limiteRegistros} registros. 
                      Desmarque "Limitar Registros" para ver todos.
                    </p>
                  )}
                </div>
  
                {viagensDetalhadas.length > 0 ? (
                  <div className="viagens-lista">
                    {viagensDetalhadas.map((viagem) => (
                      <div key={`viagem-${viagem.NumeroViagem}`} className="viagem-container">
                        {renderizarDetalheViagem(viagem)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="viagens-sem-resultados">
                    <p>Nenhuma viagem encontrada com os filtros selecionados.</p>
                    <p>Tente ajustar os filtros ou selecionar outros tipos de status.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
  
        {/* Informações e exportação */}
        <div className="chart-info">
          <h4>Informações Adicionais e Filtros Opcionais</h4>
          <div className="info-actions">
            <div className="info-text">
              <p>Este gráfico exibe a contagem de viagens por status (Início e Fim). Filtros disponíveis:</p>
              <ul>
                <li><strong>Motorista</strong>, <strong>Linha</strong>, <strong>Sentido</strong> e <strong>Setor</strong></li>
                <li><strong>Total de Viagens Importadas:</strong> {totaisViagens.total}</li>
                <li><strong>Viagens Analisadas:</strong> {totaisViagens.analisadas}</li>
                <li><strong>Viagens Pendentes:</strong> {totaisViagens.pendentes}</li>
                {data.length > 0 && (
                  <li><strong>Data de Referência:</strong> {formattedDate}</li>
                )}
              </ul>
            </div>
            <div className="report-buttons">
              <button onClick={handleExportExcel}>📊 Exportar para Excel</button>
              <button onClick={handleExportPDF}>📄 Exportar para PDF</button>
            </div>
          </div>
        </div>
      </div>
    );
  }