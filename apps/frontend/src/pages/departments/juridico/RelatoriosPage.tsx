// src/pages/departments/juridico/RelatoriosPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Trash2,
  Settings,
  Save,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Filter,
  Search,
  FileSpreadsheet,
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  Database,
  Zap,
  History,
  Star,
  Share2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Importar os hooks atualizados
import { useRelatorios } from '@/hooks/useRelatorios';

// Componente para gerar relatórios rápidos
const RelatoriosRapidos = () => {
  const { 
    loading, 
    gerarESalvarRelatorioCompleto,
    gerarESalvarExcel, 
    gerarESalvarHTML,
    gerarRelatorioGeral 
  } = useRelatorios();

  const relatoriosRapidos = [
    {
      id: 'geral_completo',
      titulo: 'Relatório Geral Completo',
      descricao: 'Relatório completo com todas as estatísticas do mês atual, salvo automaticamente',
      icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
      acao: gerarESalvarRelatorioCompleto,
      formatos: ['HTML', 'Excel'],
      tempo: '~30s',
      cor: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      destaque: true
    },
    {
      id: 'excel_profissional',
      titulo: 'Excel Profissional',
      descricao: 'Planilha formatada com múltiplas abas e dados estruturados',
      icon: <FileSpreadsheet className="w-8 h-8 text-green-500" />,
      acao: gerarESalvarExcel,
      formatos: ['Excel'],
      tempo: '~20s',
      cor: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
    },
    {
      id: 'html_visual',
      titulo: 'Relatório Visual',
      descricao: 'Relatório HTML estilizado para apresentações e impressão',
      icon: <FileText className="w-8 h-8 text-orange-500" />,
      acao: gerarESalvarHTML,
      formatos: ['HTML'],
      tempo: '~15s',
      cor: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
    }
  ];

  return (
    <>
    </>
  );
};

