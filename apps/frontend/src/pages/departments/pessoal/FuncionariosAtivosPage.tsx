import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  MapPin,
  Building,
  Phone,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  SlidersHorizontal,
  UserCheck,
  Clock // ✅ ADICIONAR ESTA IMPORTAÇÃO
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useFuncionariosCompletos } from '../../../services/departments/pessoal/hooks/useFuncionariosCompletos';
import logoImage from '@/assets/logo.png';

// Hook específico para funcionários ativos com filtros
const useFuncionariosAtivos = () => {
  const [filters, setFilters] = useState({
    search: '',
    departamento: 'Todos',
    funcao: 'Todos',
    cidade: 'Todos',
    idadeMin: '',
    idadeMax: '',
    dataAdmissaoInicio: '',
    dataAdmissaoFim: '',
    tempoEmpresaMin: '',
    tempoEmpresaMax: ''
  });

  const {
    funcionarios: todosFuncionarios,
    loading,
    error,
    refetch
  } = useFuncionariosCompletos({
    page: 1,
    limit: 50000 // ✅ LIMITE MUITO ALTO PARA PEGAR TODOS
  });

  // Filtrar apenas funcionários ativos
  const funcionariosAtivos = useMemo(() => {
    if (!todosFuncionarios.length) return [];

    let funcionarios = todosFuncionarios.filter(f => f.situacao === 'A');

    // Aplicar filtros
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      funcionarios = funcionarios.filter(f => 
        f.nome.toLowerCase().includes(searchLower) ||
        f.cpf.includes(filters.search) ||
        f.cracha.toString().includes(filters.search) ||
        f.chapa.toLowerCase().includes(searchLower)
      );
    }

    if (filters.departamento && filters.departamento !== 'Todos') {
      funcionarios = funcionarios.filter(f => f.departamento === filters.departamento);
    }

    if (filters.funcao && filters.funcao !== 'Todos') {
      funcionarios = funcionarios.filter(f => f.funcao === filters.funcao);
    }

    if (filters.cidade && filters.cidade !== 'Todos') {
      funcionarios = funcionarios.filter(f => f.cidade === filters.cidade);
    }

    if (filters.idadeMin) {
      funcionarios = funcionarios.filter(f => f.idade >= parseInt(filters.idadeMin));
    }

    if (filters.idadeMax) {
      funcionarios = funcionarios.filter(f => f.idade <= parseInt(filters.idadeMax));
    }

    if (filters.dataAdmissaoInicio && filters.dataAdmissaoFim) {
      funcionarios = funcionarios.filter(f => {
        const dataAdmissao = new Date(f.dataAdmissao);
        const inicio = new Date(filters.dataAdmissaoInicio);
        const fim = new Date(filters.dataAdmissaoFim);
        return dataAdmissao >= inicio && dataAdmissao <= fim;
      });
    }

    if (filters.tempoEmpresaMin) {
      funcionarios = funcionarios.filter(f => f.tempoEmpresaDias >= parseInt(filters.tempoEmpresaMin));
    }

    if (filters.tempoEmpresaMax) {
      funcionarios = funcionarios.filter(f => f.tempoEmpresaDias <= parseInt(filters.tempoEmpresaMax));
    }

    return funcionarios;
  }, [todosFuncionarios, filters]);

  // Opções para filtros
  const filterOptions = useMemo(() => {
    const funcionariosBase = todosFuncionarios.filter(f => f.situacao === 'A');

    return {
      departamentos: [...new Set(funcionariosBase.map(f => f.departamento))].sort(),
      funcoes: [...new Set(funcionariosBase.map(f => f.funcao))].sort(),
      cidades: [...new Set(funcionariosBase.map(f => f.cidade).filter(Boolean))].sort()
    };
  }, [todosFuncionarios]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      departamento: 'Todos',
      funcao: 'Todos',
      cidade: 'Todos',
      idadeMin: '',
      idadeMax: '',
      dataAdmissaoInicio: '',
      dataAdmissaoFim: '',
      tempoEmpresaMin: '',
      tempoEmpresaMax: ''
    });
  };

  return {
    funcionarios: funcionariosAtivos,
    loading,
    error,
    filters,
    filterOptions,
    updateFilter,
    clearFilters,
    refetch
  };
};

