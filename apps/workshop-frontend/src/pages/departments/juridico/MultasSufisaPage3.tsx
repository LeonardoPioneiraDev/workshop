// src/pages/departments/juridico/MultasSufisaPage3.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Importar logo
import logoImage from '@/assets/logo.png';
import { multasSufisaService } from '@/services/departments/legal/multasSufisaService';

// Importar componentes de gráficos
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';

// ? Componente customizado para labels em gráficos verticais (Multas por Horário)
// Labels escuras para contraste com barras claras, posicionadas levemente acima.
const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;

  if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y - 8} // Posição levemente acima da barra
      fill="#374151" // Cor cinza escuro para contraste com barras claras
      textAnchor="middle"
      fontSize="12"
      fontWeight="bold"
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
};

// ? Componente customizado para labels em gráficos horizontais
// Labels escuras para contraste com barras claras (internas), ou claras para fundo escuro (externas).
const CustomHorizontalLabel = (props) => {
  const { x, y, width, height, value } = props;

  if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
    return null;
  }

  // Se a barra for muito pequena, coloca a label fora (clara, sobre o fundo escuro)
  if (width < 40) {
    return (
      <text
        x={x + width + 8}
        y={y + height / 2}
        fill="#E5E7EB" // Cinza claro (contrasta com o fundo escuro do card)
        textAnchor="start"
        fontSize="12"
        fontWeight="bold"
        dominantBaseline="middle"
      >
        {value}
      </text>
    );
  }

  // Para barras grandes, coloca a label dentro (escura, sobre a barra clara)
  return (
    <text
      x={x + width - 8} // Posição dentro da barra, alinhado à direita
      y={y + height / 2}
      fill="#374151" // Cinza escuro (contrasta com as barras claras)
      textAnchor="end"
      fontSize="12"
      fontWeight="bold"
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
};

// ? Componente customizado para quebrar texto nos eixos
const CustomAxisTick = (props) => {
  const { x, y, payload } = props;
  const text = payload.value;
  const maxCharsPerLine = 2; // Máximo de caracteres por linha

  // Quebrar o texto em palavras
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);

  // Se ainda estiver muito longo, quebrar por caracteres
  if (lines.length === 1 && lines[0].length > maxCharsPerLine) {
    const longText = lines[0];
    lines = [];
    for (let i = 0; i < longText.length; i += maxCharsPerLine) {
      lines.push(longText.substring(i, i + maxCharsPerLine));
    }
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={index * 12}
          dy={16}
          textAnchor="middle"
          fill="#E5E7EB"
          fontSize="9"
          fontWeight="normal"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// Hook para buscar dados SUFISA
const useMultasSufisa = () => {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    ano: '2025',
    mes: 'Todos',
    cidade: 'Todos'
  });

  // Função para mapear locais para cidades
  const mapearCidade = (local) => {
    if (!local) return 'Outros';

    const localUpper = local.toUpperCase();

    if (localUpper.includes('GAMA') || localUpper.includes('TERMINAL BRT GAMA')) {
      return 'Gama';
    }

    if (localUpper.includes('PARANOÁ') ||
      localUpper.includes('TERMINAL RODOVIARIO DO PARANOA')) {
      return 'Paranoá';
    }

    if (localUpper.includes('SÃO SEBASTIÃO')) {
      return 'São Sebastião';
    }

    if (localUpper.includes('SANTA MARIA')) {
      return 'Santa Maria';
    }

    return 'Outros';
  };

  // Função para identificar se é multa SUFISA
  const isMultaSufisa = (multa) => {
    const temAgente = multa.agenteCodigo && multa.agenteCodigo.trim() !== '';
    const temPontos = multa.pontuacaoInfracao && multa.pontuacaoInfracao > 0;
    const temGrupo = multa.grupoInfracao && multa.grupoInfracao.trim() !== '';

    if (temAgente && !temPontos && !temGrupo) {
      return true;
    }

    if (temAgente && (temPontos || temGrupo)) {
      return false;
    }

    return temAgente;
  };

  const fetchMultas = async (newFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await multasSufisaService.buscarMultasSufisa(newFilters);
      if (response.success) {
        let multasSufisa = response.data;
        // Adicionar campos derivados (cidade normalizada e linha de exibição)
        multasSufisa = multasSufisa.map(m => ({
          ...m,
          cidadeMapeada: mapearCidade(m.localMulta),
          linhaDescricao: (m as any).linhaDescricao ?? (m as any).nomeLinha ?? (m as any).codigoLinha
        }));
        // Filtro de cidade (client-side)
        const cidadeFiltro = (newFilters as any)?.cidade;
        if (cidadeFiltro && cidadeFiltro !== 'Todos') {
          multasSufisa = multasSufisa.filter((m: any) => (m.cidadeMapeada || 'Outros') === cidadeFiltro);
        }
        setMultas(multasSufisa);
      } else {
        throw new Error(response.message || 'Erro ao carregar multas SUFISA');
      }
    } catch (err) {
      console.error('Erro ao buscar multas SUFISA:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultas(filters);
  }, []);

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchMultas(newFilters);
  };

  return {
    multas,
    loading,
    error,
    filters,
    applyFilters,
    refetch: () => fetchMultas(filters)
  };
};

