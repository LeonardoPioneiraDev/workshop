// src/pages/departments/juridico/MultasSemobPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Download,
  Search,
  Filter,
  Eye,
  Users,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  Target,
  Trophy,
  Medal,
  Award,
  X,
  SlidersHorizontal,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Building,
  Hash,
  Globe,
  Phone,
  Mail,
  CreditCard,
  Calendar as CalendarIcon,
  MapPinIcon,
  Info,
  FileSpreadsheet,
  MapPin,
  Calendar
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Hook para gerenciar relatórios
const useRelatorios = () => {
  const [relatorios, setRelatorios] = useState([]);

  useEffect(() => {
    const savedRelatorios = localStorage.getItem('relatorios-juridico-semob');
    if (savedRelatorios) {
      setRelatorios(JSON.parse(savedRelatorios));
    }
  }, []);

  const saveRelatorios = (newRelatorios) => {
    setRelatorios(newRelatorios);
    localStorage.setItem('relatorios-juridico-semob', JSON.stringify(newRelatorios));
  };

  const addRelatorio = (relatorio) => {
    const newRelatorios = [relatorio, ...relatorios];
    saveRelatorios(newRelatorios);
  };

  const removeRelatorio = (id) => {
    const newRelatorios = relatorios.filter(r => r.id !== id);
    saveRelatorios(newRelatorios);
  };

  const updateRelatorio = (id, updates) => {
    const newRelatorios = relatorios.map(r => 
      r.id === id ? { ...r, ...updates } : r
    );
    saveRelatorios(newRelatorios);
  };

  return {
    relatorios,
    addRelatorio,
    removeRelatorio,
    updateRelatorio
  };
};

// Hook para buscar agentes SEMOB
const useAgentesData = () => {
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAgentes = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3336/juridico/multas-enhanced/agrupamentos/agente');
      const data = await response.json();
      if (data.success) {
        // Ordenar agentes por total de multas (decrescente)
        const agentesOrdenados = data.data.sort((a, b) => parseInt(b.total) - parseInt(a.total));
        setAgentes(agentesOrdenados);
      }
    } catch (error) {
      console.error('Erro ao buscar agentes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentes();
  }, []);

  return { agentes, loading, refetch: fetchAgentes };
};

// Hook para buscar multas SEMOB
const useMultasSemob = () => {
  const [multas, setMultas] = useState([]);
  const [allMultas, setAllMultas] = useState([]);
  const [allMultasForStats, setAllMultasForStats] = useState([]); // Para estatísticas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 500,
    total: 0,
    totalPages: 0
  });

  // Função para identificar se é multa SEMOB
  const isMultaSemob = (multa) => {
    const temAgente = multa.agenteCodigo && multa.agenteCodigo.trim() !== '';
    const temPontos = multa.pontuacaoInfracao && multa.pontuacaoInfracao > 0;
    const temGrupo = multa.grupoInfracao && multa.grupoInfracao.trim() !== '';
    
    // Se tem agente E não tem pontos E não tem grupo, é SEMOB
    if (temAgente && !temPontos && !temGrupo) {
      return true;
    }
    
    // Se tem agente mas também tem pontos/grupo, é trânsito
    if (temAgente && (temPontos || temGrupo)) {
      return false;
    }
    
    // Default: se tem agente, considera SEMOB
    return temAgente;
  };

  const fetchMultas = async (newFilters = {}, page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const baseParams = {
        limit: '10000', // Buscar todos os dados
        orderBy: 'dataHoraMulta',
        orderDirection: 'DESC'
      };

      const validFilters = {};
      if (newFilters.numeroMulta) validFilters.numeroAiMulta = newFilters.numeroMulta;
      if (newFilters.prefixoVeiculo) validFilters.prefixoVeic = newFilters.prefixoVeiculo;
      if (newFilters.localMulta) validFilters.localMulta = newFilters.localMulta;
      if (newFilters.agenteCodigo) validFilters.agenteCodigo = newFilters.agenteCodigo;

      const params = new URLSearchParams({
        ...baseParams,
        ...validFilters
      });

      const response = await fetch(`http://localhost:3336/juridico/multas-completas?${params}`);
      const data = await response.json();

      if (data.success) {
        // Filtrar apenas multas SEMOB
        let multasSemob = data.data.filter(isMultaSemob);
        
        // Salvar TODAS as multas SEMOB para estatísticas (sem filtros locais)
        setAllMultasForStats(multasSemob);
        
        // Aplicar filtros localmente
        if (newFilters.dataInicio) {
          const dataInicio = new Date(newFilters.dataInicio);
          multasSemob = multasSemob.filter(m => new Date(m.dataHoraMulta) >= dataInicio);
        }
        
        if (newFilters.dataFim) {
          const dataFim = new Date(newFilters.dataFim);
          dataFim.setHours(23, 59, 59, 999);
          multasSemob = multasSemob.filter(m => new Date(m.dataHoraMulta) <= dataFim);
        }
        
        if (newFilters.valorMin) {
          multasSemob = multasSemob.filter(m => parseFloat(m.valorMulta || 0) >= parseFloat(newFilters.valorMin));
        }
        
        if (newFilters.valorMax) {
          multasSemob = multasSemob.filter(m => parseFloat(m.valorMulta || 0) <= parseFloat(newFilters.valorMax));
        }
        
        if (newFilters.grupoInfracao) {
          multasSemob = multasSemob.filter(m => m.grupoInfracao === newFilters.grupoInfracao);
        }
        
        // Salvar todas as multas filtradas para relatórios
        setAllMultas(multasSemob);
        
        // Aplicar paginação apenas na visualização
        const startIndex = (page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedMultas = multasSemob.slice(startIndex, endIndex);
        
        setMultas(paginatedMultas);
        setPagination(prev => ({
          ...prev,
          page,
          total: multasSemob.length,
          totalPages: Math.ceil(multasSemob.length / prev.limit)
        }));
      } else {
        throw new Error(data.message || 'Erro ao carregar multas SEMOB');
      }
    } catch (err) {
      console.error('Erro ao buscar multas SEMOB:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultas();
  }, []);

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchMultas(newFilters, 1);
  };

  const changePage = (newPage) => {
    fetchMultas(filters, newPage);
  };

  return {
    multas,
    allMultas,
    allMultasForStats,
    loading,
    error,
    pagination,
    filters,
    applyFilters,
    changePage,
    refetch: () => fetchMultas(filters, pagination.page)
  };
};