// ✅ FUNÇÃO PARA GERAR RELATÓRIO HTML DE FUNCIONÁRIOS ATIVOS
const gerarRelatorioHTMLAtivos = (funcionarios, filtros) => {
  const dataAtual = new Date().toLocaleString('pt-BR');
  const totalFuncionarios = funcionarios.length;
  
  const idades = funcionarios.map(f => f.idade).filter(i => i > 0);
  const idadeMedia = idades.length > 0 ? idades.reduce((sum, i) => sum + i, 0) / idades.length : 0;
  
  const temposEmpresa = funcionarios.map(f => f.tempoEmpresaDias).filter(t => t > 0);
  const tempoMedioEmpresa = temposEmpresa.length > 0 ? temposEmpresa.reduce((sum, t) => sum + t, 0) / temposEmpresa.length : 0;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Funcionários Ativos - Viação Pioneira</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 10px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .stat-card h3 { font-size: 2em; margin-bottom: 5px; }
        .stat-card p { opacity: 0.9; }
        .filters-section { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
        .filters-title { font-size: 1.3em; margin-bottom: 15px; color: #495057; }
        .filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .filter-item { background: white; padding: 10px; border-radius: 5px; border-left: 4px solid #10b981; }
        .table-container { overflow-x: auto; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        th { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px; text-align: left; font-weight: 600; }
        td { padding: 12px 15px; border-bottom: 1px solid #eee; }
        tr:hover { background: #f8f9fa; }
        .situacao-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; background: #d4edda; color: #155724; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px; color: #6c757d; }
        @media print { body { background: white; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👥 Relatório de Funcionários Ativos</h1>
            <p>Viação Pioneira Ltda - Departamento Pessoal</p>
            <p>Gerado em: ${dataAtual}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>${totalFuncionarios}</h3>
                <p>Funcionários Ativos</p>
            </div>
            <div class="stat-card">
                <h3>${idadeMedia.toFixed(0)} anos</h3>
                <p>Idade Média</p>
            </div>
            <div class="stat-card">
                <h3>${Math.floor(tempoMedioEmpresa / 365)} anos</h3>
                <p>Tempo Médio na Empresa</p>
            </div>
            <div class="stat-card">
                <h3>100%</h3>
                <p>Taxa de Atividade</p>
            </div>
        </div>

        <div class="filters-section">
            <h2 class="filters-title">🔍 Filtros Aplicados</h2>
            <div class="filters-grid">
                ${Object.entries(filtros).filter(([key, value]) => value && value !== 'Todos' && value !== '').map(([key, value]) => `
                    <div class="filter-item">
                        <strong>${key}:</strong> ${value}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Crachá</th>
                        <th>Nome</th>
                        <th>CPF</th>
                        <th>Função</th>
                        <th>Departamento</th>
                         
                        <th>Idade</th>
                        <th>Admissão</th>
                        <th>Tempo Empresa</th>
                        <th>Situação</th>
                    </tr>
                </thead>
                <tbody>
                    ${funcionarios.map(f => `
                        <tr>
                            <td>${f.cracha}</td>
                            <td>${f.nome}</td>
                            <td>${f.cpf}</td>
                            <td>${f.funcao}</td>
                            <td>${f.departamento}</td>
                            
                            <td>${f.idade} anos</td>
                            <td>${new Date(f.dataAdmissao).toLocaleDateString('pt-BR')}</td>
                            <td>${f.tempoEmpresaAnos} anos</td>
                            <td><span class="situacao-badge">Ativo</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Relatório de Funcionários Ativos gerado automaticamente</p>
            <p>Total de registros: ${totalFuncionarios} funcionários ativos</p>
        </div>
    </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `funcionarios-ativos-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ✅ FUNÇÃO PARA GERAR RELATÓRIO EXCEL DE FUNCIONÁRIOS ATIVOS
const gerarRelatorioExcelAtivos = (funcionarios, filtros) => {
  const dadosExcel = funcionarios.map(f => ({
    'Crachá': f.cracha,
    'Nome': f.nome,
    'CPF': f.cpf,
    'Chapa': f.chapa,
    'Função': f.funcao,
    'Departamento': f.departamento,
    'Área': f.area,
    'Seção': f.secao || '',
    'Setor': f.setor || '',
    'Cidade': f.cidade || '',
    'Bairro': f.bairro || '',
    'Endereço': f.endereco || '',
    'Telefone 1': f.foneFunc || '',
    'Telefone 2': f.fone2Func || '',
    'Idade': f.idade,
    'Data Admissão': new Date(f.dataAdmissao).toLocaleDateString('pt-BR'),
    'Tempo Empresa (Dias)': f.tempoEmpresaDias,
    'Tempo Empresa (Anos)': f.tempoEmpresaAnos,
    'Situação': 'Ativo',
    'Mãe': f.mae || '',
    'Empresa': f.empresa,
    'Criado em': new Date(f.createdAt).toLocaleDateString('pt-BR'),
    'Atualizado em': new Date(f.updatedAt).toLocaleDateString('pt-BR'),
    'Sincronizado em': new Date(f.sincronizadoEm).toLocaleDateString('pt-BR')
  }));

  const csvContent = [
    Object.keys(dadosExcel[0] || {}).join(','),
    ...dadosExcel.map(row => Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `funcionarios-ativos-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function FuncionariosAtivosPage() {
  const navigate = useNavigate();
  const { 
    funcionarios, 
    loading, 
    error, 
    filters, 
    filterOptions, 
    updateFilter, 
    clearFilters, 
    refetch 
  } = useFuncionariosAtivos();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Paginação
  const totalPages = Math.ceil(funcionarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const funcionariosPaginados = funcionarios.slice(startIndex, endIndex);

  // Estatísticas
  const stats = useMemo(() => {
    if (!funcionarios.length) return null;

    const idades = funcionarios.map(f => f.idade).filter(i => i > 0);
    const idadeMedia = idades.length > 0 ? idades.reduce((sum, i) => sum + i, 0) / idades.length : 0;
    
    const temposEmpresa = funcionarios.map(f => f.tempoEmpresaDias).filter(t => t > 0);
    const tempoMedioEmpresa = temposEmpresa.length > 0 ? temposEmpresa.reduce((sum, t) => sum + t, 0) / temposEmpresa.length : 0;

    // Admissões recentes (últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
    const admisoesRecentes = funcionarios.filter(f => {
      const dataAdmissao = new Date(f.dataAdmissao);
      return dataAdmissao >= trintaDiasAtras;
    }).length;

    return {
      total: funcionarios.length,
      idadeMedia,
      tempoMedioEmpresa,
      admisoesRecentes
    };
  }, [funcionarios]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // ✅ HANDLERS PARA RELATÓRIOS COM FILTROS
  const handleGerarRelatorioHTML = async () => {
    setIsGeneratingReport(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      gerarRelatorioHTMLAtivos(funcionarios, filters);
    } catch (error) {
      console.error('Erro ao gerar relatório HTML:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleGerarRelatorioExcel = async () => {
    setIsGeneratingReport(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      gerarRelatorioExcelAtivos(funcionarios, filters);
    } catch (error) {
      console.error('Erro ao gerar relatório Excel:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Componente de filtros
  const FilterContent = () => (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="space-y-2">
        <label className="text-sm font-medium text-green-200">Buscar:</label>
        <Input
          placeholder="Nome, CPF, crachá ou chapa..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="bg-slate-700/80 border-green-500/30 text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-200">Departamento:</label>
        <Select value={filters.departamento} onValueChange={(value) => updateFilter('departamento', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-green-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-green-500/30">
            <SelectItem value="Todos">Todos</SelectItem>
            {filterOptions.departamentos.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-200">Função:</label>
        <Select value={filters.funcao} onValueChange={(value) => updateFilter('funcao', value)}>
          <SelectTrigger className="w-full bg-slate-700/80 border-green-500/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-green-500/30">
            <SelectItem value="Todos">Todos</SelectItem>
            {filterOptions.funcoes.map(funcao => (
              <SelectItem key={funcao} value={funcao}>{funcao}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-200">Faixa Etária:</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Idade mín"
            value={filters.idadeMin}
            onChange={(e) => updateFilter('idadeMin', e.target.value)}
            className="bg-slate-700/80 border-green-500/30 text-white"
          />
          <Input
            type="number"
            placeholder="Idade máx"
            value={filters.idadeMax}
            onChange={(e) => updateFilter('idadeMax', e.target.value)}
            className="bg-slate-700/80 border-green-500/30 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-200">Período de Admissão:</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={filters.dataAdmissaoInicio}
            onChange={(e) => updateFilter('dataAdmissaoInicio', e.target.value)}
            className="bg-slate-700/80 border-green-500/30 text-white"
          />
          <Input
            type="date"
            value={filters.dataAdmissaoFim}
            onChange={(e) => updateFilter('dataAdmissaoFim', e.target.value)}
            className="bg-slate-700/80 border-green-500/30 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-green-200">Tempo de Empresa (dias):</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Mínimo"
            value={filters.tempoEmpresaMin}
            onChange={(e) => updateFilter('tempoEmpresaMin', e.target.value)}
            className="bg-slate-700/80 border-green-500/30 text-white"
          />
          <Input
            type="number"
            placeholder="Máximo"
            value={filters.tempoEmpresaMax}
            onChange={(e) => updateFilter('tempoEmpresaMax', e.target.value)}
            className="bg-slate-700/80 border-green-500/30 text-white"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={clearFilters} variant="outline" className="flex-1">
          Limpar Filtros
        </Button>
        <Button 
          onClick={() => setIsFilterOpen(false)} 
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Aplicar
        </Button>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900/20 via-slate-900 to-blue-900/20 text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-green-900/30 border-green-500/30">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Erro ao carregar dados</h2>
            <p className="text-sm sm:text-base mb-4">{error}</p>
            <Button onClick={refetch} className="bg-green-600 hover:bg-green-700 w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900/20 via-slate-900 to-blue-900/20 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/90 via-green-900/30 to-slate-800/90 border-b border-green-500/20 p-3 sm:p-4 flex-shrink-0 backdrop-blur-sm">
        <div className="container mx-auto">
          
          {/* Layout Mobile */}
          <div className="lg:hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/pessoal/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-green-700/30 p-2"
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
                    <h2 className="text-sm font-bold text-white">Funcionários Ativos</h2>
                    <p className="text-xs text-green-300">{stats?.total || 0} funcionários</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-green-700/30">
                      <SlidersHorizontal className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-slate-800 border-green-500/30 text-white w-full sm:w-96">
                    <SheetHeader>
                      <SheetTitle className="text-green-200">Filtros</SheetTitle>
                      <SheetDescription className="text-green-300">
                        Configure os filtros para encontrar funcionários ativos
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-green-700/30"
                      disabled={isGeneratingReport}
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>📊 Relatórios</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleGerarRelatorioHTML} disabled={isGeneratingReport}>
                      <FileText className="w-4 h-4 mr-2" />
                      Relatório HTML
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGerarRelatorioExcel} disabled={isGeneratingReport}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Relatório Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Layout Desktop */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/pessoal/dashboard')}
                variant="ghost"
                className="text-white hover:bg-green-700/30 p-2"
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
                  <h2 className="text-lg font-bold text-white">Funcionários Ativos</h2>
                  <p className="text-xs text-green-300">{stats?.total || 0} funcionários ativos</p>
                </div>
              </div>
            </div>

            {/* Filtros rápidos */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-green-300" />
                <Input
                  placeholder="Buscar funcionário..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-64 bg-slate-700/80 border-green-500/30 text-white"
                />
              </div>

              <Select value={filters.departamento} onValueChange={(value) => updateFilter('departamento', value)}>
                <SelectTrigger className="w-48 bg-slate-700/80 border-green-500/30 text-white">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-green-500/30">
                  <SelectItem value="Todos">Todos os departamentos</SelectItem>
                  {filterOptions.departamentos.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-300 hover:bg-green-700/30"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filtros Avançados
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate-800 border-green-500/30 text-white w-96">
                  <SheetHeader>
                    <SheetTitle className="text-green-200">Filtros Avançados</SheetTitle>
                    <SheetDescription className="text-green-300">
                      Configure filtros detalhados para funcionários ativos
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-300 hover:bg-green-700/30"
                    disabled={isGeneratingReport}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isGeneratingReport ? 'Gerando...' : 'Relatórios'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="text-green-700 text-base">
                    📊 Relatórios de Funcionários Ativos
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleGerarRelatorioHTML} 
                    disabled={isGeneratingReport}
                    className="cursor-pointer p-3"
                  >
                    <FileText className="w-5 h-5 mr-3 text-orange-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">Relatório HTML</span>
                      <span className="text-xs text-gray-500 break-words">
                        Relatório visual com filtros aplicados ({funcionarios.length} registros)
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={handleGerarRelatorioExcel} 
                    disabled={isGeneratingReport}
                    className="cursor-pointer p-3"
                  >
                    <FileSpreadsheet className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold">Relatório Excel/CSV</span>
                      <span className="text-xs text-gray-500 break-words">
                        Planilha completa com filtros aplicados ({funcionarios.length} registros)
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={refetch}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-300 hover:bg-green-700/30"
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
        
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 flex-shrink-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-green-900/30 border-green-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-green-400 text-sm sm:text-base">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Total Ativos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  {loading ? '...' : (stats?.total || 0).toLocaleString('pt-BR')}
                </div>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-green-400">
                  <TrendingUp className="w-3 h-3 flex-shrink-0" />
                  <span>Funcionários em atividade</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-green-900/30 border-green-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-400 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Idade Média</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : `${(stats?.idadeMedia || 0).toFixed(0)} anos`}
                </div>
                <div className="text-xs sm:text-sm text-blue-400">
                  Idade média dos funcionários
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-green-900/30 border-green-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-400 text-sm sm:text-base">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Tempo Médio</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : `${Math.floor((stats?.tempoMedioEmpresa || 0) / 365)} anos`}
                </div>
                <div className="text-xs sm:text-sm text-purple-400">
                  Tempo médio na empresa
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-slate-800/80 to-green-900/30 border-green-500/30 backdrop-blur-sm">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-400 text-sm sm:text-base">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="leading-tight">Admissões Recentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {loading ? '...' : (stats?.admisoesRecentes || 0)}
                </div>
                <div className="text-xs sm:text-sm text-orange-400">
                  Últimos 30 dias
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filtros ativos */}
        {Object.entries(filters).some(([key, value]) => value && value !== 'Todos' && value !== '') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-green-900/30 border-green-500/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros Ativos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters)
                    .filter(([key, value]) => value && value !== 'Todos' && value !== '')
                    .map(([key, value]) => (
                      <Badge 
                        key={key} 
                        variant="outline" 
                        className="border-green-500/30 text-green-300 bg-green-500/10"
                      >
                        {key}: {value}
                        <X 
                          className="w-3 h-3 ml-1 cursor-pointer hover:text-red-400" 
                          onClick={() => updateFilter(key, key === 'departamento' || key === 'funcao' || key === 'cidade' ? 'Todos' : '')}
                        />
                      </Badge>
                    ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-green-300 hover:bg-green-500/20 h-6 px-2"
                  >
                    Limpar todos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabela de funcionários */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-1 flex flex-col"
        >
          <Card className="bg-gradient-to-br from-slate-800/80 to-green-900/30 border-green-500/30 backdrop-blur-sm flex-1 flex flex-col">
            <CardHeader className="flex-shrink-0 pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-white text-sm sm:text-base lg:text-lg">
                  Lista de Funcionários Ativos
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white">
                    {funcionarios.length} funcionários
                  </Badge>
                  {Object.entries(filters).some(([key, value]) => value && value !== 'Todos' && value !== '') && (
                    <Badge variant="outline" className="border-green-500 text-green-300">
                      Filtrado
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : funcionarios.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 text-gray-400">
                  <UserCheck className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum funcionário ativo encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros ou limpar a busca</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-green-500/20">
                          <TableHead className="text-green-300">Crachá</TableHead>
                          <TableHead className="text-green-300">Nome</TableHead>
                          <TableHead className="text-green-300">Função</TableHead>
                          <TableHead className="text-green-300">Departamento</TableHead>
                           
                          <TableHead className="text-green-300">Idade</TableHead>
                          <TableHead className="text-green-300">Admissão</TableHead>
                          <TableHead className="text-green-300">Tempo Empresa</TableHead>
                          <TableHead className="text-green-300">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {funcionariosPaginados.map((funcionario) => (
                          <TableRow key={funcionario.id} className="border-green-500/10 hover:bg-green-500/5">
                            <TableCell className="text-white font-medium">
                              {funcionario.cracha}
                            </TableCell>
                            <TableCell className="text-white">
                              <div>
                                <div className="font-medium">{funcionario.nome}</div>
                                <div className="text-xs text-gray-400">CPF: {funcionario.cpf}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-white max-w-[150px] truncate" title={funcionario.funcao}>
                              {funcionario.funcao}
                            </TableCell>
                            <TableCell className="text-white">{funcionario.departamento}</TableCell>
                             
                            <TableCell className="text-white">{funcionario.idade} anos</TableCell>
                            <TableCell className="text-white">
                              {formatDate(funcionario.dataAdmissao)}
                            </TableCell>
                            <TableCell className="text-white">
                              {funcionario.tempoEmpresaAnos} anos
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-400 hover:bg-green-500/20"
                                    onClick={() => setSelectedFuncionario(funcionario)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl bg-slate-800 border-green-500/30 text-white max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="text-green-300">
                                      Detalhes do Funcionário Ativo
                                    </DialogTitle>
                                  </DialogHeader>
                                  {selectedFuncionario && (
                                    <div className="space-y-6">
                                      {/* Status principal */}
                                      <div className="bg-green-50/10 p-4 rounded-lg border border-green-500/30">
                                        <div className="flex items-center gap-2 mb-2">
                                          <UserCheck className="w-5 h-5 text-green-400" />
                                          <h3 className="font-semibold text-green-300">
                                            Status: Funcionário Ativo
                                          </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                          <div>
                                            <strong>Empresa:</strong> {selectedFuncionario.empresa}
                                          </div>
                                          <div>
                                            <strong>Tempo na Empresa:</strong> {selectedFuncionario.tempoEmpresaAnos} anos
                                          </div>
                                          <div>
                                            <strong>Situação:</strong> Ativo
                                          </div>
                                        </div>
                                      </div>

                                      {/* Informações pessoais e profissionais */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                          <h3 className="font-semibold text-green-300 border-b border-green-500/30 pb-2">
                                            👤 Informações Pessoais
                                          </h3>
                                          <div className="space-y-2 text-sm">
                                            <div><strong>Nome:</strong> {selectedFuncionario.nome}</div>
                                            <div><strong>CPF:</strong> {selectedFuncionario.cpf}</div>
                                            <div><strong>Crachá:</strong> {selectedFuncionario.cracha}</div>
                                            <div><strong>Chapa:</strong> {selectedFuncionario.chapa}</div>
                                            <div><strong>Idade:</strong> {selectedFuncionario.idade} anos</div>
                                            {selectedFuncionario.mae && (
                                              <div><strong>Mãe:</strong> {selectedFuncionario.mae}</div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          <h3 className="font-semibold text-green-300 border-b border-green-500/30 pb-2">
                                            💼 Informações Profissionais
                                          </h3>
                                          <div className="space-y-2 text-sm">
                                            <div><strong>Função:</strong> {selectedFuncionario.funcao}</div>
                                            <div><strong>Departamento:</strong> {selectedFuncionario.departamento}</div>
                                            <div><strong>Área:</strong> {selectedFuncionario.area}</div>
                                             
                                            <div><strong>Admissão:</strong> {formatDate(selectedFuncionario.dataAdmissao)}</div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Localização e contato
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                          <h3 className="font-semibold text-green-300 border-b border-green-500/30 pb-2">
                                            📍 Localização
                                          </h3>
                                          <div className="space-y-2 text-sm">
                                            <div><strong>Cidade:</strong> {selectedFuncionario.cidade || 'N/A'}</div>
                                            {selectedFuncionario.bairro && (
                                              <div><strong>Bairro:</strong> {selectedFuncionario.bairro}</div>
                                            )}
                                            {selectedFuncionario.endereco && (
                                              <div><strong>Endereço:</strong> {selectedFuncionario.endereco}</div>
                                            )}
                                            {selectedFuncionario.casa && (
                                              <div><strong>Casa:</strong> {selectedFuncionario.casa}</div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          <h3 className="font-semibold text-green-300 border-b border-green-500/30 pb-2">
                                            📞 Contato
                                          </h3>
                                          <div className="space-y-2 text-sm">
                                            {selectedFuncionario.foneFunc && (
                                              <div><strong>Telefone 1:</strong> {selectedFuncionario.foneFunc}</div>
                                            )}
                                            {selectedFuncionario.fone2Func && (
                                              <div><strong>Telefone 2:</strong> {selectedFuncionario.fone2Func}</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      */}
                                    

                                      {/* Informações do sistema */}
                                      <div className="border-t border-green-500/20 pt-4 text-xs text-gray-400">
                                        <h4 className="font-semibold text-green-300 mb-2">🔧 Informações do Sistema</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                          <div><strong>Criado em:</strong> {formatDate(selectedFuncionario.createdAt)}</div>
                                          <div><strong>Atualizado em:</strong> {formatDate(selectedFuncionario.updatedAt)}</div>
                                          <div><strong>Sincronizado em:</strong> {formatDate(selectedFuncionario.sincronizadoEm)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-t border-green-500/20 gap-4">
                      <div className="text-sm text-gray-400">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, funcionarios.length)} de {funcionarios.length} funcionários
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="border-green-500/30 text-green-300 hover:bg-green-500/20"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                            return (
                              <Button
                                key={page}
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={page === currentPage ? 
                                  "bg-green-600 text-white" : 
                                  "border-green-500/30 text-green-300 hover:bg-green-500/20"
                                }
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="border-green-500/30 text-green-300 hover:bg-green-500/20"
                        >
                          Próximo
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Loading Overlay para Relatórios */}
      {isGeneratingReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
          <Card className="p-4 sm:p-6 lg:p-8 bg-slate-800 border-green-500/30 max-w-md w-full mx-4 shadow-2xl">
            <CardContent className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-0">
              <div className="relative flex-shrink-0">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-green-500 border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
              <div className="space-y-3 text-center sm:text-left">
                <h3 className="font-bold text-white text-lg sm:text-xl">
                  Gerando Relatório
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-tight">
                  Processando {funcionarios.length} funcionários ativos com filtros aplicados...
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Quase pronto...</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{width: '85%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}