export default function MultasSufisaPage3() {
  const navigate = useNavigate();
  const { multas, loading, error, filters, applyFilters, refetch } = useMultasSufisa();
  const [currentPage, setCurrentPage] = useState(3);

  // ? Processar dados com validação rigorosa
  const processedData = useMemo(() => {
    if (!multas || !Array.isArray(multas) || multas.length === 0) {
      return {
        dadosFiscais: [],
        dadosClassificacao: [],
        dadosDesmembrado: [],
        dadosLinhaVeiculo: [],
        dadosHorario: [],
        dadosLocal: []
      };
    }

    // ? 1. FISCAIS - Top 10
    const fiscaisCount = {};
    multas.forEach(multa => {
      const fiscal = multa.agenteDescricao || multa.agenteCodigo || 'Não informado';
      if (fiscal !== 'Não informado') {
        fiscaisCount[fiscal] = (fiscaisCount[fiscal] || 0) + 1;
      }
    });
    const dadosFiscais = Object.entries(fiscaisCount)
      .map(([fiscal, quantidade]) => ({
        fiscal: fiscal.length > 20 ? fiscal.substring(0, 20) + '...' : fiscal,
        quantidade: Number(quantidade) || 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // ? 2. CLASSIFICAÇÃO - Agrupar por descricao_infra
    const classificacaoCount = {} as Record<string, number>;
    multas.forEach(multa => {
      const raw = (multa as any).descricaoInfra || '';
      const key = (raw || '').toString().trim() || 'Não informado';
      if (key && key !== 'Não informado') {
        classificacaoCount[key] = (classificacaoCount[key] || 0) + 1;
      }
    });
    const dadosClassificacao = Object.entries(classificacaoCount)
      .map(([classificacao, quantidade]) => ({
        classificacao: classificacao.length > 50 ? classificacao.substring(0, 50) + '...' : classificacao,
        quantidade: Number(quantidade) || 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // ? 3. DESMEMBRADO - Motivos detalhados (também por descricao_infra)
    const desmembradoCount = {} as Record<string, number>;
    multas.forEach(multa => {
      const raw = (multa as any).descricaoInfra || '';
      const motivo = (raw || '').toString().trim();
      if (motivo && motivo.length > 1) {
        desmembradoCount[motivo] = (desmembradoCount[motivo] || 0) + 1;
      }
    });
    const dadosDesmembrado = Object.entries(desmembradoCount)
      .map(([motivo, quantidade]) => ({
        motivo: motivo.length > 60 ? motivo.substring(0, 60) + '...' : motivo,
        quantidade: Number(quantidade) || 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      ;

    // ? 4. LINHA, VEÍCULO, TOTAL MULTAS (Top 10)
    const linhaVeiculoCount = {};
    multas.forEach(multa => {
      const linha = (multa as any).codigoLinha || 'Não informado';
      const veiculo = multa.prefixoVeic || 'Não informado';
      const chave = `${linha}|${veiculo}`;
      linhaVeiculoCount[chave] = (linhaVeiculoCount[chave] || 0) + 1;
    });
    const dadosLinhaVeiculo = Object.entries(linhaVeiculoCount)
      .map(([chave, totalMultas]) => {
        const [linha, veiculo] = chave.split('|');
        return {
          linha: linha || 'Não informado',
          veiculo: veiculo || 'Não informado',
          totalMultas: Number(totalMultas) || 0
        };
      })
      .sort((a, b) => b.totalMultas - a.totalMultas)
      .slice(0, 505);

    // ? 5. MULTAS POR HORÁRIO - Garantir todas as faixas e ordenar por quantidade (DEC.)
    const horarioCount = {};
    const hourRangesMapping = {
      6: '06:00 - 08:00', 7: '06:00 - 08:00',
      8: '08:00 - 10:00', 9: '08:00 - 10:00',
      10: '10:00 - 12:00', 11: '10:00 - 12:00',
      12: '12:00 - 14:00', 13: '12:00 - 14:00',
      14: '14:00 - 16:00', 15: '14:00 - 16:00',
      16: '16:00 - 18:00', 17: '16:00 - 18:00',
      18: '18:00 - 20:00', 19: '18:00 - 20:00',
      20: '20:00 - 22:00', 21: '20:00 - 22:00',
      22: '22:00 - 00:00', 23: '22:00 - 00:00',
    };

    // Inicializar todas as faixas com 0
    Object.values(hourRangesMapping).filter((v, i, a) => a.indexOf(v) === i).forEach(range => {
      horarioCount[range] = 0;
    });

    multas.forEach(multa => {
      if (multa.dataHoraMulta) {
        try {
          const date = new Date(multa.dataHoraMulta);
          const hour = date.getHours();
          const faixaHorario = hourRangesMapping[hour];
          if (faixaHorario) {
            horarioCount[faixaHorario] = (horarioCount[faixaHorario] || 0) + 1;
          }
        } catch (e) {
          console.warn('Data inválida no horário:', multa.dataHoraMulta, e);
        }
      }
    });

    const dadosHorario = Object.entries(horarioCount)
      .map(([horario, quantidade]) => ({
        horario,
        quantidade: Number(quantidade) || 0
      }))
      .sort((a, b) => b.quantidade - a.quantidade); // ? Ordena por quantidade em ordem decrescente

    // ? 6. TOTAL MULTAS, LOCAL (Top 10)
    const localCount = {};
    multas.forEach(multa => {
      const local = multa.localMulta || 'Não informado';
      localCount[local] = (localCount[local] || 0) + 1;
    });
    const dadosLocal = Object.entries(localCount)
      .map(([local, totalMultas]) => ({
        local: local || 'Não informado',
        totalMultas: Number(totalMultas) || 0
      }))
      .sort((a, b) => b.totalMultas - a.totalMultas)
      .slice(0, 505);

    return {
      dadosFiscais,
      dadosClassificacao,
      dadosDesmembrado,
      dadosLinhaVeiculo,
      dadosHorario,
      dadosLocal
    };
  }, [multas]);

  const handleFilterChange = (key, value) => {
    applyFilters({ ...filters, [key]: value });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (page === 1) {
      navigate('/departments/juridico/sufisa');
    } else if (page === 2) {
      navigate('/departments/juridico/sufisa/page2');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900/20 via-slate-900 to-yellow-900/20 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Erro ao carregar dados</h2>
          <p className="mb-4">{error}</p>
          <Button onClick={refetch} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const allCities = useMemo(() => {
    const cities = new Set();
    cities.add('Todos');
    cities.add('Gama');
    cities.add('São Sebastião');
    cities.add('Santa Maria');
    cities.add('Paranoá');
    cities.add('Outros');
    return Array.from(cities).sort();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900/20 via-slate-900 to-yellow-900/20 text-white flex flex-col">
      {/* Header com Logo, Filtros e Navegação */}
      <div className="bg-gradient-to-r from-slate-800/90 via-amber-900/30 to-slate-800/90 border-b border-amber-500/20 p-4 flex-shrink-0 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">

          {/* Layout responsivo do header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* Logo da empresa */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/departments/juridico')}
                variant="ghost"
                className="text-white hover:bg-amber-700/30 p-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              <div className="flex items-center gap-2">
                <img
                  src={logoImage}
                  alt="Viação Pioneira Logo"
                  className="w-10 h-10 object-contain rounded-lg"
                />
                <div className="hidden sm:block">
                  <h2 className="text-lg font-bold text-white">Jurídico Pioneira</h2>
                  <p className="text-xs text-amber-300">SUFISA Dashboard</p>
                </div>
              </div>
            </div>

            {/* Filtros e Navegação */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-12 mt-4 lg:mt-0">

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-200">ANO:</span>
                  <Select value={filters.ano} onValueChange={(value) => handleFilterChange('ano', value)}>
                    <SelectTrigger className="w-24 bg-slate-700/80 border-amber-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-amber-500/30">
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-200">MÊS:</span>
                  <Select value={filters.mes} onValueChange={(value) => handleFilterChange('mes', value)}>
                    <SelectTrigger className="w-32 bg-slate-700/80 border-amber-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-amber-500/30">
                      <SelectItem value="Todos">Todos</SelectItem>
                      <SelectItem value="Janeiro">Janeiro</SelectItem>
                      <SelectItem value="Fevereiro">Fevereiro</SelectItem>
                      <SelectItem value="Março">Março</SelectItem>
                      <SelectItem value="Abril">Abril</SelectItem>
                      <SelectItem value="Maio">Maio</SelectItem>
                      <SelectItem value="Junho">Junho</SelectItem>
                      <SelectItem value="Julho">Julho</SelectItem>
                      <SelectItem value="Agosto">Agosto</SelectItem>
                      <SelectItem value="Setembro">Setembro</SelectItem>
                      <SelectItem value="Outubro">Outubro</SelectItem>
                      <SelectItem value="Novembro">Novembro</SelectItem>
                      <SelectItem value="Dezembro">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-200">CIDADE:</span>
                  <Select value={filters.cidade} onValueChange={(value) => handleFilterChange('cidade', value)}>
                    <SelectTrigger className="w-36 bg-slate-700/80 border-amber-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-amber-500/30">
                      {allCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ? TOTAL Card - Estilo Power BI */}
              <div className="flex items-center gap-2 bg-yellow-500/90 border border-yellow-400/50 rounded-lg p-2 text-black shadow-lg">

                <div className="text-sm font-bold text-black-100 uppercase tracking-wider">TOTAL</div>
                <div className="text-1xsm font-extrabold text-black">
                  {loading ? '-' : multas.length}
                </div>

              </div>

              {/* Navegação entre páginas */}
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <span className="text-sm text-amber-200">Página:</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-white hover:bg-amber-700/30 p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex gap-1">
                    {[1, 2, 3].map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 p-0 ${currentPage === page
                          ? 'bg-amber-600 text-white'
                          : 'text-white hover:bg-amber-700/30'
                          }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === 3}
                    className="text-white hover:bg-amber-700/30 p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - Página 3 */}
      <div className="flex-1 flex flex-col px-4 lg:px-8 py-6 space-y-6 w-full">

        {/* ? PRIMEIRA LINHA: 3 Gráficos Horizontais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

          {/* 1. FISCAIS - Gráfico Horizontal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex flex-col h-full">
              <CardHeader className="flex-shrink-0 pb-4">
                <CardTitle className="text-white text-center">FISCAIS</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-3 overflow-y-auto max-h-[360px]">
                {loading ? (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : processedData?.dadosFiscais?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, processedData.dadosFiscais.length * 30 + 60)}>
                    <BarChart
                      data={processedData.dadosFiscais}
                      layout="vertical"
                      margin={{ top: 5, right: 40, left: -55, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#E5E7EB" hide />
                      <YAxis
                        type="category"
                        dataKey="fiscal"
                        stroke="#E5E7EB"
                        width={200}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFE',
                          border: '1px solid #374151',
                          color: '#ffffff'
                        }}
                      />
                      {/* ? Cor da barra alterada para cinza claro (estilo Power BI) */}
                      <Bar dataKey="quantidade" fill="#e5c101">
                        <LabelList content={<CustomHorizontalLabel />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <p className="text-gray-400">Nenhum dado de fiscais encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 2. CLASSIFICAÇÃO - Gráfico Horizontal com Scroll */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex flex-col h-full">
              <CardHeader className="flex-shrink-0 pb-4">
                <CardTitle className="text-white text-center">CLASSIFICAÇÃO</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 overflow-y-auto max-h-[360px]">
                {loading ? (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : processedData?.dadosClassificacao?.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(300, processedData.dadosClassificacao.length * 35 + 60)}
                  >
                    <BarChart
                      data={processedData.dadosClassificacao}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: -45, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#E5E7EB" hide />
                      <YAxis
                        type="category"
                        dataKey="classificacao"
                        stroke="#E5E7EB"
                        width={200}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #374151',
                          color: '#ffffff'
                        }}
                      />
                      {/* ? Cor da barra alterada para cinza claro (estilo Power BI) */}
                      <Bar dataKey="quantidade" fill="#e5c101">
                        <LabelList content={<CustomHorizontalLabel />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <p className="text-gray-400">Nenhum dado de classificação encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 3. DESMEMBRADO - Gráfico Horizontal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex flex-col h-full">
              <CardHeader className="flex-shrink-0 pb-4">
                <CardTitle className="text-white text-center">DESMEMBRADO</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 overflow-y-auto max-h-[360px]">
                {loading ? (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : processedData?.dadosDesmembrado?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(300, processedData.dadosDesmembrado.length * 35 + 60)}>
                    <BarChart
                      data={processedData.dadosDesmembrado}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: -35, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#E5E7EB" hide />
                      <YAxis
                        type="category"
                        dataKey="motivo"
                        stroke="#E5E7EB"
                        width={200}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #374151',
                          color: '#ffffff'
                        }}
                      />
                      {/* ? Cor da barra alterada para cinza claro (estilo Power BI) */}
                      <Bar dataKey="quantidade" fill="#e5c101">
                        <LabelList content={<CustomHorizontalLabel />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <p className="text-gray-400">Nenhum motivo válido encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ? SEGUNDA LINHA: 3 Blocos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">

          {/* 4. LINHA, VEÍCULO, TOTAL MULTAS - Tabela */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex flex-col h-full">

              <CardContent className="flex-1  ">
                {loading ? (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : processedData?.dadosLinhaVeiculo?.length > 0 ? (
                  <div className="space-y-2">
                    {/* Gráfico horizontal com rolagem para Linha/Veículo/Total */}
                    <ResponsiveContainer
                      width="100%"
                      height={0}
                    >
                      <BarChart
                        data={[]}
                        layout="vertical"
                        margin={{ top: 5, right: 50, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#E5E7EB" hide />
                        <YAxis
                          type="category"
                          dataKey="label"
                          stroke="#E5E7EB"
                          width={120}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #374151',
                            color: '#ffffff'
                          }}
                        />
                        <Bar dataKey="totalMultas" fill="#e5c101">
                          <LabelList content={<CustomHorizontalLabel />} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {/* ? Header da tabela com fundo destacado (estilo Power BI) */}
                    <div className="grid grid-cols-3 gap-2 font-bold text-white text-sm border-b border-amber-500/30 pb-2 bg-slate-700/70 p-3 rounded-lg">
                      <div>LINHA</div>
                      <div>VEÍCULO</div>
                      <div>TOTAL</div>
                    </div>
                    {/* Dados da tabela com scroll vertical */}
                    <div className="overflow-y-auto max-h-[320px] space-y-1">
                      {processedData.dadosLinhaVeiculo.map((item, index) => (
                        <div key={index} className="grid grid-cols-3 gap-2 text-white text-sm py-2 border-b border-slate-600/30 hover:bg-slate-700/30 rounded px-2">
                          <div className="truncate">{item.linha}</div>
                          <div className="truncate">{item.veiculo}</div>
                          <div className="font-bold text-amber-300">{item.totalMultas}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <p className="text-gray-400">Nenhum dado de linha/veículo encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 5. MULTAS POR HORÁRIO - Gráfico Vertical */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex flex-col h-full">
              <CardHeader className="flex-shrink-0 pb-4">
                <CardTitle className="text-white text-center">MULTAS POR HORÁRIO</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 overflow-y-auto max-h-[360px]">
                {loading ? (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : processedData?.dadosHorario?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                    <BarChart
                      data={processedData.dadosHorario}
                      margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="horario"
                        stroke="#E5E7EB"
                        interval={0}
                        tick={<CustomAxisTick />}

                        height={10}

                      />
                      <YAxis stroke="#E5E7EB" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #374151',
                          color: '#ffffff'
                        }}
                      />
                      {/* ? Cor da barra alterada para cinza claro (estilo Power BI) */}
                      <Bar dataKey="quantidade" fill="#e5c101">
                        <LabelList content={<CustomLabel />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <p className="text-gray-400">Nenhum dado de horário encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 6. TOTAL MULTAS, LOCAL - Tabela */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex flex-col h-full">
              <div className='flex-1'>

              </div>
              <CardContent className="flex-1  ">
                {loading ? (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : processedData?.dadosLocal?.length > 0 ? (
                  <div className="space-y-2">
                    {/* ? Header da tabela com fundo destacado (estilo Power BI) */}
                    <div className="grid grid-cols-2 gap-2 font-bold text-white text-sm border-b border-amber-500/30 pb-2 bg-slate-700/70 p-3 rounded-lg">
                      <div className="text-center">TOTAL MULTAS</div>
                      <div>LOCAL</div>
                    </div>
                    {/* Dados da tabela com scroll vertical */}
                    <div className="overflow-y-auto max-h-[327px] space-y-1">
                      {processedData.dadosLocal.map((item, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2 text-white text-sm py-2 border-b border-slate-600/30 hover:bg-slate-700/30 rounded px-2">
                          <div className="font-bold text-amber-300 text-center">{item.totalMultas}</div>
                          <div className="truncate text-xs">{item.local}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full max-h-[200px]">
                    <p className="text-gray-400">Nenhum dado de local encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center space-y-4">
              <RefreshCw className="w-12 h-12 animate-spin text-amber-400 mx-auto" />
              <p className="text-xl text-amber-200">Carregando dados da página 3...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