// Componente Modal de Detalhes da Multa SEMOB
const MultaSemobDetailsModal = ({ multa, isOpen, onClose }) => {
  const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (multa) => {
    if (multa.dataPagtoMulta) {
      return { status: 'Pago', color: 'text-green-700', bgColor: 'bg-green-100', icon: '✅' };
    }
    
    if (multa.condicaoRecursoMulta && multa.condicaoRecursoMulta !== 'I') {
      return { status: 'Em Recurso', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: '⚖️' };
    }
    
    const vencimento = new Date(multa.dataVectoMulta);
    const hoje = new Date();
    
    if (vencimento < hoje) {
      return { status: 'Vencido', color: 'text-red-700', bgColor: 'bg-red-100', icon: '⏰' };
    }
    
    return { status: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: '⏳' };
  };

  if (!multa) return null;

  const statusInfo = getStatusInfo(multa);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-white dark:bg-gray-900 border-2 border-orange-300 dark:border-orange-600 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 -m-6 mb-6 p-6 border-b border-orange-200 dark:border-orange-700">
          <DialogTitle className="flex items-center gap-4 text-2xl text-orange-800 dark:text-orange-200">
            <div className="p-3 bg-orange-200 dark:bg-orange-700 rounded-xl shadow-lg">
              <AlertTriangle className="w-8 h-8 text-orange-700 dark:text-orange-200" />
            </div>
            <div>
              <span className="font-bold">Detalhes da Multa SEMOB</span>
              <p className="text-lg font-mono text-orange-700 dark:text-orange-300 mt-1">
                {multa.numeroAiMulta}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(95vh-140px)] pr-4">
          <div className="space-y-6">
            
            {/* Status e Informações Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-orange-200 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <Info className="w-5 h-5" />
                    Informações Principais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-orange-600" />
                        Número da Multa
                      </label>
                      <p className="font-mono text-lg font-bold bg-white dark:bg-gray-800 p-2 rounded border">
                        {multa.numeroAiMulta}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        Prefixo do Veículo
                      </label>
                      <p className="text-lg font-bold text-orange-700 dark:text-orange-300 bg-white dark:bg-gray-800 p-2 rounded border">
                        {multa.prefixoVeic}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-600" />
                      Status da Multa
                    </label>
                    <div className={`p-3 rounded-lg border-2 ${statusInfo.bgColor} border-current`}>
                      <p className={`text-lg font-bold ${statusInfo.color} flex items-center gap-2`}>
                        <span className="text-2xl">{statusInfo.icon}</span>
                        {statusInfo.status}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <DollarSign className="w-5 h-5" />
                    Valores e Agente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Valor da Multa
                    </label>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 p-3 rounded border">
                      {formatCurrency(multa.valorMulta)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      Agente SEMOB
                    </label>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                      <p className="font-bold text-blue-700 dark:text-blue-300">
                        {multa.agenteCodigo}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {multa.agenteDescricao || 'Descrição não disponível'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Target className="w-4 h-4 text-red-600" />
                        Pontos CNH
                      </label>
                      <p className="text-xl font-bold text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 p-2 rounded border text-center">
                        {multa.pontuacaoInfracao || 0} pts
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Tipo
                      </label>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                        <Badge className="bg-orange-500 text-white w-full justify-center">
                          Multa SEMOB
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações da Infração */}
            <Card className="border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <FileText className="w-5 h-5" />
                  Detalhes da Infração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                    Descrição da Infração
                  </label>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {multa.descricaoInfra || 'Descrição não informada'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                      Código da Infração
                    </label>
                    <p className="font-mono bg-white dark:bg-gray-800 p-3 rounded border text-center font-bold">
                      {multa.codigoInfracao || 'Não informado'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                      Gravidade
                    </label>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                      <Badge className={
                        multa.grupoInfracao === 'LEVE' ? 'bg-green-500 text-white w-full justify-center' :
                        multa.grupoInfracao === 'MEDIA' ? 'bg-yellow-500 text-white w-full justify-center' :
                        multa.grupoInfracao === 'GRAVE' ? 'bg-orange-500 text-white w-full justify-center' :
                        multa.grupoInfracao === 'GRAVISSIMA' ? 'bg-red-500 text-white w-full justify-center' :
                        'bg-gray-500 text-white w-full justify-center'
                      }>
                        {multa.grupoInfracao || 'Não informado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações de Local e Data */}
            <Card className="border-2 border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  <MapPinIcon className="w-5 h-5" />
                  Local e Data da Infração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        Local da Multa
                      </label>
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                          {multa.localMulta || 'Local não informado'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                        Cidade
                      </label>
                      <p className="bg-white dark:bg-gray-800 p-3 rounded border">
                        {multa.cidadeMulta || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        Data e Hora da Infração
                      </label>
                      <p className="font-mono bg-white dark:bg-gray-800 p-3 rounded border text-center font-bold text-purple-700 dark:text-purple-300">
                        {formatDate(multa.dataHoraMulta)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-purple-600" />
                        Data de Vencimento
                      </label>
                      <p className="font-mono bg-white dark:bg-gray-800 p-3 rounded border text-center font-bold text-red-700 dark:text-red-300">
                        {formatDate(multa.dataVectoMulta)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Veículo */}
            <Card className="border-2 border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="w-5 h-5" />
                  Informações do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                      Prefixo do Veículo
                    </label>
                    <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300 bg-white dark:bg-gray-800 p-3 rounded border text-center">
                      {multa.prefixoVeic}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                      Placa do Veículo
                    </label>
                    <p className="font-mono bg-white dark:bg-gray-800 p-3 rounded border text-center font-bold">
                      {multa.placaVeiculo || 'Não informado'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                      Categoria
                    </label>
                    <p className="bg-white dark:bg-gray-800 p-3 rounded border text-center">
                      {multa.categoriaVeiculo || 'Não informado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações de Pagamento (se houver) */}
            {(multa.dataPagtoMulta || multa.valorPago) && (
              <Card className="border-2 border-green-300 dark:border-green-600 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <CreditCard className="w-5 h-5" />
                    Informações de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {multa.dataPagtoMulta && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                          Data do Pagamento
                        </label>
                        <p className="font-mono text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 p-3 rounded border text-center font-bold">
                          {formatDate(multa.dataPagtoMulta)}
                        </p>
                      </div>
                    )}
                    
                    {multa.valorPago && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                          Valor Pago
                        </label>
                        <p className="text-xl font-bold text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 p-3 rounded border text-center">
                          {formatCurrency(multa.valorPago)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações Técnicas */}
            <Card className="border-2 border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Info className="w-5 h-5" />
                  Informações Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      Agente SEMOB
                    </label>
                    <p className="bg-white dark:bg-gray-800 p-2 rounded border text-sm font-bold text-orange-600">
                      {multa.agenteCodigo}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      Tipo de Multa
                    </label>
                    <Badge className="bg-orange-500 text-white w-full justify-center">
                      Multa SEMOB
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      Condição do Recurso
                    </label>
                    <p className="bg-white dark:bg-gray-800 p-2 rounded border text-sm">
                      {multa.condicaoRecursoMulta || 'Não informado'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      Setor Atual
                    </label>
                    <p className="bg-white dark:bg-gray-800 p-2 rounded border text-sm">
                      {multa.setorAtual || 'Não informado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        
        {/* Footer do Modal */}
        <div className="flex justify-end gap-3 pt-4 border-t border-orange-200 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/20 -m-6 mt-6 p-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-2 border-orange-400 text-orange-700 hover:bg-orange-100 font-semibold"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente de filtros SEMOB melhorado
const MultasSemobFilters = ({ onFilterChange, loading, activeFilters, agentes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    numeroMulta: '',
    prefixoVeiculo: '',
    agenteCodigo: '',
    dataInicio: '',
    dataFim: '',
    valorMin: '',
    valorMax: '',
    localMulta: '',
    grupoInfracao: ''
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, v]) => v !== '')
    );
    
    onFilterChange(cleanFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      numeroMulta: '',
      prefixoVeiculo: '',
      agenteCodigo: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      localMulta: '',
      grupoInfracao: ''
    };
    setFilters(emptyFilters);
    onFilterChange({});
  };

  const activeFiltersCount = Object.keys(activeFilters || {}).length;

  return (
    <Card className="border-2 border-orange-300/50 dark:border-orange-600/50 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20 shadow-lg">
      <CardHeader 
        className="cursor-pointer hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-orange-800 dark:text-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-200 dark:bg-orange-700 rounded-lg">
              <SlidersHorizontal className="w-5 h-5 text-orange-700 dark:text-orange-200" />
            </div>
            <span className="text-base sm:text-lg">Filtros Avançados - SEMOB</span>
            {activeFiltersCount > 0 && (
              <Badge className="bg-orange-500 text-white">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              className="text-orange-700 hover:bg-orange-200 dark:text-orange-300 dark:hover:bg-orange-800 hidden sm:flex"
            >
              <X className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 transition-transform" />
            ) : (
              <ChevronDown className="w-5 h-5 transition-transform" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Número da Multa
                </label>
                <Input
                  placeholder="Ex: SM01140764"
                  value={filters.numeroMulta}
                  onChange={(e) => handleFilterChange('numeroMulta', e.target.value)}
                  className="border-2 border-orange-300 focus:border-orange-500 bg-white dark:bg-gray-800 shadow-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Prefixo do Veículo
                </label>
                <Input
                  placeholder="Ex: 0227757"
                  value={filters.prefixoVeiculo}
                  onChange={(e) => handleFilterChange('prefixoVeiculo', e.target.value)}
                  className="border-2 border-orange-300 focus:border-orange-500 bg-white dark:bg-gray-800 shadow-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Agente SEMOB
                </label>
                <Select 
                  value={filters.agenteCodigo || "todos"} 
                  onValueChange={(value) => handleFilterChange('agenteCodigo', value === "todos" ? "" : value)}
                >
                  <SelectTrigger className="border-2 border-orange-300 focus:border-orange-500 bg-white dark:bg-gray-800 shadow-sm">
                    <SelectValue placeholder="Selecione o agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Agentes</SelectItem>
                    {agentes.map((agente) => (
                      <SelectItem key={agente.codigo} value={agente.codigo}>
                        {agente.codigo} - {agente.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data Início
                </label>
                <Input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                  className="border-2 border-orange-300 focus:border-orange-500 bg-white dark:bg-gray-800 shadow-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                  className="border-2 border-orange-300 focus:border-orange-500 bg-white dark:bg-gray-800 shadow-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor Mínimo (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.valorMin}
                  onChange={(e) => handleFilterChange('valorMin', e.target.value)}
                  className="border-2 border-orange-300 focus:border-orange-500 bg-white dark:bg-gray-800 shadow-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor Máximo (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="999.99"
                  value={filters.valorMax}
                  onChange={(e) => handleFilterChange('valorMax', e.target.value)}
                  className="border-2 border-orange-300 focus:border-orange-500 bg-white dark:bg-gray-800 shadow-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Local da Multa
                </label>
                <Input
                  placeholder="Ex: SETOR COMERCIAL"
                  value={filters.localMulta}
                  onChange={(e) => handleFilterChange('localMulta', e.target.value)}
                  className="border-2 border-orange-300 focus:border-orange-500 bg-white dark:bg-gray-800 shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
              <Button 
                variant="outline"
                onClick={clearFilters}
                className="w-full sm:w-auto border-2 border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold sm:hidden"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
              
              <Button 
                size="lg" 
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-2 shadow-lg"
                onClick={() => onFilterChange(filters)}
              >
                <Search className="w-5 h-5 mr-2" />
                {loading ? 'Buscando...' : 'Aplicar Filtros'}
              </Button>
            </div>
          </CardContent>
        </motion.div>
      )}
    </Card>
  );
};

// Continuação do MultasSemobPage.tsx

// Componente de ranking de agentes melhorado
// Componente de ranking de agentes melhorado e corrigido
const RankingAgentes = ({ agentes, loading }) => {
  const getRankingIcon = (index) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Award className="w-6 h-6 text-orange-600" />;
      default: return (
        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {index + 1}
        </div>
      );
    }
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value || 0);
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    });
  };

  // Função para calcular valor médio com segurança
  const calcularValorMedio = (agente) => {
    const valorTotal = parseFloat(agente.valorTotal || 0);
    const total = parseInt(agente.total || 0);
    
    if (total === 0 || isNaN(valorTotal) || isNaN(total)) {
      return 0;
    }
    
    return valorTotal / total;
  };

  // Função para calcular percentual com segurança
  const calcularPercentual = (agente, totalGeral) => {
    const total = parseInt(agente.total || 0);
    
    if (totalGeral === 0 || isNaN(total)) {
      return 0;
    }
    
    return (total / totalGeral) * 100;
  };

  // Calcular total geral de multas para percentual
  const totalGeralMultas = agentes.reduce((sum, agente) => {
    return sum + parseInt(agente.total || 0);
  }, 0);


};

// Componente de filtros ativos
const FiltrosAtivos = ({ filters, onRemoveFilter, totalFiltrado, totalGeral }) => {
  const activeFilters = Object.entries(filters).filter(([_, value]) => value !== '');
  
  if (activeFilters.length === 0) return null;

  const filterLabels = {
    numeroMulta: 'Número da Multa',
    prefixoVeiculo: 'Prefixo do Veículo',
    agenteCodigo: 'Agente SEMOB',
    dataInicio: 'Data Início',
    dataFim: 'Data Fim',
    valorMin: 'Valor Mínimo',
    valorMax: 'Valor Máximo',
    localMulta: 'Local da Multa',
    grupoInfracao: 'Gravidade'
  };

  return (
    <Card className="border-2 border-blue-300/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros Ativos ({activeFilters.length})
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">{totalFiltrado.toLocaleString('pt-BR')}</span> de{' '}
              <span className="font-semibold">{totalGeral.toLocaleString('pt-BR')}</span> registros{' '}
              <Badge className="bg-blue-500 text-white ml-2">
                {((totalFiltrado / totalGeral) * 100).toFixed(1)}%
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(([key, value]) => (
              <Badge 
                key={key} 
                className="bg-blue-100 text-blue-800 border border-blue-300 px-3 py-1 flex items-center gap-2 hover:bg-blue-200 transition-colors"
              >
                <span className="font-medium">{filterLabels[key]}:</span>
                <span>{value}</span>
                <button
                  onClick={() => onRemoveFilter(key)}
                  className="ml-1 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Funções de exportação para SEMOB
const exportToHTML = async (multas, filters, addRelatorio, allMultasForStats) => {
  const relatorioId = `html-semob-${Date.now()}`;
  
  const totalValorFiltrado = multas.reduce((sum, multa) => sum + parseFloat(multa.valorMulta || 0), 0);
  const totalPontosFiltrado = multas.reduce((sum, multa) => sum + (multa.pontuacaoInfracao || 0), 0);
  const agentesUnicosFiltrado = new Set(multas.map(m => m.agenteCodigo)).size;
  
  const totalValorGeral = allMultasForStats.reduce((sum, multa) => sum + parseFloat(multa.valorMulta || 0), 0);
  const totalPontosGeral = allMultasForStats.reduce((sum, multa) => sum + (multa.pontuacaoInfracao || 0), 0);
  
  const relatorio = {
    id: relatorioId,
    nome: `Relatório HTML - Multas SEMOB - ${new Date().toLocaleDateString('pt-BR')}`,
    descricao: `Relatório filtrado com ${multas.length} de ${allMultasForStats.length} multas SEMOB`,
    tipo: 'multas_semob',
    formato: 'html',
    status: 'processando',
    criadoEm: new Date().toISOString(),
    ultimaExecucao: new Date().toISOString(),
    proximaExecucao: null,
    agendamento: 'manual',
    tamanho: null,
    registros: multas.length,
    criadoPor: 'Leonardo',
    filtros: filters,
    dados: {
      totalValor: totalValorFiltrado,
      totalPontos: totalPontosFiltrado,
      agentesUnicos: agentesUnicosFiltrado,
      percentualDoTotal: ((multas.length / allMultasForStats.length) * 100).toFixed(1)
    }
  };

  addRelatorio(relatorio);

  try {
    const formatCurrency = (value) => {
      return parseFloat(value || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'Não informado';
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getStatusText = (multa) => {
      if (multa.dataPagtoMulta) return 'Pago';
      if (multa.condicaoRecursoMulta && multa.condicaoRecursoMulta !== 'I') return 'Em Recurso';
      const vencimento = new Date(multa.dataVectoMulta);
      const hoje = new Date();
      if (vencimento < hoje) return 'Vencido';
      return 'Pendente';
    };

    const filtersApplied = Object.keys(filters).length > 0;
    const filtersText = filtersApplied ? Object.entries(filters)
      .map(([key, value]) => {
        const labels = {
          numeroMulta: 'Número da Multa',
          prefixoVeiculo: 'Prefixo do Veículo',
          agenteCodigo: 'Agente SEMOB',
          dataInicio: 'Data Início',
          dataFim: 'Data Fim',
          valorMin: 'Valor Mínimo',
          valorMax: 'Valor Máximo',
          localMulta: 'Local da Multa',
          grupoInfracao: 'Gravidade'
        };
        return `${labels[key] || key}: ${value}`;
      })
      .join(', ') : 'Nenhum filtro aplicado - Mostrando todos os registros';

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório de Multas SEMOB - ${new Date().toLocaleDateString('pt-BR')}</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: linear-gradient(135deg, #fed7aa 0%, #fb923c 100%);
                  color: #333;
                  min-height: 100vh;
              }
              .container {
                  max-width: 1400px;
                  margin: 0 auto;
                  background: white;
                  border-radius: 15px;
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                  overflow: hidden;
              }
              .header {
                  background: linear-gradient(135deg, #ea580c, #dc2626);
                  color: white;
                  padding: 40px;
                  text-align: center;
                  position: relative;
              }
              .header::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"/><circle cx="80" cy="80" r="2" fill="white" opacity="0.1"/><circle cx="50" cy="50" r="1" fill="white" opacity="0.2"/></svg>');
              }
              .header-content {
                  position: relative;
                  z-index: 1;
              }
              .header h1 {
                  margin: 0;
                  font-size: 3em;
                  font-weight: bold;
                  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              }
              .header p {
                  margin: 15px 0 0 0;
                  font-size: 1.3em;
                  opacity: 0.95;
              }
              .summary {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                  gap: 25px;
                  margin: 40px;
              }
              .summary-card {
                  background: linear-gradient(135deg, #fff 0%, #fed7aa 100%);
                  padding: 30px;
                  border-radius: 15px;
                  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                  border-left: 6px solid #ea580c;
                  transition: transform 0.3s ease;
              }
              .summary-card:hover {
                  transform: translateY(-5px);
              }
              .summary-card h3 {
                  margin: 0 0 15px 0;
                  color: #dc2626;
                  font-size: 1.2em;
                  font-weight: bold;
              }
              .summary-card p {
                  margin: 0;
                  font-size: 2.2em;
                  font-weight: bold;
                  color: #1f2937;
              }
              .summary-card .subtitle {
                  font-size: 0.9em;
                  color: #6b7280;
                  margin-top: 8px;
                  font-weight: normal;
              }
              .comparison {
                  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                  margin: 20px 40px;
                  padding: 25px;
                  border-radius: 15px;
                  border-left: 6px solid #3b82f6;
              }
              .comparison h3 {
                  margin: 0 0 15px 0;
                  color: #1e40af;
                  font-size: 1.3em;
              }
              .comparison-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 15px;
              }
              .comparison-item {
                  background: white;
                  padding: 15px;
                  border-radius: 10px;
                  text-align: center;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              }
              .filters {
                  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                  padding: 25px 40px;
                  border-top: 1px solid #d1d5db;
                  border-bottom: 1px solid #d1d5db;
              }
              .filters h3 {
                  margin: 0 0 15px 0;
                  color: #374151;
                  font-size: 1.3em;
              }
              .filters p {
                  margin: 0;
                  color: #6b7280;
                  font-style: italic;
                  background: white;
                  padding: 15px;
                  border-radius: 10px;
                  border-left: 4px solid #ea580c;
              }
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 40px;
                  width: calc(100% - 80px);
                  background: white;
                  border-radius: 15px;
                  overflow: hidden;
                  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
              }
              th {
                  background: linear-gradient(135deg, #ea580c, #dc2626);
                  color: white;
                  padding: 18px 12px;
                  text-align: left;
                  font-weight: bold;
                  font-size: 0.95em;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              td {
                  padding: 15px 12px;
                  border-bottom: 1px solid #f3f4f6;
                  font-size: 0.9em;
              }
              tr:nth-child(even) {
                  background: linear-gradient(135deg, #fef3f2 0%, #fed7aa 100%);
              }
              tr:hover {
                  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
                  transform: scale(1.01);
                  transition: all 0.2s ease;
              }
              .status-pago { 
                  color: #059669; 
                  font-weight: bold; 
                  background: #d1fae5; 
                  padding: 4px 8px; 
                  border-radius: 6px; 
              }
              .status-em-recurso { 
                  color: #0284c7; 
                  font-weight: bold; 
                  background: #dbeafe; 
                  padding: 4px 8px; 
                  border-radius: 6px; 
              }
              .status-vencido { 
                  color: #dc2626; 
                  font-weight: bold; 
                  background: #fecaca; 
                  padding: 4px 8px; 
                  border-radius: 6px; 
              }
              .status-pendente { 
                  color: #d97706; 
                  font-weight: bold; 
                  background: #fed7aa; 
                  padding: 4px 8px; 
                  border-radius: 6px; 
              }
              .footer {
                  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                  padding: 40px;
                  text-align: center;
                  color: #6b7280;
                  border-top: 1px solid #d1d5db;
              }
              .footer-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                  gap: 20px;
                  margin-bottom: 20px;
              }
              .footer-item {
                  background: white;
                  padding: 20px;
                  border-radius: 10px;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              }
              .report-id {
                  background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
                  padding: 15px;
                  border-radius: 10px;
                  margin: 20px 40px;
                  text-align: center;
                  font-size: 1em;
                  color: #0277bd;
                  border: 2px solid #29b6f6;
              }
              .print-button {
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: linear-gradient(135deg, #ea580c, #dc2626);
                  color: white;
                  border: none;
                  padding: 15px 25px;
                  border-radius: 30px;
                  cursor: pointer;
                  font-weight: bold;
                  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                  z-index: 1000;
                  transition: all 0.3s ease;
                  font-size: 14px;
              }
              .print-button:hover {
                  transform: scale(1.05);
                  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
              }
              @media print {
                  body { background: white; }
                  .container { box-shadow: none; }
                  .print-button { display: none; }
                  .summary-card, .comparison, .footer-item { box-shadow: none; }
              }
              @media (max-width: 768px) {
                  .summary, table { margin: 20px; width: calc(100% - 40px); }
                  .filters { padding: 20px; }
                  th, td { padding: 10px 8px; font-size: 0.8em; }
                  .header h1 { font-size: 2em; }
              }
          </style>
      </head>
      <body>
          <button class="print-button" onclick="window.print()">🖨️ Imprimir Relatório</button>
          
          <div class="container">
              <div class="report-id">
                  <strong>🆔 ID do Relatório:</strong> ${relatorioId} | 
                  <strong>👤 Gerado por:</strong> Leonardo | 
                  <strong>🏢 Sistema:</strong> Viação Pioneira | 
                  <strong>📊 Tipo:</strong> Multas SEMOB
              </div>

              <div class="header">
                  <div class="header-content">
                      <h1>🚨 Relatório de Multas SEMOB</h1>
                      <p>Viação Pioneira - Departamento Jurídico</p>
                      <p>📅 Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                  </div>
              </div>

              <div class="summary">
                  <div class="summary-card">
                      <h3>📊 Multas Filtradas</h3>
                      <p>${multas.length.toLocaleString('pt-BR')}</p>
                      <div class="subtitle">
                          ${((multas.length / allMultasForStats.length) * 100).toFixed(1)}% do total de ${allMultasForStats.length.toLocaleString('pt-BR')} multas SEMOB
                      </div>
                  </div>
                  <div class="summary-card">
                      <h3>💰 Valor Total (Filtrado)</h3>
                      <p>${formatCurrency(totalValorFiltrado)}</p>
                      <div class="subtitle">
                          Média: ${formatCurrency(multas.length > 0 ? totalValorFiltrado / multas.length : 0)} por multa
                      </div>
                  </div>
                  <div class="summary-card">
                      <h3>👮 Agentes Únicos</h3>
                      <p>${agentesUnicosFiltrado}</p>
                      <div class="subtitle">
                          Agentes SEMOB diferentes
                      </div>
                  </div>
                  <div class="summary-card">
                      <h3>🎯 Pontos CNH (Filtrado)</h3>
                      <p>${totalPontosFiltrado.toLocaleString('pt-BR')}</p>
                      <div class="subtitle">
                          Média: ${multas.length > 0 ? (totalPontosFiltrado / multas.length).toFixed(1) : 0} pontos por multa
                      </div>
                  </div>
              </div>

              <div class="comparison">
                  <h3>📈 Comparativo: Dados Filtrados vs Total Geral SEMOB</h3>
                  <div class="comparison-grid">
                      <div class="comparison-item">
                          <strong>Multas</strong><br>
                          ${multas.length.toLocaleString('pt-BR')} / ${allMultasForStats.length.toLocaleString('pt-BR')}<br>
                          <small>(${((multas.length / allMultasForStats.length) * 100).toFixed(1)}%)</small>
                      </div>
                      <div class="comparison-item">
                          <strong>Valor</strong><br>
                          ${formatCurrency(totalValorFiltrado)}<br>
                          <small>de ${formatCurrency(totalValorGeral)}</small>
                      </div>
                      <div class="comparison-item">
                          <strong>Agentes</strong><br>
                          ${agentesUnicosFiltrado}<br>
                          <small>agentes únicos</small>
                      </div>
                  </div>
              </div>

              <div class="filters">
                  <h3>🔍 Filtros Aplicados neste Relatório</h3>
                  <p>${filtersText}</p>
              </div>

              <table>
                  <thead>
                      <tr>
                          <th>Número</th>
                          <th>Veículo</th>
                          <th>Agente SEMOB</th>
                          <th>Data/Hora</th>
                          <th>Local</th>
                          <th>Infração</th>
                          <th>Valor</th>
                          <th>Pontos</th>
                          <th>Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${multas.map(multa => `
                          <tr>
                              <td style="font-family: monospace; font-weight: bold;">${multa.numeroAiMulta}</td>
                              <td><strong style="color: #dc2626;">${multa.prefixoVeic}</strong></td>
                              <td>
                                  <strong style="color: #ea580c;">${multa.agenteCodigo}</strong><br>
                                  <small style="color: #6b7280;">${multa.agenteDescricao || 'N/A'}</small>
                              </td>
                              <td style="font-family: monospace;">${formatDate(multa.dataHoraMulta)}</td>
                              <td style="max-width: 200px;">${multa.localMulta || 'Não informado'}</td>
                              <td style="max-width: 300px;">${(multa.descricaoInfra || 'Não informado').substring(0, 80)}${(multa.descricaoInfra || '').length > 80 ? '...' : ''}</td>
                              <td><strong style="color: #059669;">${formatCurrency(multa.valorMulta)}</strong></td>
                              <td style="text-align: center; font-weight: bold;">${multa.pontuacaoInfracao || 0}</td>
                              <td><span class="status-${getStatusText(multa).toLowerCase().replace(' ', '-')}">${getStatusText(multa)}</span></td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>

              <div class="footer">
                  <div class="footer-grid">
                      <div class="footer-item">
                          <strong>📅 Data de Geração</strong><br>
                          ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
                      </div>
                      <div class="footer-item">
                          <strong>👤 Gerado por</strong><br>
                          Leonardo
                      </div>
                      <div class="footer-item">
                          <strong>🏢 Sistema</strong><br>
                          Viação Pioneira v1.0
                      </div>
                      <div class="footer-item">
                          <strong>📊 Registros</strong><br>
                          ${multas.length.toLocaleString('pt-BR')} multas processadas
                      </div>
                  </div>
                  <hr style="margin: 30px 0; border: none; border-top: 2px solid #d1d5db;">
                  <p><strong>Relatório Automatizado de Multas SEMOB</strong></p>
                  <p style="font-size: 0.9em; margin-top: 10px;">
                      Sistema de Gestão Jurídica - Viação Pioneira | ID: ${relatorioId}
                  </p>
              </div>
          </div>

          <script>
              document.addEventListener('DOMContentLoaded', function() {
                  console.log('📊 Relatório HTML de Multas SEMOB carregado com sucesso');
                  console.log('📋 ID do Relatório: ${relatorioId}');
                  console.log('📊 Total de registros: ${multas.length}');
                  
                  const cards = document.querySelectorAll('.summary-card');
                  cards.forEach((card, index) => {
                      card.style.animationDelay = (index * 0.1) + 's';
                      card.style.animation = 'fadeInUp 0.6s ease-out forwards';
                  });
                  
                  const rows = document.querySelectorAll('tbody tr');
                  rows.forEach(row => {
                      row.addEventListener('mouseenter', function() {
                          this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      });
                      row.addEventListener('mouseleave', function() {
                          this.style.boxShadow = 'none';
                      });
                  });
              });
              
              const style = document.createElement('style');
              style.textContent = \`
                  @keyframes fadeInUp {
                      from {
                          opacity: 0;
                          transform: translateY(30px);
                      }
                      to {
                          opacity: 1;
                          transform: translateY(0);
                      }
                  }
              \`;
              document.head.appendChild(style);
          </script>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const tamanhoMB = (blob.size / (1024 * 1024)).toFixed(2);

    setTimeout(() => {
      addRelatorio({ 
        ...relatorio, 
        status: 'concluido', 
        tamanho: `${tamanhoMB} MB`,
        descricao: `Relatório filtrado com ${multas.length} de ${allMultasForStats.length} multas SEMOB (${((multas.length / allMultasForStats.length) * 100).toFixed(1)}% do total)`
      });
    }, 1500);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `multas-semob-${new Date().toISOString().split('T')[0]}-${relatorioId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return relatorioId;

  } catch (error) {
    setTimeout(() => {
      addRelatorio({ ...relatorio, status: 'erro' });
    }, 1000);
    throw error;
  }
};

const exportToExcel = async (multas, filters, addRelatorio, allMultasForStats) => {
  const relatorioId = `excel-semob-${Date.now()}`;
  
  const totalValorFiltrado = multas.reduce((sum, multa) => sum + parseFloat(multa.valorMulta || 0), 0);
  const totalPontosFiltrado = multas.reduce((sum, multa) => sum + (multa.pontuacaoInfracao || 0), 0);
  const agentesUnicosFiltrado = new Set(multas.map(m => m.agenteCodigo)).size;
  
  const totalValorGeral = allMultasForStats.reduce((sum, multa) => sum + parseFloat(multa.valorMulta || 0), 0);
  const totalPontosGeral = allMultasForStats.reduce((sum, multa) => sum + (multa.pontuacaoInfracao || 0), 0);
  const agentesUnicosGeral = new Set(allMultasForStats.map(m => m.agenteCodigo)).size;
  
  const relatorio = {
    id: relatorioId,
    nome: `Relatório Excel - Multas SEMOB - ${new Date().toLocaleDateString('pt-BR')}`,
    descricao: `Planilha filtrada com ${multas.length} de ${allMultasForStats.length} multas SEMOB`,
    tipo: 'multas_semob',
    formato: 'excel',
    status: 'processando',
    criadoEm: new Date().toISOString(),
    ultimaExecucao: new Date().toISOString(),
    proximaExecucao: null,
    agendamento: 'manual',
    tamanho: null,
    registros: multas.length,
    criadoPor: 'Leonardo',
    filtros: filters,
    dados: {
      totalValor: totalValorFiltrado,
      totalPontos: totalPontosFiltrado,
      agentesUnicos: agentesUnicosFiltrado,
      percentualDoTotal: ((multas.length / allMultasForStats.length) * 100).toFixed(1)
    }
  };

  addRelatorio(relatorio);

  try {
    const formatCurrency = (value) => {
      return parseFloat(value || 0);
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'Não informado';
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getStatusText = (multa) => {
      if (multa.dataPagtoMulta) return 'Pago';
      if (multa.condicaoRecursoMulta && multa.condicaoRecursoMulta !== 'I') return 'Em Recurso';
      const vencimento = new Date(multa.dataVectoMulta);
      const hoje = new Date();
      if (vencimento < hoje) return 'Vencido';
      return 'Pendente';
    };

    // 1. ABA PRINCIPAL - Dados das Multas SEMOB
    const excelData = multas.map(multa => ({
      'ID do Relatório': relatorioId,
      'Número da Multa': multa.numeroAiMulta,
      'Prefixo do Veículo': multa.prefixoVeic,
      'Agente SEMOB': multa.agenteCodigo,
      'Descrição do Agente': multa.agenteDescricao || 'Não informado',
      'Data/Hora da Infração': formatDate(multa.dataHoraMulta),
      'Local da Multa': multa.localMulta || 'Não informado',
      'Descrição da Infração': multa.descricaoInfra || 'Não informado',
      'Código da Infração': multa.codigoInfracao || 'Não informado',
      'Valor da Multa (R$)': formatCurrency(multa.valorMulta),
      'Pontos CNH': multa.pontuacaoInfracao || 0,
      'Gravidade': multa.grupoInfracao || 'N/A',
      'Status': getStatusText(multa),
      'Data de Vencimento': formatDate(multa.dataVectoMulta),
      'Cidade': multa.cidadeMulta || 'Não informado',
      'Placa do Veículo': multa.placaVeiculo || 'Não informado',
      'Categoria do Veículo': multa.categoriaVeiculo || 'Não informado',
      'Enquadramento': multa.enquadramentoInfracao || 'Não informado',
      'Condição do Recurso': multa.condicaoRecursoMulta || 'Não informado',
      'Setor Atual': multa.setorAtual || 'Não informado',
      'Data de Pagamento': multa.dataPagtoMulta ? formatDate(multa.dataPagtoMulta) : 'Não pago',
      'Valor Pago (R$)': multa.valorPago ? formatCurrency(multa.valorPago) : 0,
      'Tipo de Multa': 'Multa SEMOB'
    }));

    // 2. ABA RESUMO COMPARATIVO
    const resumoComparativo = [
      { 'Métrica': 'ID do Relatório', 'Dados Filtrados': relatorioId, 'Total Geral': 'Todos os dados SEMOB', 'Observações': 'Identificação única do relatório' },
      { 'Métrica': 'Total de Multas', 'Dados Filtrados': multas.length, 'Total Geral': allMultasForStats.length, 'Observações': `${((multas.length / allMultasForStats.length) * 100).toFixed(1)}% do total SEMOB` },
      { 'Métrica': 'Valor Total (R$)', 'Dados Filtrados': totalValorFiltrado.toFixed(2), 'Total Geral': totalValorGeral.toFixed(2), 'Observações': `${((totalValorFiltrado / totalValorGeral) * 100).toFixed(1)}% do valor total SEMOB` },
      { 'Métrica': 'Total de Pontos CNH', 'Dados Filtrados': totalPontosFiltrado, 'Total Geral': totalPontosGeral, 'Observações': `${((totalPontosFiltrado / totalPontosGeral) * 100).toFixed(1)}% dos pontos totais` },
      { 'Métrica': 'Agentes Únicos', 'Dados Filtrados': agentesUnicosFiltrado, 'Total Geral': agentesUnicosGeral, 'Observações': `${((agentesUnicosFiltrado / agentesUnicosGeral) * 100).toFixed(1)}% dos agentes` },
      { 'Métrica': 'Valor Médio por Multa (R$)', 'Dados Filtrados': (multas.length > 0 ? totalValorFiltrado / multas.length : 0).toFixed(2), 'Total Geral': (allMultasForStats.length > 0 ? totalValorGeral / allMultasForStats.length : 0).toFixed(2), 'Observações': 'Comparativo de valores médios' },
      { 'Métrica': 'Pontos Médios por Multa', 'Dados Filtrados': (multas.length > 0 ? totalPontosFiltrado / multas.length : 0).toFixed(1), 'Total Geral': (allMultasForStats.length > 0 ? totalPontosGeral / allMultasForStats.length : 0).toFixed(1), 'Observações': 'Comparativo de pontuação média' },
      { 'Métrica': 'Data de Geração', 'Dados Filtrados': new Date().toLocaleString('pt-BR'), 'Total Geral': 'Dados atualizados', 'Observações': 'Momento da geração do relatório' },
      { 'Métrica': 'Gerado por', 'Dados Filtrados': 'Leonardo', 'Total Geral': 'Sistema Viação Pioneira', 'Observações': 'Usuário responsável pela geração' },
      { 'Métrica': 'Tipo de Relatório', 'Dados Filtrados': 'Multas SEMOB Filtradas', 'Total Geral': 'Relatório Completo SEMOB', 'Observações': 'Categoria do relatório gerado' }
    ];

    // 3. ABA FILTROS APLICADOS
    const filtrosAplicados = Object.keys(filters).length > 0 
      ? Object.entries(filters).map(([key, value]) => {
          const labels = {
            numeroMulta: 'Número da Multa',
            prefixoVeiculo: 'Prefixo do Veículo',
            agenteCodigo: 'Agente SEMOB',
            dataInicio: 'Data Início',
            dataFim: 'Data Fim',
            valorMin: 'Valor Mínimo (R$)',
            valorMax: 'Valor Máximo (R$)',
            localMulta: 'Local da Multa',
            grupoInfracao: 'Gravidade da Infração'
          };
          return { 
            'Filtro': labels[key] || key, 
            'Valor Aplicado': value,
            'Tipo': typeof value === 'string' && value.includes('-') ? 'Data' : 'Texto/Número',
            'Observação': `Filtro aplicado para ${labels[key] || key}`
          };
        })
      : [{ 
          'Filtro': 'Nenhum filtro aplicado', 
          'Valor Aplicado': 'Todos os registros SEMOB', 
          'Tipo': 'Completo',
          'Observação': 'Relatório contém todos os dados disponíveis de multas SEMOB'
        }];

    filtrosAplicados.unshift({ 
      'Filtro': 'ID do Relatório', 
      'Valor Aplicado': relatorioId, 
      'Tipo': 'Identificador',
      'Observação': 'Identificação única deste relatório'
    });

    // 4. ABA ANÁLISE POR AGENTE
    const analiseAgente = {};
    multas.forEach(multa => {
      const agente = multa.agenteCodigo || 'Não Informado';
      if (!analiseAgente[agente]) {
        analiseAgente[agente] = {
          quantidade: 0,
          valorTotal: 0,
          pontosTotal: 0,
          locais: new Set(),
          descricao: multa.agenteDescricao || 'Não informado'
        };
      }
      analiseAgente[agente].quantidade += 1;
      analiseAgente[agente].valorTotal += parseFloat(multa.valorMulta || 0);
      analiseAgente[agente].pontosTotal += (multa.pontuacaoInfracao || 0);
      analiseAgente[agente].locais.add(multa.localMulta || 'Não informado');
    });

    const agenteData = Object.entries(analiseAgente)
      .sort(([,a], [,b]) => b.quantidade - a.quantidade)
      .map(([agente, dados], index) => ({
        'ID do Relatório': relatorioId,
        'Ranking': index + 1,
        'Código do Agente': agente,
        'Descrição do Agente': dados.descricao,
        'Quantidade de Multas': dados.quantidade,
        'Valor Total (R$)': dados.valorTotal.toFixed(2),
        'Valor Médio por Multa (R$)': (dados.valorTotal / dados.quantidade).toFixed(2),
        'Total de Pontos': dados.pontosTotal,
        'Pontos Médios por Multa': (dados.pontosTotal / dados.quantidade).toFixed(1),
        'Locais Diferentes': dados.locais.size,
        'Percentual do Total (%)': ((dados.quantidade / multas.length) * 100).toFixed(1),
        'Classificação de Performance': dados.quantidade >= 50 ? '🏆 Alto Desempenho' :
                                      dados.quantidade >= 20 ? '⭐ Bom Desempenho' : '📊 Desempenho Regular'
      }));

    // 5. ABA ANÁLISE POR VEÍCULO
    const analiseVeiculo = {};
    multas.forEach(multa => {
      const veiculo = multa.prefixoVeic;
      if (!analiseVeiculo[veiculo]) {
        analiseVeiculo[veiculo] = {
          quantidade: 0,
          valorTotal: 0,
          pontosTotal: 0,
          agentes: new Set(),
          locais: new Set()
        };
      }
      analiseVeiculo[veiculo].quantidade += 1;
      analiseVeiculo[veiculo].valorTotal += parseFloat(multa.valorMulta || 0);
      analiseVeiculo[veiculo].pontosTotal += (multa.pontuacaoInfracao || 0);
      analiseVeiculo[veiculo].agentes.add(multa.agenteCodigo);
      analiseVeiculo[veiculo].locais.add(multa.localMulta || 'Não informado');
    });

    const veiculoData = Object.entries(analiseVeiculo)
      .sort(([,a], [,b]) => b.quantidade - a.quantidade)
      .slice(0, 50) // Top 50 veículos
      .map(([veiculo, dados], index) => ({
        'ID do Relatório': relatorioId,
        'Ranking': index + 1,
        'Prefixo do Veículo': veiculo,
        'Quantidade de Multas SEMOB': dados.quantidade,
        'Valor Total (R$)': dados.valorTotal.toFixed(2),
        'Valor Médio por Multa (R$)': (dados.valorTotal / dados.quantidade).toFixed(2),
        'Total de Pontos': dados.pontosTotal,
        'Pontos Médios por Multa': (dados.pontosTotal / dados.quantidade).toFixed(1),
        'Agentes Diferentes': dados.agentes.size,
        'Locais Diferentes': dados.locais.size,
        'Percentual do Total (%)': ((dados.quantidade / multas.length) * 100).toFixed(1),
        'Classificação de Risco': dados.quantidade >= 10 ? '🔴 Alto Risco' :
                                dados.quantidade >= 5 ? '🟡 Médio Risco' : '�� Baixo Risco'
      }));

    // Criar workbook e adicionar as abas
    const workbook = XLSX.utils.book_new();
    
    // Aba 1: Dados Principais
    const worksheet1 = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'Multas SEMOB');
    
    // Aba 2: Resumo Comparativo
    const worksheet2 = XLSX.utils.json_to_sheet(resumoComparativo);
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Resumo Comparativo');
    
    // Aba 3: Filtros Aplicados
    const worksheet3 = XLSX.utils.json_to_sheet(filtrosAplicados);
    XLSX.utils.book_append_sheet(workbook, worksheet3, 'Filtros Aplicados');
    
    // Aba 4: Análise por Agente
    const worksheet4 = XLSX.utils.json_to_sheet(agenteData);
    XLSX.utils.book_append_sheet(workbook, worksheet4, 'Análise por Agente');
    
    // Aba 5: Análise por Veículo
    const worksheet5 = XLSX.utils.json_to_sheet(veiculoData);
    XLSX.utils.book_append_sheet(workbook, worksheet5, 'Top 50 Veículos');

    // Configurar larguras das colunas para melhor visualização
    const colWidths1 = [
      { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, 
      { wch: 18 }, { wch: 30 }, { wch: 50 }, { wch: 15 }, { wch: 12 }, 
      { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, 
      { wch: 18 }, { wch: 12 }, { wch: 18 }
    ];
    worksheet1['!cols'] = colWidths1;
    
    const colWidths2 = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 40 }];
    worksheet2['!cols'] = colWidths2;
    
    const colWidths3 = [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 40 }];
    worksheet3['!cols'] = colWidths3;
    
    const colWidths4 = [{ wch: 20 }, { wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    worksheet4['!cols'] = colWidths4;
    
    const colWidths5 = [{ wch: 20 }, { wch: 8 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    worksheet5['!cols'] = colWidths5;

    const fileName = `multas-semob-${new Date().toISOString().split('T')[0]}-${relatorioId}.xlsx`;
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const tamanhoMB = (wbout.length / (1024 * 1024)).toFixed(2);

    setTimeout(() => {
      addRelatorio({ 
        ...relatorio, 
        status: 'concluido', 
        tamanho: `${tamanhoMB} MB`,
        descricao: `Planilha com 5 abas: ${multas.length} multas SEMOB filtradas de ${allMultasForStats.length} totais (${((multas.length / allMultasForStats.length) * 100).toFixed(1)}% do total)`
      });
    }, 2000);

    XLSX.writeFile(workbook, fileName);

    return relatorioId;

  } catch (error) {
    setTimeout(() => {
      addRelatorio({ ...relatorio, status: 'erro' });
    }, 1000);
    throw error;
  }
};

// Componente principal
export default function MultasSemobPage() {
  const navigate = useNavigate();
  const { addRelatorio } = useRelatorios();
  const { multas, allMultas, allMultasForStats, loading, error, pagination, filters, applyFilters, changePage, refetch } = useMultasSemob();
  const { agentes, loading: agentesLoading, refetch: refetchAgentes } = useAgentesData();
  const [selectedMulta, setSelectedMulta] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Estatísticas calculadas com TODAS as multas SEMOB (sem filtros)
  const stats = useMemo(() => {
    const totalValor = allMultasForStats.reduce((sum, multa) => sum + parseFloat(multa.valorMulta || 0), 0);
    const totalPontos = allMultasForStats.reduce((sum, multa) => sum + (multa.pontuacaoInfracao || 0), 0);
    const agentesUnicos = new Set(allMultasForStats.map(m => m.agenteCodigo)).size;
    const locaisUnicos = new Set(allMultasForStats.map(m => m.localMulta)).size;

    return {
      totalMultas: allMultasForStats.length,
      totalValor,
      totalPontos,
      agentesUnicos,
      locaisUnicos,
      valorMedio: allMultasForStats.length > 0 ? totalValor / allMultasForStats.length : 0,
      pontosMedio: allMultasForStats.length > 0 ? totalPontos / allMultasForStats.length : 0
    };
  }, [allMultasForStats]);

  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (multa) => {
    if (multa.dataPagtoMulta) {
      return <Badge className="bg-green-500 text-white shadow-sm font-semibold">✅ Pago</Badge>;
    }
    
    if (multa.condicaoRecursoMulta && multa.condicaoRecursoMulta !== 'I') {
      return <Badge className="bg-blue-500 text-white shadow-sm font-semibold">⚖️ Em Recurso</Badge>;
    }
    
    const vencimento = new Date(multa.dataVectoMulta);
    const hoje = new Date();
    
    if (vencimento < hoje) {
      return <Badge className="bg-red-500 text-white shadow-sm font-semibold">⏰ Vencido</Badge>;
    }
    
    return <Badge className="bg-yellow-500 text-white shadow-sm font-semibold">⏳ Pendente</Badge>;
  };

  const getGrupoInfracaoBadge = (grupo) => {
    const configs = {
      'LEVE': { color: 'bg-green-500 text-white', emoji: '🟢', label: 'Leve' },
      'MEDIA': { color: 'bg-yellow-500 text-white', emoji: '🟡', label: 'Média' },
      'GRAVE': { color: 'bg-orange-500 text-white', emoji: '🟠', label: 'Grave' },
      'GRAVISSIMA': { color: 'bg-red-500 text-white', emoji: '🔴', label: 'Gravíssima' }
    };
    
    const config = configs[grupo] || { color: 'bg-gray-500 text-white', emoji: '⚪', label: grupo || 'N/A' };
    
    return (
      <Badge className={`${config.color} shadow-sm font-semibold`}>
        {config.emoji} {config.label}
      </Badge>
    );
  };

  const handleViewDetails = (multa) => {
    setSelectedMulta(multa);
    setIsModalOpen(true);
  };

  const handleExportHTML = async () => {
    setIsExporting(true);
    try {
      const relatorioId = await exportToHTML(allMultas, filters, addRelatorio, allMultasForStats);
      //alert(`✅ Relatório HTML gerado com sucesso!\n\n📋 ID: ${relatorioId}\n📊 ${allMultas.length} registros filtrados de ${allMultasForStats.length} totais\n📈 ${((allMultas.length / allMultasForStats.length) * 100).toFixed(1)}% do total\n📁 Verifique a página de Relatórios para acompanhar o status.`);
    } catch (error) {
      console.error('Erro ao exportar HTML:', error);
      alert('❌ Erro ao gerar relatório HTML. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const relatorioId = await exportToExcel(allMultas, filters, addRelatorio, allMultasForStats);
      //alert(`✅ Relatório Excel gerado com sucesso!\n\n�� ID: ${relatorioId}\n�� ${allMultas.length} registros filtrados de ${allMultasForStats.length} totais\n📈 ${((allMultas.length / allMultasForStats.length) * 100).toFixed(1)}% do total\n📁 5 abas com análises detalhadas\n📁 Verifique a página de Relatórios para acompanhar o status.`);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('❌ Erro ao gerar relatório Excel. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefreshAll = async () => {
    await Promise.all([refetch(), refetchAgentes()]);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6">
          <Button
            onClick={() => navigate('/departments/juridico')}
            variant="outline"
            className="mb-6 border-2 border-orange-400 text-orange-700 hover:bg-orange-100 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Jurídico
          </Button>
          
          <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
                    Erro ao carregar multas SEMOB
                  </h2>
                  <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                  <Button 
                    onClick={handleRefreshAll} 
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:gap-6"
        >
          <Button
            onClick={() => navigate('/departments/juridico')}
            variant="outline"
            className="self-start border-2 border-orange-400 text-orange-700 hover:bg-orange-100 font-semibold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Jurídico
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-xl shadow-lg">
                  <AlertTriangle className="w-6 h-6 sm:w-8 lg:w-10 sm:h-8 lg:h-10 text-white" />
                </div>
                <span className="leading-tight">Multas SEMOB</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                Gestão e controle das multas aplicadas pelos agentes SEMOB
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={handleRefreshAll}
                disabled={loading || agentesLoading}
                variant="outline"
                size="lg"
                className="border-2 border-orange-400 text-orange-700 hover:bg-orange-100 font-semibold"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${(loading || agentesLoading) ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleExportHTML}
                  disabled={isExporting || allMultas.length === 0}
                  size="lg"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">HTML</span>
                  <span className="sm:hidden">HTML</span>
                </Button>
                
                <Button
                  onClick={handleExportExcel}
                  disabled={isExporting || allMultas.length === 0}
                  size="lg"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg"
                >
                  <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">Excel</span>
                  <span className="sm:hidden">Excel</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Estatísticas Rápidas - TODAS as multas SEMOB */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="border-2 border-orange-300/50 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total de Multas</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalMultas.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 truncate">Apenas SEMOB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-orange-300/50 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Valor Total</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                      {formatCurrency(stats.totalValor)}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 truncate">
                      Média: {formatCurrency(stats.valorMedio)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-orange-300/50 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Pontos CNH</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalPontos.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 truncate">
                      Média: {stats.pontosMedio.toFixed(1)} pts/multa
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-orange-300/50 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Agentes Únicos</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.agentesUnicos}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                      {stats.locaisUnicos} locais diferentes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Layout com Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Conteúdo Principal */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Filtros */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MultasSemobFilters 
                onFilterChange={applyFilters} 
                loading={loading} 
                activeFilters={filters}
                agentes={agentes}
              />
            </motion.div>

            {/* Filtros Ativos */}
            <FiltrosAtivos 
              filters={filters}
              onRemoveFilter={(key) => {
                const newFilters = { ...filters };
                delete newFilters[key];
                applyFilters(newFilters);
              }}
              totalFiltrado={pagination.total}
              totalGeral={stats.totalMultas}
            />

            {/* Tabela de Multas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-2 border-orange-300/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 border-b border-orange-200 dark:border-orange-700">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-orange-800 dark:text-orange-200">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-lg sm:text-xl">Multas SEMOB</span>
                    </div>
                    <Badge className="self-start sm:self-auto bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2 shadow-lg">
                      {pagination.total} registros filtrados
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex flex-col justify-center items-center py-12 sm:py-16">
                      <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-orange-500 mb-4" />
                      <span className="text-base sm:text-lg text-gray-600 dark:text-gray-400">Carregando multas SEMOB...</span>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">Aguarde um momento</span>
                    </div>
                  ) : multas.length === 0 ? (
                    <div className="flex flex-col justify-center items-center py-12 sm:py-16">
                      <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4" />
                      <span className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-2">Nenhuma multa SEMOB encontrada</span>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">Tente ajustar os filtros de busca</span>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-700">
                              <TableHead className="font-semibold text-orange-800 dark:text-orange-200 min-w-[120px]">Número</TableHead>
                              <TableHead className="font-semibold text-orange-800 dark:text-orange-200 min-w-[100px]">Veículo</TableHead>
                              <TableHead className="font-semibold text-orange-800 dark:text-orange-200 min-w-[120px] hidden md:table-cell">Agente SEMOB</TableHead>
                              <TableHead className="font-semibold text-orange-800 dark:text-orange-200 min-w-[200px] hidden lg:table-cell">Infração</TableHead>
                              <TableHead className="font-semibold text-orange-800 dark:text-orange-200 min-w-[140px] hidden md:table-cell">Data/Hora</TableHead>
                              <TableHead className="font-semibold text-orange-800 dark:text-orange-200 min-w-[150px] hidden xl:table-cell">Local</TableHead>
                              <TableHead className="font-semibold text-orange-800 dark:text-orange-200 min-w-[100px]">Valor</TableHead>
                      
                              <TableHead className="font-semibold text-orange-800 dark:text-orange-200 min-w-[100px] hidden lg:table-cell">Status</TableHead>
                              <TableHead className="font-semibold text-orange-800 dark:text-orange-200 min-w-[80px]">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {multas.map((multa, index) => (
                              <TableRow 
                                key={index} 
                                className="hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors border-b border-orange-100 dark:border-orange-800"
                              >
                                <TableCell className="font-mono text-xs sm:text-sm font-medium">
                                  {multa.numeroAiMulta}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                                    <span className="font-semibold text-sm">{multa.prefixoVeic}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="text-sm">
                                    <p className="font-bold text-orange-700 dark:text-orange-300">{multa.agenteCodigo}</p>
                                    <p className="text-gray-500 text-xs truncate max-w-[100px]" title={multa.agenteDescricao}>
                                      {multa.agenteDescricao || 'N/A'}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs hidden lg:table-cell">
                                  <div className="truncate text-sm" title={multa.descricaoInfra}>
                                    {multa.descricaoInfra || 'Não informado'}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                    <span className="whitespace-nowrap">{formatDate(multa.dataHoraMulta)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs hidden xl:table-cell">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                    <span className="truncate text-sm" title={multa.localMulta}>
                                      {multa.localMulta || 'Não informado'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                                    {formatCurrency(multa.valorMulta)}
                                  </span>
                                </TableCell>
                                
                               
                                <TableCell className="hidden lg:table-cell">
                                  {getStatusBadge(multa)}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="hover:bg-orange-100 dark:hover:bg-orange-900/30 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700"
                                    onClick={() => handleViewDetails(multa)}
                                  >
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-orange-700 dark:text-orange-300" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Paginação */}
                      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 bg-orange-50/50 dark:bg-orange-900/10 border-t border-orange-200 dark:border-orange-700 gap-4">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                          Mostrando <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                          <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
                          <span className="font-semibold">{pagination.total}</span> registros filtrados
                        </p>
                        
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => changePage(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                            className="border-2 border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold"
                          >
                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Anterior</span>
                          </Button>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                              Página {pagination.page} de {pagination.totalPages}
                            </span>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => changePage(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                            className="border-2 border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold"
                          >
                            <span className="hidden sm:inline">Próxima</span>
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-1" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar com Ranking */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <RankingAgentes agentes={agentes} loading={agentesLoading} />
          </motion.div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <MultaSemobDetailsModal 
        multa={selectedMulta}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMulta(null);
        }}
      />

      {/* Loading Overlay Melhorado */}
      {isExporting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
        >
          <Card className="p-8 bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-800 max-w-md mx-4 shadow-2xl">
            <CardContent className="flex items-center gap-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-xl">
                  Gerando Relatório SEMOB
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Coletando dados, formatando e salvando automaticamente...
                </p>
                <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Processando {isExporting ? '...' : 'concluído'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}