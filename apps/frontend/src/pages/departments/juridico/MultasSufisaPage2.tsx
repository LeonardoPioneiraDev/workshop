// src/pages/departments/juridico/MultasSufisaPage2.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Importar logo
import logoImage from '@/assets/logo.png';

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

// ✅ Componente customizado para labels fixas e visíveis - COR BRANCA
const CustomLabel = (props) => {
  const { x, y, width, height, value } = props;
  
  return (
    <text 
      x={x + width / 2} 
      y={y - 5} 
      fill="#FFFFFF"  // ✅ COR BRANCA
      textAnchor="middle" 
      fontSize="10" // Reduzido para mobile
      fontWeight="bold"
      dominantBaseline="middle"
    >
      {value}
    </text>
  );
};

// ✅ Componente customizado para quebrar texto nos eixos - RESPONSIVO
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
          fontSize={window.innerWidth < 768 ? "7" : "9"} // Menor em mobile
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

const formatCurrencyK = (value, useThousandsAbbreviation = true) => {
  if (useThousandsAbbreviation && Math.abs(value) >= 1000) {
    const formatted = (value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    return `R$ ${formatted}k`;
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Hook para buscar dados SUFISA (mesmo da página 1)
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
        localUpper.includes('TERMINAL RODOVIARIO DO PARANOA') ||
        localUpper.includes('TERMINAL DE SÃO SEBASTIÃO')) {
      return 'Paranoá';
    }
    
    if (localUpper.includes('SÃO SEBASTIÃO') && !localUpper.includes('TERMINAL DE SÃO SEBASTIÃO')) {
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
      const response = await fetch('http://localhost:3336/juridico/multas-completas?limit=10000');
      const data = await response.json();

      if (data.success) {
        let multasSufisa = data.data.filter(isMultaSufisa);
        
        // Aplicar filtros
        if (newFilters.ano && newFilters.ano !== 'Todos') {
          multasSufisa = multasSufisa.filter(m => 
            new Date(m.dataHoraMulta).getFullYear().toString() === newFilters.ano
          );
        }
        
        if (newFilters.mes && newFilters.mes !== 'Todos') {
          const mesNumero = {
            'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04',
            'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08',
            'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12'
          }[newFilters.mes];
          
          if (mesNumero) {
            multasSufisa = multasSufisa.filter(m => 
              (new Date(m.dataHoraMulta).getMonth() + 1).toString().padStart(2, '0') === mesNumero
            );
          }
        }
        
        if (newFilters.cidade && newFilters.cidade !== 'Todos') {
          multasSufisa = multasSufisa.filter(m => {
            const cidadeMapeada = mapearCidade(m.localMulta);
            return cidadeMapeada === newFilters.cidade;
          });
        }
        
        // Adicionar cidade mapeada a cada multa
        multasSufisa = multasSufisa.map(multa => ({
          ...multa,
          cidadeMapeada: mapearCidade(multa.localMulta)
        }));
        
        setMultas(multasSufisa);
      } else {
        throw new Error(data.message || 'Erro ao carregar multas SUFISA');
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

export default function MultasSufisaPage2() {
  const navigate = useNavigate();
  const { multas, loading, error, filters, applyFilters, refetch } = useMultasSufisa();
  const [currentPage, setCurrentPage] = useState(2); // Página 2

  // Processar dados específicos para a página 2
  const processedData = useMemo(() => {
    if (!multas.length) return null;

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
      .sort(([,a], [,b]) => b - a)[0];

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
      .sort(([,a], [,b]) => b - a)[0];

    // Local com mais infrações
    const locaisCount = {};
    multas.forEach(multa => {
      const local = multa.localMulta || 'Não informado';
      // Pegar apenas as primeiras palavras para não ficar muito longo
      const localResumido = local.split(' ').slice(0, 3).join(' ');
      locaisCount[localResumido] = (locaisCount[localResumido] || 0) + 1;
    });
    const localMaisInfracoes = Object.entries(locaisCount)
      .sort(([,a], [,b]) => b - a)[0];

    // Maior fiscalização (agente)
    const agentesCount = {};
    multas.forEach(multa => {
      const agente = multa.agenteDescricao || multa.agenteCodigo || 'Não informado';
      agentesCount[agente] = (agentesCount[agente] || 0) + 1;
    });
    const maiorFiscalizacao = Object.entries(agentesCount)
      .sort(([,a], [,b]) => b - a)[0];

    // ✅ USAR A COLUNA CORRETA: codigo_infra (codigoInfra no banco)
    const codigosCount = {};
    multas.forEach(multa => {
      // Usar codigoInfra que é a coluna codigo_infra do banco
      const codigo = multa.codigoInfra || 'Não informado';
      if (codigo && codigo !== 'Não informado') {
        codigosCount[codigo] = (codigosCount[codigo] || 0) + 1;
      }
    });
    const maiorCodigoInfracao = Object.entries(codigosCount)
      .sort(([,a], [,b]) => b - a)[0];

    // Data com mais infrações
    const datasCount = {};
    multas.forEach(multa => {
      if (multa.dataHoraMulta) {
        const data = new Date(multa.dataHoraMulta).toLocaleDateString('pt-BR');
        datasCount[data] = (datasCount[data] || 0) + 1;
      }
    });
    const dataMaisInfracoes = Object.entries(datasCount)
      .sort(([,a], [,b]) => b - a)[0];

    // Maior classificação
    const classificacoesCount = {};
    multas.forEach(multa => {
      const classificacao = multa.grupoInfracao || 'DEFEITO';
      classificacoesCount[classificacao] = (classificacoesCount[classificacao] || 0) + 1;
    });
    const maiorClassificacao = Object.entries(classificacoesCount)
      .sort(([,a], [,b]) => b - a)[0];

    // ✅ MAIOR OCORRÊNCIA - MOTIVO: Filtrar apenas com nome válido, sem "OUTROS"
    const motivosCount = {};
    multas.forEach(multa => {
      const motivo = multa.observacaoRealMotivo;
      // ✅ Só considerar se tem nome válido e não é vazio/nulo
      if (motivo && 
          motivo.trim() !== '' && 
          motivo.toUpperCase() !== 'OUTROS' &&
          motivo.toUpperCase() !== 'OUTRO' &&
          motivo.length > 3) { // Pelo menos 4 caracteres
        motivosCount[motivo] = (motivosCount[motivo] || 0) + 1;
      }
    });
    const maiorOcorrenciaMotivo = Object.entries(motivosCount)
      .sort(([,a], [,b]) => b - a)[0];

    // ✅ DADOS PARA GRÁFICO: Filtrar apenas motivos com nome válido
    const dadosGraficoMotivos = Object.entries(motivosCount)
      .map(([motivo, quantidade]) => ({ 
        motivo: motivo, // Manter o motivo original para o gráfico
        motivoCompleto: motivo, // Para tooltip
        quantidade,
        valor: quantidade * 990 // Assumindo valor médio de R$ 990 por multa
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10); // Top 10

    return {
      totalMultas,
      valorTotal,
      veiculoMaisMultado: veiculoMaisMultado ? { nome: veiculoMaisMultado[0], quantidade: veiculoMaisMultado[1] } : null,
      horarioMaisMultas: horarioMaisMultas ? { nome: horarioMaisMultas[0], quantidade: horarioMaisMultas[1] } : null,
      localMaisInfracoes: localMaisInfracoes ? { nome: localMaisInfracoes[0], quantidade: localMaisInfracoes[1] } : null,
      maiorFiscalizacao: maiorFiscalizacao ? { nome: maiorFiscalizacao[0], quantidade: maiorFiscalizacao[1] } : null,
      maiorCodigoInfracao: maiorCodigoInfracao ? { codigo: maiorCodigoInfracao[0], quantidade: maiorCodigoInfracao[1] } : null,
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
      navigate('/departments/juridico/sufisa/page3'); // ✅ NAVEGAÇÃO PARA PÁGINA 3
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
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
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
                      className={`w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm ${
                        currentPage === page 
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
      <div className="flex-1 flex flex-col mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 space-y-3 sm:space-y-6 w-full max-w-screen-2xl">
        
        {/* PRIMEIRA LINHA HORIZONTAL: Veículo/Linha, Horário, Local, Fiscal - RESPONSIVO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 flex-shrink-0">
          
          {/* Veículo / Linha */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-400 text-sm sm:text-base">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Veículo / Linha</span>
                  <span className="sm:hidden">Veículo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-white break-words">
                  {loading ? '...' : processedData?.veiculoMaisMultado?.nome || 'Não informado'}
                </div>
                <div className="text-sm sm:text-lg text-amber-300">
                  {processedData?.veiculoMaisMultado?.quantidade || 0} multas
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
                <CardTitle className="flex items-center gap-2 text-purple-400 text-sm sm:text-base">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Horário mais multas</span>
                  <span className="sm:hidden">Horário</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-white">
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
                <CardTitle className="flex items-center gap-2 text-red-400 text-sm sm:text-base">
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
                <CardTitle className="flex items-center gap-2 text-indigo-400 text-sm sm:text-base">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
          
          {/* Valor Total */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-green-400 text-xs sm:text-sm">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">Valor Total</span>
                  <span className="sm:hidden">Valor</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-xs sm:text-sm lg:text-lg font-bold text-white break-words">
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
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-amber-200 text-xs sm:text-sm">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Maior Cód. Infração</span>
                  <span className="lg:hidden">Código</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-3">
                <div className="text-xs sm:text-sm text-amber-300">
                  {processedData?.maiorCodigoInfracao?.quantidade || 0} ocorrências
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
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-cyan-400 text-xs sm:text-sm">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Data mais Infrações</span>
                  <span className="lg:hidden">Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-xs font-bold text-white text-center break-words">
                  {loading ? '...' : processedData?.dataMaisInfracoes?.data || '25/03/2025'}
                </div>
                <div className="text-xs text-amber-300 text-center">
                  {processedData?.dataMaisInfracoes?.quantidade || 0} infrações
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
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-pink-400 text-xs sm:text-sm">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Maior Classificação</span>
                  <span className="lg:hidden">Classificação</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-xs font-bold text-white text-center break-words">
                  {loading ? '...' : processedData?.maiorClassificacao?.nome || 'DEFEITO'}
                </div>
                <div className="text-xs text-amber-300 text-center">
                  {processedData?.maiorClassificacao?.quantidade || 0} ocorrências
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
                <CardTitle className="flex items-center gap-1 sm:gap-2 text-emerald-400 text-xs sm:text-sm">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline">Maior ocorrência - Motivo</span>
                  <span className="lg:hidden">Motivo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-xs font-bold text-white text-center break-words leading-tight">
                  {loading ? '...' : processedData?.maiorOcorrenciaMotivo?.nome || 'FURO DE VIAGEM'}
                </div>
                <div className="text-xs text-amber-300 text-center">
                  {processedData?.maiorOcorrenciaMotivo?.quantidade || 0} ocorrências
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
              <CardTitle className="text-white text-sm sm:text-base lg:text-lg">ANÁLISE DE MOTIVOS DE INFRAÇÃO</CardTitle>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-400 rounded"></div>
                  <span className="text-amber-200">Quantidade de Multas</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {loading ? (
                <div className="flex justify-center items-center h-full min-h-[200px] sm:min-h-[325px]">
                  <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                </div>
              ) : processedData?.dadosGraficoMotivos?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={340}>
                  <BarChart 
                    data={processedData.dadosGraficoMotivos} 
                    margin={{ 
                      top: 5, 
                      right: window.innerWidth < 768 ? 10 : 30, 
                      left: window.innerWidth < 768 ? 10 : 20, 
                      bottom: -10 
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="motivo" 
                      stroke="#E5E7EB" 
                      height={window.innerWidth < 768 ? 80 : 100}
                      interval={0}
                      fontSize={window.innerWidth < 768 ? 8 : 15}
                      tick={<CustomAxisTick />}
                    />
                    <YAxis stroke="#E5E7EB" fontSize={window.innerWidth < 768 ? 10 : 12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #374151',
                        color: '#ffffff',
                        fontSize: window.innerWidth < 768 ? '12px' : '14px'
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