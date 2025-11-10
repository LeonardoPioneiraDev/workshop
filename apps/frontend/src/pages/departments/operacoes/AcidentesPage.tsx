// src/pages/operacoes/AcidentesPage.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Filter,
  RefreshCw,
  Search,
  Eye,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  DollarSign,
  Loader,
  Clock,
  Building2,
  Car
} from 'lucide-react';

import { acidentesApi } from '@/services/departments/operacoes/api/acidentesApi';
import type { 
  Acidente, 
  EstatisticasAcidentes, 
  FiltrosAcidentes 
} from '@/types/departments/operacoes';
import { AcidenteDetailsModal } from '@/components/operacoes/modals/AcidenteDetailsModal';
import { SincronizacaoComponent } from '@/components/operacoes/SincronizacaoComponent';

export function AcidentesPage() {
  const navigate = useNavigate();
  
  // Obter data do mês atual
  const getMesAtual = () => {
    const now = new Date();
    const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1);
    const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      inicio: primeiroDia.toISOString().split('T')[0],
      fim: ultimoDia.toISOString().split('T')[0]
    };
  };
  
  const mesAtual = getMesAtual();
  
  // Estados principais
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acidentes, setAcidentes] = useState<Acidente[]>([]);
  const [acidentesFiltrados, setAcidentesFiltrados] = useState<Acidente[]>([]);
  const [totalAcidentes, setTotalAcidentes] = useState(0);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAcidentes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAcidente, setSelectedAcidente] = useState<Acidente | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filtroGrau, setFiltroGrau] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroGaragem, setFiltroGaragem] = useState('TODAS');
  const [filtroMunicipio, setFiltroMunicipio] = useState('TODOS');
  const [dataInicio, setDataInicio] = useState(mesAtual.inicio);
  const [dataFim, setDataFim] = useState(mesAtual.fim);
  const [showFilters, setShowFilters] = useState(false);
  const [showSincronizacao, setShowSincronizacao] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // Opções dos filtros
  const [garagemOptions, setGaragemOptions] = useState<string[]>([]);
  const [municipioOptions, setMunicipioOptions] = useState<string[]>([]);
  const [turnoOptions, setTurnoOptions] = useState<string[]>([]);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filtros: FiltrosAcidentes = {
        grauAcidente: filtroGrau !== 'TODOS' ? filtroGrau : undefined,
        statusProcesso: filtroStatus !== 'TODOS' ? filtroStatus : undefined,
        garagem: filtroGaragem !== 'TODAS' ? filtroGaragem : undefined,
        municipio: filtroMunicipio !== 'TODOS' ? filtroMunicipio : undefined,
        dataInicio,
        dataFim,
        limit: 5000,
        page: 1
      };
      
      const [acidentesData, estatisticasData] = await Promise.allSettled([
        acidentesApi.buscarAcidentes(filtros),
        acidentesApi.obterEstatisticas()
      ]);
      
      if (acidentesData.status === 'fulfilled') {
        // Ordenar por data decrescente (mais recentes primeiro)
        const dadosOrdenados = [...acidentesData.value.data].sort((a, b) => {
          return new Date(b.dataAcidente).getTime() - new Date(a.dataAcidente).getTime();
        });
        setAcidentes(dadosOrdenados);
        setTotalAcidentes(acidentesData.value.total || dadosOrdenados.length);
      } else {
        console.warn('Erro ao carregar acidentes:', acidentesData.reason);
      }
      
      if (estatisticasData.status === 'fulfilled') {
        setEstatisticas(estatisticasData.value);
      } else {
        console.warn('Erro ao carregar estatísticas:', estatisticasData.reason);
      }
      
      // Se não conseguiu carregar nada, mostrar botão de sincronização
      if (acidentesData.status === 'rejected' && estatisticasData.status === 'rejected') {
        setError('Não foi possível carregar os dados. Verifique a conexão com o backend.');
        setShowSincronizacao(true);
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setShowSincronizacao(true);
      toast.error('Erro ao carregar dados', { description: message });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filtrar e paginar acidentes
  useEffect(() => {
    let filtered = [...acidentes];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        (a.prefixoVeiculo?.toLowerCase().includes(term)) ||
        (a.placaVeiculo?.toLowerCase().includes(term)) ||
        (a.municipio?.toLowerCase().includes(term)) ||
        (a.bairro?.toLowerCase().includes(term))
      );
    }
    
    setAcidentesFiltrados(filtered);
    setCurrentPage(1); // Resetar para primeira página ao filtrar
  }, [searchTerm, acidentes]);

  useEffect(() => {
    carregarDados();
  }, [filtroGrau, filtroStatus, filtroGaragem, filtroMunicipio, dataInicio, dataFim]);
  
  useEffect(() => {
    carregarOpcoesDeFiltros();
  }, []);
  
  const carregarOpcoesDeFiltros = async () => {
    try {
      const response = await fetch('/api/departamentos/operacoes/acidentes/valores-filtros');
      if (response.ok) {
        const data = await response.json();
        setGaragemOptions(data.garagens || []);
        setMunicipioOptions(data.municipios || []);
        setTurnoOptions(data.turnos || []);
      }
    } catch (err) {
      console.error('Erro ao carregar opções de filtro:', err);
    }
  };
  
  const handleLimparFiltros = () => {
    setFiltroGrau('TODOS');
    setFiltroStatus('TODOS');
    setFiltroGaragem('TODAS');
    setFiltroMunicipio('TODOS');
    const mesAtualNovo = getMesAtual();
    setDataInicio(mesAtualNovo.inicio);
    setDataFim(mesAtualNovo.fim);
    setSearchTerm('');
    toast.success('Filtros limpos com sucesso!');
  };

  const handleSincronizacaoSuccess = async (resultado: any) => {
    console.log('✅ Sincronização de acidentes concluída:', resultado);
    setShowSincronizacao(false);
    await carregarDados();
    toast.success('Dados de acidentes sincronizados com sucesso!');
  };

  const handleSincronizacaoError = (erro: string) => {
    console.error('❌ Erro na sincronização de acidentes:', erro);
  };

  const handleRefresh = () => {
    carregarDados();
  };

  const handleViewDetails = (acidente: Acidente) => {
    setSelectedAcidente(acidente);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAcidente(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ABERTO': 'bg-yellow-100 text-yellow-800',
      'EM_ANDAMENTO': 'bg-blue-100 text-blue-800',
      'FECHADO': 'bg-green-100 text-green-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };
  
  const getGrauColor = (grau: string) => {
    if (grau?.includes('COM')) return 'bg-red-100 text-red-800';
    if (grau?.includes('SEM')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  // Calcular paginação
  const totalPages = Math.ceil(acidentesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const acidentesPaginados = acidentesFiltrados.slice(startIndex, endIndex);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exportação de Relatórios (HTML/Excel)
  const handleExportarRelatorio = (formato: 'html' | 'excel') => {
    const dadosParaExportar = acidentes.map(a => ({
      'Data': new Date(a.dataAcidente).toLocaleDateString('pt-BR'),
      'Hora': a.horaAcidente || '-',
      'Prefixo': a.prefixoVeiculo || '-',
      'Placa': a.placaVeiculo || '-',
      'Grau': a.grauAcidente || '-',
      'Status': a.statusProcesso || '-',
      'Município': a.municipio || '-',
      'Bairro': a.bairro || '-',
      'Garagem': a.garagemVeiculoNome || '-',
      'Valor Danos': a.valorTotalDano ? a.valorTotalDano.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '-'
    }));

    const hoje = new Date().toISOString().split('T')[0];
    const headers = Object.keys(dadosParaExportar[0] || {});

    const filtrosAplicados: string[] = [];
    if (filtroGrau && filtroGrau !== 'TODOS') filtrosAplicados.push(`Grau: ${filtroGrau}`);
    if (filtroStatus && filtroStatus !== 'TODOS') filtrosAplicados.push(`Status: ${filtroStatus}`);
    if (filtroGaragem && filtroGaragem !== 'TODAS') filtrosAplicados.push(`Garagem: ${filtroGaragem}`);
    if (filtroMunicipio && filtroMunicipio !== 'TODOS') filtrosAplicados.push(`Município: ${filtroMunicipio}`);
    if (searchTerm) filtrosAplicados.push(`Busca: ${searchTerm}`);

    const infoFiltros = filtrosAplicados.length > 0 ? `Filtros aplicados: ${filtrosAplicados.join(', ')}` : 'Nenhum filtro aplicado';

    if (formato === 'html') {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Relatório de Acidentes - ${hoje}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f6f7fb; color: #333; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 28px; }
    .header h1 { margin: 0 0 8px; font-weight: 600; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 16px; padding: 24px; background: #fafafa; }
    .stat-card { background: white; padding: 16px; border-left: 5px solid #ef4444; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; }
    .stat-number { font-size: 22px; font-weight: 700; color: #ef4444; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .filters { background: #fff7ed; margin: 0 24px 24px; padding: 12px 16px; border-left: 4px solid #f97316; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #fcfcfc; }
    .badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; color: white; }
    .badge-vitimas { background: #ef4444; }
    .badge-sem { background: #22c55e; }
    .badge-aberto { background: #f59e0b; }
    .badge-andamento { background: #3b82f6; }
    .badge-fechado { background: #10b981; }
    .footer { text-align: center; padding: 16px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Relatório de Acidentes</h1>
      <div>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">${acidentes.length}</div>
        <div class="stat-label">Total Filtrado</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${acidentes.filter(a => (a.grauAcidente||'').includes('COM')).length}</div>
        <div class="stat-label">Com Vítimas</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${acidentes.filter(a => (a.grauAcidente||'').includes('SEM')).length}</div>
        <div class="stat-label">Sem Vítimas</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${(acidentes.reduce((s,a)=> s + (a.valorTotalDano||0),0)).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}</div>
        <div class="stat-label">Valor Total Danos</div>
      </div>
    </div>
    <div class="filters"><strong>🔍 ${infoFiltros}</strong><br><small>Mostrando ${acidentes.length} registros</small></div>
    <div style="margin: 0 24px 24px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
      <table>
        <thead>
          <tr>
            ${headers.map(h=>`<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dadosParaExportar.map(row => `
            <tr>
              <td>${row['Data']}</td>
              <td>${row['Hora']}</td>
              <td>${row['Prefixo']}</td>
              <td>${row['Placa']}</td>
              <td><span class="badge ${row['Grau'].includes('COM') ? 'badge-vitimas' : 'badge-sem'}">${row['Grau']}</span></td>
              <td><span class="badge ${row['Status']==='ABERTO' ? 'badge-aberto' : row['Status']==='EM_ANDAMENTO' ? 'badge-andamento' : 'badge-fechado'}">${row['Status']}</span></td>
              <td>${row['Município']}</td>
              <td>${row['Bairro']}</td>
              <td>${row['Garagem']}</td>
              <td>${row['Valor Danos']}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="footer">Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</div>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `acidentes_${hoje}.html`;
      link.click();
      toast.success('Relatório HTML exportado com sucesso!', { description: `acidentes_${hoje}.html` });

    } else if (formato === 'excel') {
      const excelContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Relatório Acidentes</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
  <style>
    .title { font-size: 24px; font-weight: bold; text-align: center; background: #ef4444; color: white; padding: 12px; }
    .subtitle { text-align: center; color: #666; padding: 6px; }
    .header-row { background: #ef4444; color: white; font-weight: bold; text-align: center; }
    td, th { border: 1px solid #ccc; padding: 6px; }
  </style>
</head>
<body>
  <table>
    <tr><td colspan="${headers.length}" class="title">🚨 RELATÓRIO DE ACIDENTES</td></tr>
    <tr><td colspan="${headers.length}" class="subtitle">${infoFiltros} • Gerado em ${new Date().toLocaleString('pt-BR')}</td></tr>
    <tr>
      ${headers.map(h=>`<th class="header-row">${h.toUpperCase()}</th>`).join('')}
    </tr>
    ${dadosParaExportar.map(row => `
      <tr>
        ${headers.map(h=>`<td>${row[h as keyof typeof row] ?? ''}</td>`).join('')}
      </tr>
    `).join('')}
  </table>
</body>
</html>`;

      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `acidentes_${hoje}.xls`;
      link.click();
      toast.success('Relatório Excel exportado com sucesso!', { description: `acidentes_${hoje}.xls` });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Button
            onClick={() => navigate('/departments/operacoes')}
            className="group relative bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-0 w-full sm:w-auto"
          >
            <div className="relative flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="tracking-wide">Voltar ao Dashboard</span>
            </div>
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                </div>
                <span>Gestão de Acidentes</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Consultar e gerenciar acidentes registrados</p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleRefresh} disabled={isLoading} className="group relative bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-500 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative flex items-center">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                  <span className="font-medium tracking-wide">{isLoading ? 'Atualizando...' : 'Atualizar'}</span>
                </div>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={isLoading || acidentes.length === 0} className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative flex items-center">
                      <Download className="h-4 w-4 mr-2 group-hover:animate-bounce transition-all duration-300" />
                      <span className="font-medium tracking-wide">Exportar</span>
                      <div className="ml-2 w-1 h-1 bg-white rounded-full group-hover:animate-ping"></div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-xl p-2 min-w-[220px]">
                  <DropdownMenuItem onClick={() => handleExportarRelatorio('html')} className="group flex items-center px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700 transition-all duration-200 cursor-pointer border-0">
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-200">📄</div>
                      <div>
                        <div className="font-semibold text-sm">Exportar como HTML</div>
                        <div className="text-xs text-gray-500 group-hover:text-orange-600">Arquivo web formatado</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportarRelatorio('excel')} className="group flex items-center px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 cursor-pointer border-0">
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-200">📊</div>
                      <div>
                        <div className="font-semibold text-sm">Exportar como Excel</div>
                        <div className="text-xs text-gray-500 group-hover:text-green-600">Planilha profissional</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{estatisticas.resumo?.total || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{estatisticas.resumo?.comVitimas || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Com Vítimas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{estatisticas.resumo?.semVitimas || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sem Vítimas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estatisticas.resumo?.valorTotalDanos || 0)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative w-full lg:w-1/2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por prefixo, placa, município, bairro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowFilters(!showFilters)} className={`group relative font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-0 ${showFilters ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white' : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className="relative flex items-center">
                  <Filter className={`h-4 w-4 mr-2 transition-all duration-300 ${showFilters ? 'rotate-180 text-white' : 'group-hover:rotate-12'}`} />
                  <span className="tracking-wide">Filtros {showFilters ? '▲' : '▼'}</span>
                </div>
              </Button>
            </div>
            
            {/* Seção de filtros expandida */}
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Período - Data Início */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      Data Início
                    </label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Período - Data Fim */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      Data Fim
                    </label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Grau do Acidente */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Grau do Acidente
                    </label>
                    <Select value={filtroGrau} onValueChange={setFiltroGrau}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos</SelectItem>
                        <SelectItem value="COM VITIMAS">Com Vítimas</SelectItem>
                        <SelectItem value="COM VÍTIMAS">Com Vítimas</SelectItem>
                        <SelectItem value="SEM VITIMAS">Sem Vítimas</SelectItem>
                        <SelectItem value="SEM VÍTIMAS">Sem Vítimas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Status do Processo */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-red-500" />
                      Status do Processo
                    </label>
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos</SelectItem>
                        <SelectItem value="ABERTO">Aberto</SelectItem>
                        <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                        <SelectItem value="FECHADO">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Garagem */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-red-500" />
                      Garagem
                    </label>
                    <Select value={filtroGaragem} onValueChange={setFiltroGaragem}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODAS">Todas</SelectItem>
                        {garagemOptions.map((garagem) => (
                          <SelectItem key={garagem} value={garagem}>
                            {garagem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Município */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      Município
                    </label>
                    <Select value={filtroMunicipio} onValueChange={setFiltroMunicipio}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos</SelectItem>
                        {municipioOptions.map((municipio) => (
                          <SelectItem key={municipio} value={municipio}>
                            {municipio}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="flex items-center gap-3 mt-6">
                  <Button
                    onClick={handleLimparFiltros}
                    variant="outline"
                    className="flex-1 sm:flex-none border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  
                  <div className="flex-1 text-sm text-gray-600 dark:text-gray-400 text-right">
                    <span className="font-semibold">{acidentesFiltrados.length}</span> acidentes encontrados
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Estado de erro */}
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Erro ao carregar dados</h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de acidentes */}
        {!isLoading && acidentesFiltrados.length > 0 && (
          <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-0 shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-white pb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">
                      Acidentes do Mês Atual
                    </CardTitle>
                    <p className="text-sm text-white/80 mt-1">
                      Relatório completo e organizado
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/90 font-medium">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, acidentesFiltrados.length)} de {acidentesFiltrados.length}
                  </div>
                  {totalAcidentes > acidentesFiltrados.length && (
                    <div className="text-xs text-white/70 mt-1">
                      Total no banco: {totalAcidentes} registros
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-red-500/20">
                      <th className="text-left px-6 py-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-red-500" />
                          Data/Hora
                        </div>
                      </th>
                      <th className="text-left px-6 py-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-red-500" />
                          Veículo
                        </div>
                      </th>
                      <th className="text-left px-6 py-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Grau
                        </div>
                      </th>
                      <th className="text-left px-6 py-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          Local
                        </div>
                      </th>
                      <th className="text-left px-6 py-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-red-500" />
                          Garagem
                        </div>
                      </th>
                      <th className="text-left px-6 py-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-red-500" />
                          Status
                        </div>
                      </th>
                      <th className="text-center px-6 py-4 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          <Eye className="h-4 w-4 text-red-500" />
                          Ações
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {acidentesPaginados.map((acidente, index) => (
                      <tr 
                        key={acidente.id || index}
                        className={`
                          transition-all duration-200
                          hover:bg-red-50/50 dark:hover:bg-red-900/10
                          hover:shadow-md hover:scale-[1.01]
                          cursor-pointer
                          ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'}
                        `}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {new Date(acidente.dataAcidente).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-4">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {acidente.horaAcidente || 'Não informado'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-red-600 dark:text-red-400">
                              {acidente.prefixoVeiculo || 'N/A'}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                              {acidente.placaVeiculo || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            className={`${getGrauColor(acidente.grauAcidente)} font-semibold px-3 py-1.5 shadow-sm`}
                          >
                            {acidente.grauAcidente || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {acidente.municipio || 'N/A'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-orange-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {acidente.bairro || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div 
                            className="group relative"
                            title={acidente.garagemVeiculoNome || 'N/A'}
                          >
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                              <Building2 className="h-4 w-4 text-orange-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {acidente.garagemVeiculoNome || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            className={`${getStatusBadge(acidente.statusProcesso)} font-semibold px-3 py-1.5 shadow-sm`}
                          >
                            {acidente.statusProcesso?.replace('_', ' ') || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(acidente)}
                            className="
                              group relative
                              hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50
                              dark:hover:from-red-900/20 dark:hover:to-orange-900/20
                              hover:text-red-600 dark:hover:text-red-400
                              hover:shadow-lg
                              transition-all duration-200
                              border border-transparent hover:border-red-200
                            "
                          >
                            <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-3">
                      {currentPage}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Estado vazio */}
        {!isLoading && acidentesFiltrados.length === 0 && acidentes.length === 0 && (
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nenhum acidente encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Não há acidentes registrados no período selecionado.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Resultados da busca vazio */}
        {!isLoading && acidentesFiltrados.length === 0 && acidentes.length > 0 && (
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Tente ajustar os filtros ou termo de busca.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sincronização (se necessário) */}
        {showSincronizacao && (
          <SincronizacaoComponent 
            titulo="Sincronizar dados de Operações"
            subtitulo="Atualize frota e acidentes a partir do Globus"
            onSuccess={() => carregarDados()}
            className="mt-4"
          />
        )}

        {/* Modal de Detalhes */}
        <AcidenteDetailsModal acidente={selectedAcidente} isOpen={showModal} onClose={handleCloseModal} />
      </div>
    </div>
  );
}
