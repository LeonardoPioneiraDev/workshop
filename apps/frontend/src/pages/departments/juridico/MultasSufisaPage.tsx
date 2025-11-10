// src/pages/departments/juridico/MultasSufisaPage.tsx
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
  Menu,
  X
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
  LineChart,
  Line,
  Legend,
  LabelList
} from 'recharts';

// Função para formatar valores em "K" (milhares)
const formatCurrencyK = (value, useThousandsAbbreviation = true) => {
  if (useThousandsAbbreviation && Math.abs(value) >= 1000) {
    const formatted = (value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    return `R$ ${formatted}k`;
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatCountK = (value, useThousandsAbbreviation = true) => {
  if (useThousandsAbbreviation && Math.abs(value) >= 1000) {
    const formatted = (value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    return `${formatted}k`;
  }
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

  // Função para mapear locais para cidades (apenas as 4 principais)
  const mapearCidade = (local) => {
    if (!local) return 'Outros';
    
    const localUpper = local.toUpperCase();
    
    // Mapeamento para as 4 cidades principais
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

export default function MultasSufisaPage() {
  const navigate = useNavigate();
  const { multas, loading, error, filters, applyFilters, refetch } = useMultasSufisa();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Processar dados para estatísticas e gráficos
  const processedData = useMemo(() => {
    if (!multas.length) return null;

    // Estatísticas gerais
    const totalMultas = multas.length;
    const valorTotal = multas.reduce((sum, m) => sum + parseFloat(m.valorMulta || 0), 0);

    // Garantir que todas as 4 cidades apareçam nos dados
    const cidadesFixas = ['Gama', 'São Sebastião', 'Santa Maria', 'Paranoá'];
    
    // Multas por cidade (apenas as 4 principais)
    const multasPorCidade = {};
    const valorPorCidade = {};
    
    // Inicializar com 0 para todas as cidades
    cidadesFixas.forEach(cidade => {
      multasPorCidade[cidade] = 0;
      valorPorCidade[cidade] = 0;
    });
    
    // Contar multas reais
    multas.forEach(multa => {
      const cidade = multa.cidadeMapeada;
      if (cidadesFixas.includes(cidade)) {
        multasPorCidade[cidade] = (multasPorCidade[cidade] || 0) + 1;
        valorPorCidade[cidade] = (valorPorCidade[cidade] || 0) + parseFloat(multa.valorMulta || 0);
      }
    });

    // Multas por mês
    const multasPorMes = {};
    const valorPorMes = {};
    
    multas.forEach(multa => {
      const data = new Date(multa.dataHoraMulta);
      const mes = data.toLocaleDateString('pt-BR', { month: 'short' });
      const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
      
      multasPorMes[mesCapitalizado] = (multasPorMes[mesCapitalizado] || 0) + 1;
      valorPorMes[mesCapitalizado] = (valorPorMes[mesCapitalizado] || 0) + parseFloat(multa.valorMulta || 0);
    });

    // Encontrar mês com mais multas
    const mesComMaisMultas = Object.entries(multasPorMes)
      .sort(([,a], [,b]) => b - a)[0];

    // Encontrar cidade com mais multas
    const cidadeComMaisMultas = Object.entries(multasPorCidade)
      .sort(([,a], [,b]) => b - a)[0];

    // Dados para gráficos - Valor por Cidade (ordenado por valor)
    const dadosValorPorCidade = cidadesFixas
      .map(cidade => ({ 
        cidade, 
        valor: valorPorCidade[cidade], 
        valorAnterior: valorPorCidade[cidade] * 0.8 // Mock do ano anterior
      }))
      .sort((a, b) => b.valor - a.valor);

    // Dados para gráficos - Multas por Cidade (ordenado por quantidade)
    const dadosMultasPorCidade = cidadesFixas
      .map(cidade => ({ 
        cidade, 
        quantidade: multasPorCidade[cidade], 
        quantidadeAnterior: Math.floor(multasPorCidade[cidade] * 0.9) // Mock do ano anterior
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // Dados para gráficos - Por Mês (ordenado cronologicamente)
    const dadosValorPorMes = Object.entries(valorPorMes)
      .map(([mes, valor]) => ({ mes, valor, valorAnterior: valor * 0.85 }))
      .sort((a, b) => {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return meses.indexOf(a.mes) - meses.indexOf(b.mes);
      });

    const dadosMultasPorMes = Object.entries(multasPorMes)
      .map(([mes, quantidade]) => ({ mes, quantidade, quantidadeAnterior: Math.floor(quantidade * 0.9) }))
      .sort((a, b) => {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return meses.indexOf(a.mes) - meses.indexOf(b.mes);
      });

    return {
      totalMultas,
      valorTotal,
      mesComMaisMultas: mesComMaisMultas ? { nome: mesComMaisMultas[0], quantidade: mesComMaisMultas[1] } : null,
      cidadeComMaisMultas: cidadeComMaisMultas ? { nome: cidadeComMaisMultas[0], quantidade: cidadeComMaisMultas[1] } : null,
      dadosValorPorCidade,
      dadosMultasPorCidade,
      dadosValorPorMes,
      dadosMultasPorMes
    };
  }, [multas]);

  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    applyFilters(newFilters);
  };

  // ✅ NAVEGAÇÃO ATUALIZADA PARA INCLUIR PÁGINA 2
  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (page === 2) {
      navigate('/departments/juridico/sufisa/page2');
    } else if (page === 3) {
      navigate('/departments/juridico/sufisa/page3');
    }
  };

  // Componente de filtros para mobile
  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-amber-200">Ano:</label>
        <Select value={filters.ano} onValueChange={(value) => handleFilterChange('ano', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-amber-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-amber-500/30">
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-amber-200">Mês:</label>
        <Select value={filters.mes} onValueChange={(value) => handleFilterChange('mes', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-amber-500/30 text-white">
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

      <div className="space-y-2">
        <label className="text-sm font-medium text-amber-200">Cidade:</label>
        <Select value={filters.cidade} onValueChange={(value) => handleFilterChange('cidade', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-amber-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-amber-500/30">
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Gama">Gama</SelectItem>
            <SelectItem value="São Sebastião">São Sebastião</SelectItem>
            <SelectItem value="Santa Maria">Santa Maria</SelectItem>
            <SelectItem value="Paranoá">Paranoá</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900/20 via-slate-900 to-yellow-900/20 text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Erro ao carregar dados</h2>
            <p className="text-sm sm:text-base mb-4">{error}</p>
            <Button 
              onClick={refetch} 
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900/20 via-slate-900 to-yellow-900/20 text-white flex flex-col">
      {/* Header com Logo, Filtros e Navegação */}
      <div className="bg-gradient-to-r from-slate-800/90 via-amber-900/30 to-slate-800/90 border-b border-amber-500/20 p-3 sm:p-4 flex-shrink-0 backdrop-blur-sm">
        <div className="container mx-auto">
          
          {/* Layout Mobile */}
          <div className="lg:hidden space-y-4">
            {/* Primeira linha: Logo + Voltar + Menu */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/departments/juridico')}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-amber-700/30 p-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <img 
                    src={logoImage} 
                    alt="Viação Pioneira Logo" 
                    className="w-8 h-8 object-contain rounded-lg" 
                  />
                  <div>
                    <h2 className="text-sm font-bold text-white">Viação Pioneira</h2>
                    <p className="text-xs text-amber-300">SUFISA Dashboard</p>
                  </div>
                </div>
              </div>

              {/* Menu de filtros mobile */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-amber-700/30">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate-800 border-amber-500/30 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-amber-200">Filtros</SheetTitle>
                    <SheetDescription className="text-amber-300">
                      Configure os filtros para visualizar os dados
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Segunda linha: Navegação de páginas */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
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
                        className={`w-8 h-8 p-0 ${
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
                    className="text-white hover:bg-amber-700/30 p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Layout Desktop */}
          <div className="hidden lg:flex items-center justify-between">
            
            {/* Logo da empresa (esquerda) */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/departments/juridico')}
                variant="ghost"
                className="text-white hover:bg-amber-700/30 p-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              
              {/* Logo Real */}
              <div className="flex items-center gap-2">
                <img 
                  src={logoImage} 
                  alt="Viação Pioneira Logo" 
                  className="w-10 h-10 object-contain rounded-lg" 
                />
                <div>
                  <h2 className="text-lg font-bold text-white">Viação Pioneira</h2>
                  <p className="text-xs text-amber-300">SUFISA Dashboard</p>
                </div>
              </div>
            </div>

            {/* Filtros (centro) */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-200">Ano:</span>
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
                <span className="text-sm text-amber-200">Mês:</span>
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
                <span className="text-sm text-amber-200">Cidade:</span>
                <Select value={filters.cidade} onValueChange={(value) => handleFilterChange('cidade', value)}>
                  <SelectTrigger className="w-36 bg-slate-700/80 border-amber-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-amber-500/30">
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Gama">Gama</SelectItem>
                    <SelectItem value="São Sebastião">São Sebastião</SelectItem>
                    <SelectItem value="Santa Maria">Santa Maria</SelectItem>
                    <SelectItem value="Paranoá">Paranoá</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Navegação entre páginas (direita) */}
            <div className="flex items-center gap-2">
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
                      className={`w-8 h-8 p-0 ${
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
                  className="text-white hover:bg-amber-700/30 p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - 100% height */}
      <div className="flex-1 flex flex-col mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 w-full max-w-screen-2xl">
        
        {/* Cards de estatísticas principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-400 text-sm sm:text-base">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Total de Multas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">
                  {loading ? '...' : formatCountK(processedData?.totalMultas || 0, false)}
                </div>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-green-400">
                  <TrendingUp className="w-3 h-3 flex-shrink-0" />
                  <span>-10,33%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-green-400 text-sm sm:text-base">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Valor Total</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white break-words">
                  {loading ? '...' : formatCurrencyK(processedData?.valorTotal || 0, false)}
                </div>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-red-400">
                  <TrendingDown className="w-3 h-3 flex-shrink-0" />
                  <span>-8%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-400 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Mês com Mais Multas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">
                  {loading ? '...' : processedData?.mesComMaisMultas?.nome || 'N/A'}
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl text-amber-300">
                  {loading ? '' : formatCountK(processedData?.mesComMaisMultas?.quantidade || 0, false)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-400 text-sm sm:text-base">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Cidade com Mais Multas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">
                  {loading ? '...' : processedData?.cidadeComMaisMultas?.nome || 'N/A'}
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl text-amber-300">
                  {loading ? '' : formatCountK(processedData?.cidadeComMaisMultas?.quantidade || 0, false)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráficos - Layout Responsivo */}
        <div className="flex-1 flex flex-col space-y-4 sm:space-y-6">
          
          {/* Linha Superior: Valor por Cidade | Valor Total por Mês */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
            
            {/* Valor por Cidade */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="xl:col-span-2 flex flex-col"
            >
              <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
                  <CardTitle className="text-white text-sm sm:text-base lg:text-lg">VALOR POR CIDADE</CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-400 rounded"></div>
                      <span className="text-amber-200">Valor Atual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded"></div>
                      <span className="text-amber-200">Ano Anterior</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-48 sm:h-64 lg:h-full">
                      <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64 lg:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={processedData?.dadosValorPorCidade || []} 
                          margin={{ 
                            top: 20, 
                            right: 10, 
                            left: 10, 
                            bottom: 5 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="cidade" 
                            stroke="#E5E7EB" 
                            fontSize={12}
                            interval={0}
                            
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            stroke="#E5E7EB" 
                            tickFormatter={(value) => formatCurrencyK(value)}
                            fontSize={12}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #374151',
                              color: '#ffffff',
                              fontSize: '12px'
                            }}
                            formatter={(value) => [formatCurrency(value), 'Valor']}
                          />
                          <Bar dataKey="valor" fill="#FACC15">
                            <LabelList 
                              dataKey="valor" 
                              position="top" 
                              formatter={formatCurrencyK} 
                              style={{ fill: '#1e293b', fontSize: 10 }} 
                            />
                          </Bar>
                          <Bar dataKey="valorAnterior" fill="#6b7280">
                            <LabelList 
                              dataKey="valorAnterior" 
                              position="top" 
                              formatter={formatCurrencyK} 
                              style={{ fill: '#9CA3AF', fontSize: 9 }} 
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Valor Total por Mês */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="xl:col-span-3 flex flex-col"
            >
              <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
                  <CardTitle className="text-white text-sm sm:text-base lg:text-lg">VALOR TOTAL POR MÊS</CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-400 rounded"></div>
                      <span className="text-amber-200">Valor Atual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded"></div>
                      <span className="text-amber-200">Ano Anterior</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-48 sm:h-64 lg:h-full">
                      <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64 lg:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={processedData?.dadosValorPorMes || []} 
                          margin={{ 
                            top: 20, 
                            right: 10, 
                            left: 10, 
                            bottom: 5 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="mes" 
                            stroke="#E5E7EB" 
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#E5E7EB" 
                            tickFormatter={(value) => formatCurrencyK(value)}
                            fontSize={12}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #374151',
                              color: '#ffffff',
                              fontSize: '12px'
                            }}
                            formatter={(value) => [formatCurrency(value), 'Valor']}
                          />
                          <Bar dataKey="valor" fill="#FACC15">
                            <LabelList 
                              dataKey="valor" 
                              position="top" 
                              formatter={formatCurrencyK} 
                              style={{ fill: '#1e293b', fontSize: 10 }} 
                            />
                          </Bar>
                          <Line type="monotone" dataKey="valorAnterior" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Linha Inferior: Multas por Cidade | Multas por Mês */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
            
            {/* Multas por Cidade */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="xl:col-span-2 flex flex-col"
            >
              <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
                  <CardTitle className="text-white text-sm sm:text-base lg:text-lg">MULTAS POR CIDADE</CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-400 rounded"></div>
                      <span className="text-amber-200">Quantidade Atual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded"></div>
                      <span className="text-amber-200">Ano Anterior</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-48 sm:h-64 lg:h-full">
                      <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64 lg:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={processedData?.dadosMultasPorCidade || []}
                          margin={{ 
                            top: 20, 
                            right: 10, 
                            left: 10, 
                            bottom: 5 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="cidade" 
                            stroke="#E5E7EB" 
                            fontSize={12}
                            interval={0}
                            
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            stroke="#E5E7EB" 
                            tickFormatter={formatCountK}
                            fontSize={12}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #374151',
                              color: '#ffffff',
                              fontSize: '12px'
                            }}
                            formatter={(value) => [formatCountK(value, false), 'Quantidade']}
                          />
                          <Bar dataKey="quantidade" fill="#FACC15">
                            <LabelList 
                              dataKey="quantidade" 
                              position="top" 
                              formatter={formatCountK} 
                              style={{ fill: '#1e293b', fontSize: 10 }} 
                            />
                          </Bar>
                          <Bar dataKey="quantidadeAnterior" fill="#6b7280">
                            <LabelList 
                              dataKey="quantidadeAnterior" 
                              position="top" 
                              formatter={formatCountK} 
                              style={{ fill: '#9CA3AF', fontSize: 9 }} 
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Multas por Mês */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="xl:col-span-3 flex flex-col"
            >
              <Card className="bg-gradient-to-br from-slate-800/80 to-amber-900/30 border-amber-500/30 backdrop-blur-sm flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
                  <CardTitle className="text-white text-sm sm:text-base lg:text-lg">MULTAS POR MÊS</CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-400 rounded"></div>
                      <span className="text-amber-200">Quantidade Atual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded"></div>
                      <span className="text-amber-200">Ano Anterior</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-48 sm:h-64 lg:h-full">
                      <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64 lg:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={processedData?.dadosMultasPorMes || []} 
                          margin={{ 
                            top: 20, 
                            right: 10, 
                            left: 10, 
                            bottom: 5 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="mes" 
                            stroke="#E5E7EB" 
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#E5E7EB" 
                            tickFormatter={formatCountK}
                            fontSize={12}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #374151',
                              color: '#ffffff',
                              fontSize: '12px'
                            }}
                            formatter={(value) => [formatCountK(value, false), 'Quantidade']}
                          />
                          <Bar dataKey="quantidade" fill="#FACC15">
                            <LabelList 
                              dataKey="quantidade" 
                              position="top" 
                              formatter={formatCountK} 
                              style={{ fill: '#1e293b', fontSize: 10 }} 
                            />
                          </Bar>
                          <Line type="monotone" dataKey="quantidadeAnterior" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}