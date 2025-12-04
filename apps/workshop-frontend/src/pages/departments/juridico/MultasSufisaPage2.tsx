// src/pages/departments/juridico/MultasSufisaPage2.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  HandCoins,
  FileText,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Target,
  AlertTriangle,
  Building
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Componente customizado para labels fixas e visíveis - COR BRANCA
const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;

  return (
    <text
      x={x + width / 2}
      y={y - 15}
      fill="#FFFFFF"  // COR BRANCA
      textAnchor="middle"
      fontSize="18" // Reduzido para mobile
      fontWeight="bold"
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
};

// Componente customizado para quebrar texto nos eixos - RESPONSIVO
const CustomAxisTick = (props) => {
  const { x, y, payload } = props;
  const text = payload.value;
  const maxCharsPerLine = window.innerWidth < 768 ? 8 : 15; // Menos caracteres em mobile

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
          y={index * 10} // Reduzido para mobile
          dy={16}
          textAnchor="middle"
          fill="#E5E7EB"
          fontSize={window.innerWidth < 768 ? "10" : "12"} // Menor em mobile
          fontWeight="normal"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// Função para formatar valores
const formatCurrency = (value) => {
  return parseFloat(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const formatCurrencyK = (value) => { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

// Hook para buscar dados SUFISA (mesmo da página 1)
const useMultasSufisa = () => {
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState<any>({
    ano: 'Todos',
    mes: 'Todos',
    cidade: 'Todos',
    prefixoVeiculo: '',
    agenteCodigo: '',
    localMulta: '',
    descricaoInfra: '',
    codigoInfracao: '',
    dataInicio: '',
    dataFim: '',
    linha: '',
    setor: ''
  });
  const [anosDisponiveis, setAnosDisponiveis] = useState<string[]>(['Todos']);

  // Função para mapear locais para cidades (normalizado)
  const mapearCidade = (entrada) => {
    if (!entrada) return 'Outros';
    try {
      const normalized = entrada.toString().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes('GAMA')) return 'Gama';
      if (normalized.includes('PARANOA')) return 'Paranoá';
      if (normalized.includes('SAO SEBASTIAO')) return 'São Sebastião';
      if (normalized.includes('SANTA MARIA')) return 'Santa Maria';
      return 'Outros';
    } catch {
      const base = entrada.toString().toUpperCase();
      if (base.includes('GAMA')) return 'Gama';
      if (base.includes('PARANOA')) return 'Paranoá';
      if (base.includes('SAO SEBASTIAO')) return 'São Sebastião';
      if (base.includes('SANTA MARIA')) return 'Santa Maria';
      return 'Outros';
    }
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
      try { console.log('[LEGAL][SUFISA][UI2] fetch start with filters:', newFilters); } catch { }
      const response = await multasSufisaService.buscarMultasSufisa(newFilters);
      if (response.success) {
        let multasSufisa = response.data;
        // Aplicar filtros adicionais (já aplicados no serviço em grande parte)
        const normalize = (s: any) => { if (!s) return ''; try { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); } catch { return String(s).toUpperCase(); } };
        const termoDesc = normalize((newFilters as any)?.descricaoInfra || '');
        if (termoDesc) { multasSufisa = multasSufisa.filter((m: any) => normalize(m.descricaoInfra).includes(termoDesc)); }
        const mapped = multasSufisa.map(m => ({ ...m, codigoInfra: (m as any).codigoInfracao, cidadeMapeada: mapearCidade(m.localMulta) }));
        setMultas(mapped);
        try { console.log('[LEGAL][SUFISA][UI2] fetched count:', mapped.length); } catch { }
        try {
          const anos = Array.from(new Set((response.data || []).map((m: any) => new Date(((m as any).dataEmissaoMulta || (m as any).dataHoraMulta)).getFullYear().toString())))
            .sort((a: string, b: string) => parseInt(b) - parseInt(a));
          setAnosDisponiveis(['Todos', ...anos]);
          console.log('[LEGAL][SUFISA][UI2] anosDisponiveis:', ['Todos', ...anos]);
        } catch { }
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
    anosDisponiveis,
    applyFilters,
    refetch: () => fetchMultas(filters)
  };
};

export default function MultasSufisaPage2() {
  const navigate = useNavigate();
  const { multas, loading, error, filters, anosDisponiveis, applyFilters, refetch } = useMultasSufisa();
  const [currentPage, setCurrentPage] = useState(2); // Página 2

  // Processar dados específicos para a página 2
  const processedData = useMemo(() => {
    if (!multas.length) return null;

    const normalize = (s: string) => {
      if (!s) return '';
      try { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); } catch { return s.toUpperCase(); }
    };
    const condenseDescricao = (raw: string) => {
      const t = normalize(raw);
      const rules: Array<{ test: RegExp; label: string }> = [
        { test: /FURO\s+DE\s+VIAGEM/, label: 'Furo de viagem' },
        { test: /NAO\s+FAVORECER\s+EMBARQUE/, label: 'Não favorecer embarque' },
        { test: /NAO\s+CUMPRIR\s+ORDEM\s+DE\s+SERVICO|N[AÃ]O\s+CUMPRIR\s+ORDEM\s+DE\s+SERVICO/, label: 'Não cumprir ordem de serviço' },
        { test: /ATRASO|ATRASADA|ATRASO\s+DE\s+VIAGEM/, label: 'Atraso de viagem' },
        { test: /PARADA\s+IRREGULAR|PARAR\s+EM\s+LOCAL\s+PROIBIDO/, label: 'Parada irregular' },
        { test: /EXCESSO\s+DE\s+VELOCIDADE|VELOCIDADE/, label: 'Excesso de velocidade' },
      ];
      for (const r of rules) { if (r.test.test(t)) return r.label; }
      // fallback: primeiras 3 palavras
      const trimmed = (raw || '').toString().trim();
      return trimmed.split(' ').slice(0, 7).join(' ');
    };

    // Estatísticas gerais
    const totalMultas = multas.length;
    const valorTotal = multas.reduce((sum, m) => sum + parseFloat(m.valorMulta || 0), 0);

    // Veículo/Linha mais multado
    const veiculosCount = {};
    multas.forEach(multa => {
      const veiculo = multa.prefixoVeic || 'Não informado';
      veiculosCount[veiculo] = (veiculosCount[veiculo] || 0) + 1;
    });
    const veiculoMaisMultado = Object.entries(veiculosCount)
      .sort(([, a], [, b]) => b - a)[0];

    // Horário com mais multas
    const horariosCount = {};
    multas.forEach(multa => {
      if (multa.dataHoraMulta) {
        const hora = new Date(multa.dataHoraMulta).getHours();
        const faixaHorario = `${hora.toString().padStart(2, '0')}:00 - ${(hora + 1).toString().padStart(2, '0')}:00`;
        horariosCount[faixaHorario] = (horariosCount[faixaHorario] || 0) + 1;
      }
    });
    const horarioMaisMultas = Object.entries(horariosCount)
      .sort(([, a], [, b]) => b - a)[0];

    // Local com mais infrações
    const locaisCount = {};
    multas.forEach(multa => {
      const local = multa.localMulta || 'Não informado';
      // Pegar apenas as primeiras palavras para não ficar muito longo
      const localResumido = local.split(' ').slice(0, 6).join(' ');
      locaisCount[localResumido] = (locaisCount[localResumido] || 0) + 1;
    });
    const localMaisInfracoes = Object.entries(locaisCount)
      .sort(([, a], [, b]) => b - a)[0];

    // Maior fiscalização (agente)
    const agentesCount = {};
    multas.forEach(multa => {
      const agente = multa.agenteDescricao || multa.agenteCodigo || 'Não informado';
      agentesCount[agente] = (agentesCount[agente] || 0) + 1;
    });
    const maiorFiscalizacao = Object.entries(agentesCount)
      .sort(([, a], [, b]) => b - a)[0];

    // USAR A COLUNA CORRETA: codigo_infra (codigoInfra no banco)
    const codigosCount = {};
    multas.forEach(multa => {
      // Usar codigoInfra que é a coluna codigo_infra do banco
      const codigo = multa.codigoInfra || 'Não informado';
      if (codigo && codigo !== 'Não informado') {
        codigosCount[codigo] = (codigosCount[codigo] || 0) + 1;
      }
    });
    const maiorCodigoInfracao = Object.entries(codigosCount)
      .sort(([, a], [, b]) => b - a)[0];

    // Data com mais infrações
    const datasCount = {};
    multas.forEach(multa => {
      const base = (multa as any).dataEmissaoMulta || multa.dataHoraMulta;
      if (base) {
        const data = new Date(base).toLocaleDateString('pt-BR');
        datasCount[data] = (datasCount[data] || 0) + 1;
      }
    });
    const dataMaisInfracoes = Object.entries(datasCount)
      .sort(([, a], [, b]) => b - a)[0];

    // Maior classificação
    const classificacoesCount = {};
    multas.forEach(multa => {
      const classificacao = multa.grupoInfracao || 'DEFEITO';
      classificacoesCount[classificacao] = (classificacoesCount[classificacao] || 0) + 1;
    });
    const maiorClassificacao = Object.entries(classificacoesCount)
      .sort(([, a], [, b]) => b - a)[0];

    // ANÁLISE DE MOTIVOS: usar descricao_infra condensada
    const motivosCount: Record<string, number> = {};
    multas.forEach(multa => {
      const k = condenseDescricao(multa.descricaoInfra || '');
      if (k && k.length > 1 && k.toUpperCase() !== 'OUTROS') {
        motivosCount[k] = (motivosCount[k] || 0) + 1;
      }
    });
    const maiorOcorrenciaMotivo = Object.entries(motivosCount)
      .sort(([, a], [, b]) => b - a)[0];

    // DADOS PARA GRÁFICO: Filtrar apenas motivos com nome válido
    const dadosGraficoMotivos = Object.entries(motivosCount)
      .map(([motivo, quantidade]) => ({
        motivo,
        motivoCompleto: motivo,
        quantidade,
        valor: quantidade * 990
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10); // Top 10

    // Linha (código) com mais multas (codigolinha)
    const linhasCount: Record<string, number> = {};
    multas.forEach(m => {
      const cod = (m as any).codigoLinha || '';
      if (cod) linhasCount[cod] = (linhasCount[cod] || 0) + 1;
    });
    const linhaMaisMultada = Object.entries(linhasCount).sort(([, a], [, b]) => (b as number) - (a as number))[0];

    return {
      totalMultas,
      valorTotal,
      veiculoMaisMultado: veiculoMaisMultado ? { nome: veiculoMaisMultado[0], quantidade: veiculoMaisMultado[1] } : null,
      horarioMaisMultas: horarioMaisMultas ? { nome: horarioMaisMultas[0], quantidade: horarioMaisMultas[1] } : null,
      localMaisInfracoes: localMaisInfracoes ? { nome: localMaisInfracoes[0], quantidade: localMaisInfracoes[1] } : null,
      maiorFiscalizacao: maiorFiscalizacao ? { nome: maiorFiscalizacao[0], quantidade: maiorFiscalizacao[1] } : null,
      maiorCodigoInfracao: maiorCodigoInfracao ? { codigo: maiorCodigoInfracao[0], quantidade: maiorCodigoInfracao[1] } : null,
      linhaMaisMultada: linhaMaisMultada ? { codigo: linhaMaisMultada[0], quantidade: linhaMaisMultada[1] } : null,
      dataMaisInfracoes: dataMaisInfracoes ? { data: dataMaisInfracoes[0], quantidade: dataMaisInfracoes[1] } : null,
      maiorClassificacao: maiorClassificacao ? { nome: maiorClassificacao[0], quantidade: maiorClassificacao[1] } : null,
      maiorOcorrenciaMotivo: maiorOcorrenciaMotivo ? { nome: maiorOcorrenciaMotivo[0], quantidade: maiorOcorrenciaMotivo[1] } : null,
      dadosGraficoMotivos
    };
  }, [multas]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    applyFilters(newFilters);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (page === 1) {
      navigate('/departments/juridico/sufisa');
    } else if (page === 3) {
      navigate('/departments/juridico/sufisa/page3'); // NAVEGAÇÃO PARA PÁGINA 3
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900/20 via-slate-900 to-yellow-900/20 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Erro ao carregar dados</h2>
          <p className="mb-4 text-sm sm:text-base">{error}</p>
          <Button onClick={refetch} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900/20 via-slate-900 to-yellow-900/20 text-white flex flex-col">
      {/* Header com Logo, Filtros e Navegação - RESPONSIVO */}
      <div className="bg-gradient-to-r from-slate-800/90 via-amber-900/30 to-slate-800/90 border-b border-amber-500/20 p-2 sm:p-4 flex-shrink-0 backdrop-blur-sm">
        <div className="container mx-auto">

          {/* Layout responsivo: stack em mobile, horizontal em desktop */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-4">

            {/* Logo da empresa */}
            <div className="flex items-center gap-2 sm:gap-4 order-1 lg:order-1">
              <Button
                onClick={() => navigate('/departments/juridico')}
                variant="ghost"
                className="text-white hover:bg-amber-700/30 p-1 sm:p-2"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>

              {/* Logo Real */}
              <div className="flex items-center gap-1 sm:gap-2">
                <img
                  src={logoImage}
                  alt="Viação Pioneira Logo"
                  className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-contain rounded-lg"
                />
                <div className="hidden sm:block">
                  <h2 className="text-sm lg:text-lg font-bold text-white">Viação Pioneira</h2>
                  <p className="text-xs text-amber-300">SUFISA Dashboard</p>
                </div>
              </div>
            </div>

            {/* Filtros - Stack em mobile, horizontal em desktop */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 order-3 lg:order-2 w-full lg:w-auto">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-amber-200">Ano:</span>
                <Select value={filters.ano} onValueChange={(value) => handleFilterChange('ano', value)}>
                  <SelectTrigger className="w-16 sm:w-20 lg:w-24 bg-slate-700/80 border-amber-500/30 text-white text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-amber-500/30">
                    {anosDisponiveis.map((ano) => (
                      <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-amber-200">Mês:</span>
                <Select value={filters.mes} onValueChange={(value) => handleFilterChange('mes', value)}>
                  <SelectTrigger className="w-20 sm:w-24 lg:w-32 bg-slate-700/80 border-amber-500/30 text-white text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-amber-500/30">
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Janeiro">Jan</SelectItem>
                    <SelectItem value="Fevereiro">Fev</SelectItem>
                    <SelectItem value="Março">Mar</SelectItem>
                    <SelectItem value="Abril">Abr</SelectItem>
                    <SelectItem value="Maio">Mai</SelectItem>
                    <SelectItem value="Junho">Jun</SelectItem>
                    <SelectItem value="Julho">Jul</SelectItem>
                    <SelectItem value="Agosto">Ago</SelectItem>
                    <SelectItem value="Setembro">Set</SelectItem>
                    <SelectItem value="Outubro">Out</SelectItem>
                    <SelectItem value="Novembro">Nov</SelectItem>
                    <SelectItem value="Dezembro">Dez</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-amber-200">Cidade:</span>
                <Select value={filters.cidade} onValueChange={(value) => handleFilterChange('cidade', value)}>
                  <SelectTrigger className="w-24 sm:w-28 lg:w-36 bg-slate-700/80 border-amber-500/30 text-white text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-amber-500/30">
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Gama">Gama</SelectItem>
                    <SelectItem value="São Sebastião">S. Sebastião</SelectItem>
                    <SelectItem value="Santa Maria">S. Maria</SelectItem>
                    <SelectItem value="Paranoá">Paranoá</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-amber-200">Descrição:</span>
                <Input
                  className="bg-slate-700/80 border-amber-500/30 text-white text-xs sm:text-sm"
                  placeholder="Ex: Parada em local proibido"
                  value={filters.descricaoInfra}
                  onChange={(e) => handleFilterChange('descricaoInfra', e.target.value)}
                />
              </div>
            </div>

            {/* Navegação entre páginas */}
            <div className="flex items-center gap-1 sm:gap-2 order-2 lg:order-3">
              <span className="text-xs sm:text-sm text-amber-200 hidden sm:inline">Página:</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-white hover:bg-amber-700/30 p-1 sm:p-2"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>

                <div className="flex gap-1">
                  {[1, 2, 3].map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={`w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${currentPage === page
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
                  className="text-white hover:bg-amber-700/30 p-1 sm:p-2"
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - RESPONSIVO */}
      <div className="flex-1 flex flex-col mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 gap-3 sm:gap-1 w-full max-w-screen-3xl overflow-hidden">

        {/* PRIMEIRA LINHA HORIZONTAL: Veículo/Linha, Horário, Local, Fiscal - RESPONSIVO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 flex-1">

          {/* Veículo / Linha */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-400 text-base sm:text-lg lg:text-xl">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Veículo / Linha</span>
                  <span className="sm:hidden">Veículo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">
                  {loading ? '...' : ` ${processedData?.veiculoMaisMultado?.nome || '...'} /  ${processedData?.linhaMaisMultada?.codigo || '...'}`}
                </div>
                <div className="text-base sm:text-xl lg:text-2xl text-amber-300">
                  {`${processedData?.veiculoMaisMultado?.quantidade || 0} multas`}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Horário mais multas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-400 text-base sm:text-lg lg:text-xl">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Horário mais multas</span>
                  <span className="sm:hidden">Horário</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : processedData?.horarioMaisMultas?.nome || '06:00 - 08:00'}
                </div>
                <div className="text-sm sm:text-lg text-amber-300">
                  {processedData?.horarioMaisMultas?.quantidade || 0} multas
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Local com mais infrações */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-red-400 text-base sm:text-lg lg:text-xl">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Local com mais infrações</span>
                  <span className="sm:hidden">Local</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm sm:text-lg font-bold text-white break-words">
                  {loading ? '...' : processedData?.localMaisInfracoes?.nome || 'TERMINAL DE SÃO SEBASTIÃO'}
                </div>
                <div className="text-sm sm:text-lg text-amber-300">
                  {processedData?.localMaisInfracoes?.quantidade || 0} infrações
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Maior fiscalização */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-indigo-400 text-base sm:text-lg lg:text-xl">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Maior fiscalização</span>
                  <span className="sm:hidden">Fiscal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm sm:text-lg font-bold text-white break-words">
                  {loading ? '...' : processedData?.maiorFiscalizacao?.nome || 'MARCELA MALDONADO'}
                </div>
                <div className="text-sm sm:text-lg text-amber-300">
                  {processedData?.maiorFiscalizacao?.quantidade || 0} fiscalizações
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* SEGUNDA LINHA HORIZONTAL: Valor Total, Código Infração, Data, Classificação, Motivo - RESPONSIVO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 lg:gap-6 flex-1">

          {/* Valor Total */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-green-400 text-sm sm:text-base lg:text-lg">
                  <HandCoins className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">Valor Total</span>
                  <span className="sm:hidden">Valor</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-base sm:text-lg lg:text-xl font-bold text-white break-words">
                  {loading ? '...' : formatCurrencyK(processedData?.valorTotal || 0)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Maior Cód. Infração */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-amber-600/30 to-yellow-600/30 border-amber-400/50 backdrop-blur-sm">
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-amber-200 text-sm sm:text-base lg:text-lg">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Maior Cód. Infração</span>
                  <span className="lg:hidden">Código</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-3">
                <div className="flex items-center justify-center gap-2 text-base sm:text-lg lg:text-sm font-bold text-white break-words">
                  <span>{processedData?.maiorCodigoInfracao?.codigo || '—'}</span>
                  <span className="text-amber-300">/</span>
                  <span className="text-amber-300">{processedData?.maiorCodigoInfracao?.quantidade || 0} ocorrências</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data mais Infrações */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
           <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-cyan-400 text-sm sm:text-base lg:text-lg">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Data mais Infrações</span>
                  <span className="lg:hidden">Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-3">
                <div className="flex items-center justify-center gap-2 text-base sm:text-lx lg:text-lx font-bold text-white break-words">
                  <span>{loading ? '...' : processedData?.dataMaisInfracoes?.data || '25/03/2025'}</span>
                  <span className="text-amber-300">/</span>
                  <span className="text-amber-300">{processedData?.dataMaisInfracoes?.quantidade || 0} infrações</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Maior Classificação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
             <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="flex items-center gap-1 sm:gap-2 text-pink-400 text-sm sm:text-base lg:text-lg">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden lg:inline">Maior Classificação</span>
                    <span className="lg:hidden">Classificação</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pt-3">
                  <div className="flex items-center justify-center gap-2 text-sm sm:text-sm  lg:text-sm font-bold text-white break-words">
                    <span>{loading ? '...' : processedData?.maiorClassificacao?.nome || 'DEFEITO'}</span>
                    <span className="text-amber-300">/</span>
                    <span className="text-amber-300">{processedData?.maiorClassificacao?.quantidade || 0} ocorrências</span>
                  </div>
                </CardContent>
              </Card>
          </motion.div>

          {/* Maior ocorrência - Motivo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="col-span-2 sm:col-span-1"
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-emerald-400 text-sm sm:text-base lg:text-lx">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Maior ocorrência - Motivo</span>
                  <span className="lg:hidden">Motivo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-3">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm  lg:text-base font-bold text-white break-words leading-tight">
                  <span>{loading ? '...' : processedData?.maiorOcorrenciaMotivo?.nome || 'FURO DE VIAGEM'}</span>
                  <span className="text-amber-300">/</span>
                  <span className="text-amber-300">{processedData?.maiorOcorrenciaMotivo?.quantidade || 0} ocorrências</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* GRÁFICO DE BARRAS DOS MOTIVOS - RESPONSIVO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex-1"
        >
          <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex-1 flex flex-col">
            <CardHeader className="flex-shrink-0 p-3 sm:p-6">
              <CardTitle className="text-white text-base sm:text-lg lg:text-xl">ANÁLISE DE MOTIVOS DE INFRAÇÃO</CardTitle>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-400 rounded"></div>
                  <span className="text-amber-200">Quantidade de Multas</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {loading ? (
                <div className="flex justify-center items-center h-full min-h-[220px] sm:min-h-[335px]">
                  <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                </div>
              ) : processedData?.dadosGraficoMotivos?.length > 0 ? (
                <ResponsiveContainer width="100%" height={435}>
                  <BarChart
                    data={processedData.dadosGraficoMotivos}
                    margin={{
                      top: 5,
                      right: window.innerWidth < 768 ? 12 : 30,
                      left: window.innerWidth < 768 ? 12 : 20,
                      bottom: -10
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="motivo"
                      stroke="#E5E7EB"
                      height={window.innerWidth < 768 ? 80 : 100}
                      interval={0}
                      fontSize={window.innerWidth < 768 ? 12 : 15}
                      tick={<CustomAxisTick />}
                    />
                    <YAxis stroke="#E5E7EB" fontSize={window.innerWidth < 768 ? 14 : 16} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #374151',
                        color: '#ffffff',
                        fontSize: window.innerWidth < 768 ? '14px' : '16px'
                      }}
                      formatter={(value, name, props) => [
                        `${value} multas`,
                        'Quantidade'
                      ]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return payload[0].payload.motivoCompleto;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="quantidade" fill="#FACC15">
                      <LabelList
                        content={<CustomLabel />}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full min-h-[200px] sm:min-h-[400px]">
                  <p className="text-gray-400 text-sm sm:text-base">Nenhum motivo válido encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-8 sm:py-16">
            <div className="text-center space-y-4">
              <RefreshCw className="w-8 h-8 sm:w-12 sm:h-12 animate-spin text-amber-400 mx-auto" />
              <p className="text-lg sm:text-xl text-amber-200">Carregando dados da página 2...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