// Componente para criar novo relatório personalizado (mantém o mesmo código anterior)
const NovoRelatorioDialog = ({ onSave, filters }) => {
  const [open, setOpen] = useState(false);
  const [relatorio, setRelatorio] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    formato: 'pdf',
    agendamento: 'manual',
    incluirFiltros: false,
    filtros: {},
    campos: []
  });

  const tiposRelatorio = [
    { value: 'multas_geral', label: 'Relatório Geral de Multas', icon: '📊' },
    { value: 'multas_transito', label: 'Multas de Trânsito', icon: '🚌' },
    { value: 'multas_semob', label: 'Multas SEMOB', icon: '🚨' },
    { value: 'agentes_ranking', label: 'Ranking de Agentes', icon: '🏆' },
    { value: 'setores_analise', label: 'Análise por Setores', icon: '🏢' },
    { value: 'financeiro', label: 'Relatório Financeiro', icon: '💰' },
    { value: 'estatistico', label: 'Relatório Estatístico', icon: '📈' }
  ];

  const camposDisponiveis = [
    { id: 'numeroMulta', label: 'Número da Multa', categoria: 'Identificação' },
    { id: 'prefixoVeiculo', label: 'Prefixo do Veículo', categoria: 'Veículo' },
    { id: 'dataHora', label: 'Data/Hora', categoria: 'Temporal' },
    { id: 'localMulta', label: 'Local da Multa', categoria: 'Localização' },
    { id: 'valorMulta', label: 'Valor da Multa', categoria: 'Financeiro' },
    { id: 'pontuacao', label: 'Pontuação', categoria: 'Infração' },
    { id: 'agenteCodigo', label: 'Código do Agente', categoria: 'Agente' },
    { id: 'grupoInfracao', label: 'Grupo da Infração', categoria: 'Infração' },
    { id: 'descricaoInfracao', label: 'Descrição da Infração', categoria: 'Infração' }
  ];

  const categoriasCampos = [...new Set(camposDisponiveis.map(c => c.categoria))];

  const handleSave = () => {
    if (relatorio.nome && relatorio.tipo) {
      const novoRelatorio = {
        ...relatorio,
        id: Date.now(),
        status: 'agendado',
        criadoEm: new Date().toISOString(),
        criadoPor: 'Leonardo',
        filtros: relatorio.incluirFiltros ? filters : {},
        downloads: 0
      };
      
      onSave(novoRelatorio);
      setOpen(false);
      setRelatorio({
        nome: '',
        descricao: '',
        tipo: '',
        formato: 'pdf',
        agendamento: 'manual',
        incluirFiltros: false,
        filtros: {},
        campos: []
      });
      
      toast.success('Relatório personalizado criado!', {
        description: 'O relatório foi adicionado à lista e será processado em breve.'
      });
    }
  };

  const handleCampoChange = (campoId, checked) => {
    setRelatorio(prev => ({
      ...prev,
      campos: checked 
        ? [...prev.campos, campoId]
        : prev.campos.filter(id => id !== campoId)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Relatório Personalizado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-6 h-6 text-green-600" />
            Criar Relatório Personalizado
          </DialogTitle>
          <DialogDescription>
            Configure um relatório personalizado com campos específicos e filtros customizados para suas necessidades.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Relatório</label>
                <Input
                  placeholder="Ex: Relatório Mensal de Multas"
                  value={relatorio.nome}
                  onChange={(e) => setRelatorio(prev => ({ ...prev, nome: e.target.value }))}
                  className="border-green-300 focus:border-green-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Relatório</label>
                <Select value={relatorio.tipo} onValueChange={(value) => setRelatorio(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger className="border-green-300 focus:border-green-500">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposRelatorio.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex items-center gap-2">
                          <span>{tipo.icon}</span>
                          <span>{tipo.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descreva o objetivo e conteúdo do relatório"
                value={relatorio.descricao}
                onChange={(e) => setRelatorio(prev => ({ ...prev, descricao: e.target.value }))}
                className="border-green-300 focus:border-green-500"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato</label>
                <Select value={relatorio.formato} onValueChange={(value) => setRelatorio(prev => ({ ...prev, formato: value }))}>
                  <SelectTrigger className="border-green-300 focus:border-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">📄 PDF</SelectItem>
                    <SelectItem value="excel">📊 Excel</SelectItem>
                    <SelectItem value="csv">📋 CSV</SelectItem>
                    <SelectItem value="json">⚙️ JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Agendamento</label>
                <Select value={relatorio.agendamento} onValueChange={(value) => setRelatorio(prev => ({ ...prev, agendamento: value }))}>
                  <SelectTrigger className="border-green-300 focus:border-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">🔧 Manual</SelectItem>
                    <SelectItem value="diario">📅 Diário</SelectItem>
                    <SelectItem value="semanal">📆 Semanal</SelectItem>
                    <SelectItem value="mensal">🗓️ Mensal</SelectItem>
                    <SelectItem value="trimestral">📊 Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <Filter className="w-5 h-5 text-purple-500" />
              Filtros e Configurações
            </h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="incluirFiltros"
                checked={relatorio.incluirFiltros}
                onCheckedChange={(checked) => setRelatorio(prev => ({ ...prev, incluirFiltros: checked }))}
              />
              <label htmlFor="incluirFiltros" className="text-sm font-medium">
                Incluir filtros atuais da página
              </label>
            </div>
            
            {relatorio.incluirFiltros && Object.keys(filters).length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Filtros que serão aplicados:
                </p>
                <div className="text-xs space-y-1">
                  {Object.entries(filters).map(([key, value]) => (
                    <div key={key} className="flex justify-between bg-white dark:bg-gray-800 p-2 rounded">
                      <span className="font-medium">{key}:</span>
                      <span className="text-green-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campos do Relatório */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              <Database className="w-5 h-5 text-orange-500" />
              Campos do Relatório
            </h3>
            
            {categoriasCampos.map(categoria => (
              <div key={categoria} className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 border-l-4 border-orange-400 pl-3">
                  {categoria}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {camposDisponiveis
                    .filter(campo => campo.categoria === categoria)
                    .map(campo => (
                      <div key={campo.id} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Checkbox 
                          id={campo.id}
                          checked={relatorio.campos.includes(campo.id)}
                          onCheckedChange={(checked) => handleCampoChange(campo.id, checked)}
                        />
                        <label htmlFor={campo.id} className="text-sm font-medium cursor-pointer">
                          {campo.label}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!relatorio.nome || !relatorio.tipo}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Criar Relatório
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente de filtros melhorado
const RelatoriosFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    busca: '',
    tipo: 'todos',
    status: 'todos',
    formato: 'todos',
    agendamento: 'todos',
    criadoPor: ''
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, v]) => v !== '' && v !== 'todos')
    );
    
    onFilterChange(cleanFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      busca: '',
      tipo: 'todos',
      status: 'todos',
      formato: 'todos',
      agendamento: 'todos',
      criadoPor: ''
    };
    setFilters(emptyFilters);
    onFilterChange({});
  };

  return (
    <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200 text-xl">
          <Filter className="w-6 h-6 text-yellow-600" />
          Filtros de Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Search className="w-4 h-4" />
              Buscar
            </label>
            <Input
              placeholder="Nome do relatório..."
              value={filters.busca}
              onChange={(e) => handleFilterChange('busca', e.target.value)}
              className="border-yellow-300 focus:border-yellow-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo
            </label>
            <Select value={filters.tipo} onValueChange={(value) => handleFilterChange('tipo', value)}>
              <SelectTrigger className="border-yellow-300 focus:border-yellow-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="multas_geral">📊 Relatório Geral</SelectItem>
                <SelectItem value="multas_transito">🚌 Multas Trânsito</SelectItem>
                <SelectItem value="multas_semob">🚨 Multas SEMOB</SelectItem>
                <SelectItem value="agentes_ranking">🏆 Ranking Agentes</SelectItem>
                <SelectItem value="financeiro">💰 Financeiro</SelectItem>
                <SelectItem value="estatistico">📈 Estatístico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="border-yellow-300 focus:border-yellow-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="concluido">✅ Concluído</SelectItem>
                <SelectItem value="processando">⏳ Processando</SelectItem>
                <SelectItem value="erro">❌ Erro</SelectItem>
                <SelectItem value="agendado">📅 Agendado</SelectItem>
                <SelectItem value="cancelado">🚫 Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Formato
            </label>
            <Select value={filters.formato} onValueChange={(value) => handleFilterChange('formato', value)}>
              <SelectTrigger className="border-yellow-300 focus:border-yellow-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Formatos</SelectItem>
                <SelectItem value="pdf">📄 PDF</SelectItem>
                <SelectItem value="excel">📊 Excel</SelectItem>
                <SelectItem value="csv">📋 CSV</SelectItem>
                <SelectItem value="json">⚙️ JSON</SelectItem>
                <SelectItem value="html">🌐 HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Agendamento
            </label>
            <Select value={filters.agendamento} onValueChange={(value) => handleFilterChange('agendamento', value)}>
              <SelectTrigger className="border-yellow-300 focus:border-yellow-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="manual">🔧 Manual</SelectItem>
                <SelectItem value="diario">📅 Diário</SelectItem>
                <SelectItem value="semanal">📆 Semanal</SelectItem>
                <SelectItem value="mensal">🗓️ Mensal</SelectItem>
                <SelectItem value="trimestral">📊 Trimestral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ações
            </label>
            <Button 
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function RelatoriosPage() {
  const navigate = useNavigate();
  const [filteredRelatorios, setFilteredRelatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  // Hook de relatórios integrado
  const {
    relatoriosSalvos,
    carregarRelatoriosSalvos,
    regenerarRelatorio,
    excluirRelatorio,
    loading: loadingRelatorio
  } = useRelatorios();

  // Carregar relatórios salvos ao montar o componente
  useEffect(() => {
    carregarRelatoriosSalvos();
  }, [carregarRelatoriosSalvos]);

  // Atualizar lista filtrada quando relatórios salvos mudarem
  useEffect(() => {
    setFilteredRelatorios(relatoriosSalvos);
  }, [relatoriosSalvos]);

  // Funções utilitárias
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'concluido': { 
        icon: <CheckCircle className="w-3 h-3" />, 
        className: 'bg-green-500 text-white',
        label: 'Concluído'
      },
      'processando': { 
        icon: <Clock className="w-3 h-3 animate-spin" />, 
        className: 'bg-blue-500 text-white',
        label: 'Processando'
      },
      'erro': { 
        icon: <XCircle className="w-3 h-3" />, 
        className: 'bg-red-500 text-white',
        label: 'Erro'
      },
      'agendado': { 
        icon: <Clock className="w-3 h-3" />, 
        className: 'bg-yellow-500 text-white',
        label: 'Agendado'
      },
      'cancelado': { 
        icon: <XCircle className="w-3 h-3" />, 
        className: 'bg-gray-500 text-white',
        label: 'Cancelado'
      }
    };

    const config = statusConfig[status] || statusConfig['erro'];
    
    return (
      <Badge className={`flex items-center gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getTipoLabel = (tipo) => {
    const tipos = {
      'multas_geral': { label: 'Geral', icon: '📊' },
      'multas_transito': { label: 'Trânsito', icon: '🚌' },
      'multas_semob': { label: 'SEMOB', icon: '🚨' },
      'agentes_ranking': { label: 'Ranking', icon: '🏆' },
      'setores_analise': { label: 'Setores', icon: '🏢' },
      'financeiro': { label: 'Financeiro', icon: '💰' },
      'estatistico': { label: 'Estatístico', icon: '📈' }
    };
    const config = tipos[tipo] || { label: tipo, icon: '📄' };
    return (
      <div className="flex items-center gap-2">
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>
    );
  };

  const getFormatoBadge = (formato) => {
    const colors = {
      'pdf': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'excel': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'csv': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'json': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'html': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    };
    
    const icons = {
      'pdf': '📄',
      'excel': '📊',
      'csv': '📋',
      'json': '⚙️',
      'html': '🌐'
    };
    
    return (
      <Badge className={colors[formato] || 'bg-gray-100 text-gray-800'}>
        <span className="mr-1">{icons[formato]}</span>
        {formato.toUpperCase()}
      </Badge>
    );
  };

  // Handlers
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    
    let filtered = relatoriosSalvos;
    
    if (newFilters.busca) {
      filtered = filtered.filter(rel => 
        rel.nome.toLowerCase().includes(newFilters.busca.toLowerCase()) ||
        rel.descricao.toLowerCase().includes(newFilters.busca.toLowerCase())
      );
    }
    
    if (newFilters.tipo) {
      filtered = filtered.filter(rel => rel.tipo === newFilters.tipo);
    }
    
    if (newFilters.status) {
      filtered = filtered.filter(rel => rel.status === newFilters.status);
    }
    
    if (newFilters.formato) {
      filtered = filtered.filter(rel => rel.formato === newFilters.formato);
    }
    
    if (newFilters.agendamento) {
      filtered = filtered.filter(rel => rel.agendamento === newFilters.agendamento);
    }
    
    if (newFilters.criadoPor) {
      filtered = filtered.filter(rel => 
        rel.criadoPor.toLowerCase().includes(newFilters.criadoPor.toLowerCase())
      );
    }
    
    setFilteredRelatorios(filtered);
  };

  const handleNovoRelatorio = (novoRelatorio) => {
    carregarRelatoriosSalvos();
  };

  const handleDownload = async (relatorio) => {
    if (relatorio.status === 'concluido') {
      try {
        await regenerarRelatorio(relatorio.id);
      } catch (error) {
        console.error('Erro ao baixar relatório:', error);
      }
    } else {
      toast.error('Relatório não disponível', {
        description: 'O relatório ainda não foi processado ou teve erro.'
      });
    }
  };

  const handleDelete = (id) => {
    excluirRelatorio(id);
  };

  const handleRefresh = () => {
    setLoading(true);
    toast.info('Atualizando lista de relatórios...');
    
    setTimeout(() => {
      carregarRelatoriosSalvos();
      setLoading(false);
      toast.success('Lista atualizada!');
    }, 1000);
  };

  // Calcular estatísticas
  const stats = {
    total: relatoriosSalvos.length,
    concluidos: relatoriosSalvos.filter(r => r.status === 'concluido').length,
    agendados: relatoriosSalvos.filter(r => r.agendamento !== 'manual').length,
    processando: relatoriosSalvos.filter(r => r.status === 'processando').length,
    totalDownloads: relatoriosSalvos.reduce((sum, r) => sum + (r.downloads || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Button
            onClick={() => navigate('/departments/juridico')}
            variant="outline"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Jurídico
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <FileText className="w-10 h-10 text-green-600" />
                </div>
                Central de Relatórios
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Gere, gerencie e baixe relatórios personalizados do sistema jurídico
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <History className="w-4 h-4" />
                  {stats.total} relatórios salvos
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {stats.totalDownloads} downloads realizados
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <NovoRelatorioDialog onSave={handleNovoRelatorio} filters={filters} />
            </div>
          </div>
        </motion.div>

        {/* Relatórios Rápidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RelatoriosRapidos />
        </motion.div>

        {/* Estatísticas Rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Concluídos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.concluidos}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Agendados</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.agendados}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Processando</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.processando}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Downloads</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalDownloads}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RelatoriosFilters onFilterChange={handleFilterChange} />
        </motion.div>

        {/* Tabela de Relatórios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-yellow-800 dark:text-yellow-200 text-xl">
                <span className="flex items-center gap-2">
                  <Database className="w-6 h-6" />
                  Relatórios Salvos
                </span>
                <Badge className="bg-yellow-500 text-white text-lg px-3 py-1">
                  {filteredRelatorios.length} relatórios
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
                  <span className="ml-3 text-lg">Carregando relatórios...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Formato</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Agendamento</TableHead>
                        <TableHead className="font-semibold">Criado em</TableHead>
                        <TableHead className="font-semibold">Última Execução</TableHead>
                        <TableHead className="font-semibold">Tamanho</TableHead>
                        <TableHead className="font-semibold">Downloads</TableHead>
                        <TableHead className="font-semibold">Criado por</TableHead>
                        <TableHead className="font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRelatorios.map((relatorio) => (
                        <TableRow key={relatorio.id} className="hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 transition-colors">
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900 dark:text-white">{relatorio.nome}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {relatorio.descricao}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {getTipoLabel(relatorio.tipo)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getFormatoBadge(relatorio.formato)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(relatorio.status)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {relatorio.agendamento === 'manual' && <span>🔧</span>}
                              {relatorio.agendamento === 'diario' && <span>📅</span>}
                              {relatorio.agendamento === 'semanal' && <span>📆</span>}
                              {relatorio.agendamento === 'mensal' && <span>🗓️</span>}
                              {relatorio.agendamento === 'trimestral' && <span>📊</span>}
                              {relatorio.agendamento}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(relatorio.criadoEm)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(relatorio.ultimaExecucao)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {relatorio.tamanho || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1 font-medium">
                              <Download className="w-3 h-3" />
                              {relatorio.downloads || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {relatorio.criadoPor}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownload(relatorio)}
                                disabled={relatorio.status !== 'concluido'}
                                title={relatorio.status === 'concluido' ? 'Baixar relatório' : 'Relatório não disponível'}
                                className={relatorio.status === 'concluido' 
                                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                                  : 'text-gray-400 cursor-not-allowed'
                                }
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Visualizar detalhes"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Compartilhar"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(relatorio.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir relatório"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {filteredRelatorios.length === 0 && !loading && (
                <div className="text-center py-16">
                  <FileText className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Nenhum relatório encontrado
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {Object.keys(filters).length > 0 
                      ? 'Nenhum relatório encontrado com os filtros aplicados. Tente ajustar os critérios de busca.'
                      : 'Você ainda não possui relatórios salvos. Comece gerando um relatório rápido ou criando um personalizado.'
                    }
                  </p>
                  <div className="flex justify-center gap-3">
                    {Object.keys(filters).length > 0 ? (
                      <Button
                        onClick={() => {
                          setFilters({});
                          handleFilterChange({});
                        }}
                        variant="outline"
                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      >
                        Limpar Filtros
                      </Button>
                    ) : (
                      <Button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        Gerar Primeiro Relatório
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Seção de Ajuda e Dicas Melhorada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-800 dark:text-blue-200 text-xl">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
                Guia de Uso e Dicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Relatórios Rápidos
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    Use os relatórios rápidos para gerar documentos instantâneos com dados atualizados. 
                    Eles são automaticamente salvos na sua lista para acesso posterior.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Salvamento automático</span>
                  </div>
                </div>
                
                <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Relatórios Personalizados
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    Crie relatórios personalizados com campos específicos, filtros customizados e 
                    agendamento automático para atender suas necessidades específicas.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Settings className="w-3 h-3" />
                    <span>Totalmente configurável</span>
                  </div>
                </div>
                
                <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Agendamento Inteligente
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    Configure relatórios para serem gerados automaticamente em intervalos regulares. 
                    Perfeito para relatórios mensais, semanais ou trimestrais.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Clock className="w-3 h-3" />
                    <span>Automação completa</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600 mt-1" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Formatos e Recursos Disponíveis
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-700 dark:text-blue-300">
                      <div className="space-y-1">
                        <p><strong>📊 Excel:</strong> Planilhas profissionais com múltiplas abas, formatação avançada e gráficos</p>
                        <p><strong>🌐 HTML:</strong> Relatórios visuais estilizados, ideais para apresentações e impressão</p>
                      </div>
                      <div className="space-y-1">
                        <p><strong>📄 PDF:</strong> Documentos profissionais para arquivamento e distribuição</p>
                        <p><strong>📋 CSV/JSON:</strong> Dados estruturados para importação em outros sistemas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status de Sistema Melhorado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-700 dark:text-green-300 text-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Status do Sistema de Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300">
                      Sistema Operacional
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Todos os serviços funcionando perfeitamente
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-300">
                      Processamento
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {stats.processando} relatórios em fila de processamento
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Última sincronização: {new Date().toLocaleString('pt-BR')}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Próxima manutenção: Domingo às 02:00
                    </p>
                    <p className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Armazenamento: {((stats.total * 2.5) / 1000).toFixed(1)}GB utilizados
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading Overlay para Relatórios */}
        {loadingRelatorio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          >
            <Card className="p-8 bg-white dark:bg-gray-800 border-yellow-200 dark:border-yellow-800 max-w-lg mx-4">
              <CardContent className="flex items-center gap-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500 border-t-transparent"></div>
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900 dark:text-white text-xl">
                    Gerando Relatório
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Coletando dados do sistema, formatando e salvando automaticamente...
                  </p>
                  <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                    <Clock className="w-4 h-4" />
                    <span>Este processo pode levar alguns segundos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>O relatório será salvo automaticamente na sua lista</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}