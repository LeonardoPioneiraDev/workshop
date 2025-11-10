import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Building,
  Activity,
  Download,
  Filter,
  Menu,
  UserCheck,
  UserX,
  Clock,
  Heart
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
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart,
  Area,
  Legend,
  LabelList
} from 'recharts';

import { useFuncionariosCompletos } from '../../../services/departments/pessoal/hooks/useFuncionariosCompletos';
import logoImage from '@/assets/logo.png';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

// Hook para processar dados para gráficos
const useGraficosData = () => {
  const [filters, setFilters] = useState({
    periodo: 'Todos',
    situacao: 'Todos',
    genero: 'Todos'
  });

  const {
    funcionarios: todosFuncionarios,
    loading,
    error,
    refetch
  } = useFuncionariosCompletos({
    page: 1,
    limit: 50000
  });

  // Filtrar funcionários baseado nos filtros
  const funcionariosFiltrados = useMemo(() => {
    if (!todosFuncionarios.length) return [];

    let funcionarios = [...todosFuncionarios];

    if (filters.situacao && filters.situacao !== 'Todos') {
      if (filters.situacao === 'Ativos') {
        funcionarios = funcionarios.filter(f => f.situacao === 'A' && f.ativo);
      } else if (filters.situacao === 'Inativos') {
        funcionarios = funcionarios.filter(f => f.situacao === 'F' || f.situacao === 'D' || !f.ativo);
      } else if (filters.situacao === 'Afastados') {
        funcionarios = funcionarios.filter(f => f.situacao === 'F');
      }
    }

    if (filters.genero && filters.genero !== 'Todos') {
      funcionarios = funcionarios.filter(f => f.sexo === filters.genero);
    }

    if (filters.periodo && filters.periodo !== 'Todos') {
      const hoje = new Date();
      let dataLimite;

      switch (filters.periodo) {
        case 'UltimoAno':
          dataLimite = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate());
          break;
        case 'Ultimos6Meses':
          dataLimite = new Date(hoje.getFullYear(), hoje.getMonth() - 6, hoje.getDate());
          break;
        case 'Ultimos3Meses':
          dataLimite = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate());
          break;
        default:
          dataLimite = null;
      }

      if (dataLimite) {
        funcionarios = funcionarios.filter(f => new Date(f.dataAdmissao) >= dataLimite);
      }
    }

    return funcionarios;
  }, [todosFuncionarios, filters]);

  // Processar dados para gráficos
  const dadosGraficos = useMemo(() => {
    if (!funcionariosFiltrados.length) return null;

    // 1. Funcionários por Situação
    const porSituacao = {};
    funcionariosFiltrados.forEach(f => {
      const situacao = f.situacao === 'A' && f.ativo ? 'Ativos' : 
                     f.situacao === 'F' ? 'Afastados' : 
                     f.situacao === 'D' ? 'Demitidos' : 'Outros';
      porSituacao[situacao] = (porSituacao[situacao] || 0) + 1;
    });

    const dadosSituacao = Object.entries(porSituacao)
      .map(([situacao, count]) => ({ situacao, total: count }));

    // 2. Funcionários por Faixa Etária
    const faixasEtarias = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    };

    funcionariosFiltrados.forEach(f => {
      const idade = f.idade;
      if (idade >= 18 && idade <= 25) faixasEtarias['18-25']++;
      else if (idade >= 26 && idade <= 35) faixasEtarias['26-35']++;
      else if (idade >= 36 && idade <= 45) faixasEtarias['36-45']++;
      else if (idade >= 46 && idade <= 55) faixasEtarias['46-55']++;
      else if (idade >= 56 && idade <= 65) faixasEtarias['56-65']++;
      else if (idade > 65) faixasEtarias['65+']++;
    });

    const dadosIdade = Object.entries(faixasEtarias)
      .map(([faixa, count]) => ({ faixa, total: count }));

    // 3. CIDs de Afastamento (Top 10) - APENAS FUNCIONÁRIOS AFASTADOS
    const porCid = {};
    funcionariosFiltrados
      .filter(f => f.situacao === 'F') // ✅ APENAS AFASTADOS
      .forEach(f => {
        if (f.cidAfastamento && f.cidAfastamento.trim() !== '') {
          const cid = f.cidAfastamento.trim();
          
          // ✅ IGNORAR "BRASILIA" E VARIAÇÕES
          if (cid.toUpperCase() !== 'BRASILIA' && 
              cid.toUpperCase() !== 'BRASÍLIA' && 
              cid.length > 2) {
            porCid[cid] = (porCid[cid] || 0) + 1;
          }
        }
      });

    const dadosCid = Object.entries(porCid)
      .map(([cid, count]) => ({ cid, total: count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // 4. Distribuição por Gênero
    const porGenero = {};
    funcionariosFiltrados.forEach(f => {
      const genero = f.sexo === 'M' ? 'Masculino' : f.sexo === 'F' ? 'Feminino' : 'Não informado';
      porGenero[genero] = (porGenero[genero] || 0) + 1;
    });

    const dadosGenero = Object.entries(porGenero)
      .map(([genero, count]) => ({ genero, total: count }));

    // 5. Tempo de Empresa (em anos) - APENAS ATIVOS E AFASTADOS
    const temposEmpresa = {
      '0-1 ano': 0,
      '1-3 anos': 0,
      '3-5 anos': 0,
      '5-10 anos': 0,
      '10-20 anos': 0,
      '20+ anos': 0
    };

    funcionariosFiltrados
      .filter(f => f.situacao === 'A' || f.situacao === 'F') // ✅ APENAS ATIVOS E AFASTADOS
      .forEach(f => {
        const hoje = new Date();
        const dataAdmissao = new Date(f.dataAdmissao);
        const anosEmpresa = (hoje - dataAdmissao) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (anosEmpresa < 1) temposEmpresa['0-1 ano']++;
        else if (anosEmpresa < 3) temposEmpresa['1-3 anos']++;
        else if (anosEmpresa < 5) temposEmpresa['3-5 anos']++;
        else if (anosEmpresa < 10) temposEmpresa['5-10 anos']++;
        else if (anosEmpresa < 20) temposEmpresa['10-20 anos']++;
        else temposEmpresa['20+ anos']++;
      });

    const dadosTempoEmpresa = Object.entries(temposEmpresa)
      .map(([tempo, count]) => ({ tempo, total: count }));

    // 6. Admissões por Mês (últimos 12 meses)
    const admissoesPorMes = {};
    const hoje = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      admissoesPorMes[mesAno] = 0;
    }

    funcionariosFiltrados.forEach(f => {
      const dataAdmissao = new Date(f.dataAdmissao);
      const mesAno = dataAdmissao.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (admissoesPorMes.hasOwnProperty(mesAno)) {
        admissoesPorMes[mesAno]++;
      }
    });

    const dadosAdmissoes = Object.entries(admissoesPorMes)
      .map(([mes, count]) => ({ mes, admissoes: count }));

    // 7. Estado Civil
    const porEstadoCivil = {};
    funcionariosFiltrados.forEach(f => {
      const estadoCivil = f.estadoCivil || 'Não informado';
      porEstadoCivil[estadoCivil] = (porEstadoCivil[estadoCivil] || 0) + 1;
    });

    const dadosEstadoCivil = Object.entries(porEstadoCivil)
      .map(([estado, count]) => ({ estado, total: count }));

    return {
      dadosSituacao,
      dadosIdade,
      dadosCid,
      dadosGenero,
      dadosTempoEmpresa,
      dadosAdmissoes,
      dadosEstadoCivil
    };
  }, [funcionariosFiltrados]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    dadosGraficos,
    funcionarios: funcionariosFiltrados,
    loading,
    error,
    filters,
    updateFilter,
    refetch
  };
};

export default function GraficosPessoalPage() {
  const navigate = useNavigate();
  const { 
    dadosGraficos, 
    funcionarios, 
    loading, 
    error, 
    filters, 
    updateFilter, 
    refetch 
  } = useGraficosData();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Estatísticas resumidas
  const stats = useMemo(() => {
    if (!funcionarios.length) return null;

    const ativos = funcionarios.filter(f => f.situacao === 'A' && f.ativo).length;
    const afastados = funcionarios.filter(f => f.situacao === 'F').length;
    const idades = funcionarios.map(f => f.idade).filter(i => i > 0);
    const idadeMedia = idades.length > 0 ? idades.reduce((sum, i) => sum + i, 0) / idades.length : 0;
    
    // Tempo médio de empresa - APENAS ATIVOS E AFASTADOS
    const hoje = new Date();
    const temposEmpresa = funcionarios
      .filter(f => f.situacao === 'A' || f.situacao === 'F') // ✅ APENAS ATIVOS E AFASTADOS
      .map(f => {
        const dataAdmissao = new Date(f.dataAdmissao);
        return (hoje - dataAdmissao) / (1000 * 60 * 60 * 24 * 365.25);
      }).filter(t => t > 0);
    
    const tempoMedioEmpresa = temposEmpresa.length > 0 ? 
      temposEmpresa.reduce((sum, t) => sum + t, 0) / temposEmpresa.length : 0;

    return {
      total: funcionarios.length,
      ativos,
      afastados,
      percentualAtivos: funcionarios.length > 0 ? (ativos / funcionarios.length) * 100 : 0,
      idadeMedia,
      tempoMedioEmpresa
    };
  }, [funcionarios]);

  // Componente de filtros
  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-purple-200">Período:</label>
        <Select value={filters.periodo} onValueChange={(value) => updateFilter('periodo', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-purple-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-purple-500/30">
            <SelectItem value="Todos">Todos os períodos</SelectItem>
            <SelectItem value="UltimoAno">Último ano</SelectItem>
            <SelectItem value="Ultimos6Meses">Últimos 6 meses</SelectItem>
            <SelectItem value="Ultimos3Meses">Últimos 3 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-purple-200">Situação:</label>
        <Select value={filters.situacao} onValueChange={(value) => updateFilter('situacao', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-purple-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-purple-500/30">
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Ativos">Apenas Ativos</SelectItem>
            <SelectItem value="Afastados">Apenas Afastados</SelectItem>
            <SelectItem value="Inativos">Apenas Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-purple-200">Gênero:</label>
        <Select value={filters.genero} onValueChange={(value) => updateFilter('genero', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-purple-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-purple-500/30">
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="M">Masculino</SelectItem>
            <SelectItem value="F">Feminino</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-slate-900 to-blue-900/20 text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Erro ao carregar dados</h2>
            <p className="text-sm sm:text-base mb-4">{error}</p>
            <Button onClick={refetch} className="bg-purple-600 hover:bg-purple-700 w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-slate-900 to-blue-900/20 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/90 via-purple-900/30 to-slate-800/90 border-b border-purple-500/20 p-3 sm:p-4 flex-shrink-0 backdrop-blur-sm">
        <div className="container mx-auto">
          
          {/* Layout Mobile */}
          <div className="lg:hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/pessoal/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-purple-700/30 p-2"
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
                    <h2 className="text-sm font-bold text-white">Analytics RH</h2>
                    <p className="text-xs text-purple-300">{stats?.total || 0} funcionários</p>
                  </div>
                </div>
              </div>

              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-purple-700/30">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate-800 border-purple-500/30 text-white">
                  <SheetHeader>
                    <SheetTitle className="text-purple-200">Filtros</SheetTitle>
                    <SheetDescription className="text-purple-300">
                      Configure os filtros para os gráficos
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Layout Desktop */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/pessoal/dashboard')}
                variant="ghost"
                className="text-white hover:bg-purple-700/30 p-2"
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
                <div>
                  <h2 className="text-lg font-bold text-white">Analytics RH - Departamento Pessoal</h2>
                  <p className="text-xs text-purple-300">Análise visual de {stats?.total || 0} funcionários</p>
                </div>
              </div>
            </div>

            {/* Filtros rápidos */}
            <div className="flex items-center gap-4">
              <Select value={filters.periodo} onValueChange={(value) => updateFilter('periodo', value)}>
                <SelectTrigger className="w-40 bg-slate-700/80 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-purple-500/30">
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="UltimoAno">Último ano</SelectItem>
                  <SelectItem value="Ultimos6Meses">6 meses</SelectItem>
                  <SelectItem value="Ultimos3Meses">3 meses</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.situacao} onValueChange={(value) => updateFilter('situacao', value)}>
                <SelectTrigger className="w-40 bg-slate-700/80 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-purple-500/30">
                  <SelectItem value="Todos">Todas situações</SelectItem>
                  <SelectItem value="Ativos">Ativos</SelectItem>
                  <SelectItem value="Afastados">Afastados</SelectItem>
                  <SelectItem value="Inativos">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={refetch}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-300 hover:bg-purple-700/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 w-full max-w-screen-2xl">
        
        {/* Cards de estatísticas resumidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 flex-shrink-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-400 text-sm sm:text-base">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Total</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : (stats?.total || 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-xs sm:text-sm text-purple-400">
                  Funcionários
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-green-400 text-sm sm:text-base">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Ativos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : (stats?.ativos || 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-xs sm:text-sm text-green-400">
                  {(stats?.percentualAtivos || 0).toFixed(1)}% do total
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-red-400 text-sm sm:text-base">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Afastados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : (stats?.afastados || 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-xs sm:text-sm text-red-400">
                  Por motivos de saúde
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-400 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Idade Média</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : `${(stats?.idadeMedia || 0).toFixed(0)} anos`}
                </div>
                <div className="text-xs sm:text-sm text-orange-400">
                  Idade média
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-cyan-400 text-sm sm:text-base">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Tempo Médio</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : `${(stats?.tempoMedioEmpresa || 0).toFixed(1)} anos`}
                </div>
                <div className="text-xs sm:text-sm text-cyan-400">
                  Na empresa (ativos/afastados)
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráficos - Layout Responsivo */}
        <div className="flex-1 flex flex-col space-y-4 sm:space-y-6">
          
          {/* Linha do Meio: Faixa Etária | CIDs de Afastamento */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-1 gap-4 sm:gap-6">
             {/* Admissões por Mês */}
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col"
            >
              <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
                  <CardTitle className="text-white text-sm sm:text-base lg:text-lg">
                    ADMISSÕES POR MÊS (ÚLTIMOS 12 MESES)
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-48 sm:h-64 lg:h-full">
                      <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64 lg:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={dadosGraficos?.dadosAdmissoes || []}
                          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="mes" stroke="#E5E7EB" fontSize={12} />
                          <YAxis stroke="#E5E7EB" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #374151',
                              color: '#ffffff'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="admissoes" 
                            stroke="#8B5CF6" 
                            strokeWidth={3}
                            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            
            {/* CIDs de Afastamento - APENAS AFASTADOS
               <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col"
            >
              <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
                  <CardTitle className="text-white text-sm sm:text-base lg:text-lg">
                    TOP 10 - CIDs DE AFASTAMENTO
                  </CardTitle>
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
                          data={dadosGraficos?.dadosCid || []} 
                          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="cid" 
                            stroke="#E5E7EB" 
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                          />
                          <YAxis stroke="#E5E7EB" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #374151',
                              color: '#ffffff',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey="total" fill="#EF4444">
                            <LabelList 
                              dataKey="total" 
                              position="top" 
                              style={{ fill: '#ffffff', fontSize: 10 }} 
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            */}
         
          </div>

          {/* Linha Inferior: Tempo de Empresa | Admissões por Mês */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Tempo de Empresa - APENAS ATIVOS E AFASTADOS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col"
            >
              <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
                  <CardTitle className="text-white text-sm sm:text-base lg:text-lg">
                    TEMPO DE EMPRESA (ATIVOS E AFASTADOS)
                  </CardTitle>
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
                          data={dadosGraficos?.dadosTempoEmpresa || []}
                          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="tempo" 
                            stroke="#E5E7EB" 
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="#E5E7EB" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #374151',
                              color: '#ffffff'
                            }}
                          />
                          <Bar dataKey="total" fill="#06B6D4">
                            <LabelList 
                              dataKey="total" 
                              position="top" 
                              style={{ fill: '#ffffff', fontSize: 10 }} 
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

           
            {/* Distribuição por Faixa Etária */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col"
            >
              <Card className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
                  <CardTitle className="text-white text-sm sm:text-base lg:text-lg">
                    DISTRIBUIÇÃO POR FAIXA ETÁRIA
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {loading ? (
                    <div className="flex justify-center items-center h-48 sm:h-64 lg:h-full">
                      <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64 lg:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={dadosGraficos?.dadosIdade || []}
                          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="faixa" stroke="#E5E7EB" fontSize={12} />
                          <YAxis stroke="#E5E7EB" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #374151',
                              color: '#ffffff'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#10B981" 
                            fill="#10B981" 
                            fillOpacity={0.6}
                          />
                        </AreaChart>
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