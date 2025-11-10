// src/pages/operacoes/FrotaPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SincronizacaoComponent } from '@/components/operacoes/SincronizacaoComponent';
import { VeiculoDetailsModal } from '@/components/operacoes/modals/VeiculoDetailsModal';
import { operacoesApi } from '@/services/departments/operacoes/api/operacoesApi';
import { toast } from 'sonner';
import {
  Truck,
  Bus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  AlertTriangle,
  ArrowLeft,
  Activity,
  Database,
  Loader,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';

export function FrotaPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVeiculo, setSelectedVeiculo] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroGaragem, setFiltroGaragem] = useState('TODAS');
  const [showFilters, setShowFilters] = useState(false);
  const [showSincronizacao, setShowSincronizacao] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filtros = {
        status: filtroStatus !== 'TODOS' ? filtroStatus : undefined,
        garagem: filtroGaragem !== 'TODAS' ? filtroGaragem : undefined,
        limit: 5000
      };
      
      const [veiculosData, estatisticasData] = await Promise.allSettled([
        operacoesApi.getVeiculos(filtros),
        operacoesApi.getFrotaEstatisticas()
      ]);
      
      if (veiculosData.status === 'fulfilled') {
        setVeiculos(veiculosData.value);
      } else {
        console.warn('Erro ao carregar veículos:', veiculosData.reason);
      }
      
      if (estatisticasData.status === 'fulfilled') {
        setEstatisticas(estatisticasData.value);
      } else {
        console.warn('Erro ao carregar estatísticas:', estatisticasData.reason);
      }
      
      // Se não conseguiu carregar nada, mostrar botão de sincronização
      if (veiculosData.status === 'rejected' && estatisticasData.status === 'rejected') {
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

  useEffect(() => {
    carregarDados();
  }, [filtroStatus, filtroGaragem]);

  const handleSincronizacaoSuccess = async (resultado: any) => {
    console.log('✅ Sincronização da frota concluída:', resultado);
    setShowSincronizacao(false);
    await carregarDados();
    toast.success('Dados da frota sincronizados com sucesso!');
  };

  const handleSincronizacaoError = (erro: string) => {
    console.error('❌ Erro na sincronização da frota:', erro);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ATIVO': 'bg-green-100 text-green-800',
      'MANUTENCAO': 'bg-yellow-100 text-yellow-800', 
      'INATIVO': 'bg-red-100 text-red-800',
      'RESERVA': 'bg-blue-100 text-blue-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const handleRefresh = () => {
    carregarDados();
  };

  const handleExportarRelatorio = (formato: 'html' | 'excel') => {
    const dadosParaExportar = sortedVeiculos.map(v => ({
      'Prefixo': v.prefixo,
      'Placa': v.placa,
      'Modelo': v.modelo || 'N/A',
      'Ano': v.ano || 'N/A',
      'Status': v.status,
      'Garagem': v.garagemNome || v.garagem || 'N/A',
      'Tipo': v.tipoVeiculo || 'N/A'
    }));
    
    const hoje = new Date().toISOString().split('T')[0];
    const headers = Object.keys(dadosParaExportar[0] || {});
    
    // Informações sobre filtros aplicados
    const filtrosAplicados = [];
    if (filtroStatus !== 'TODOS') filtrosAplicados.push(`Status: ${filtroStatus}`);
    if (filtroGaragem !== 'TODAS') filtrosAplicados.push(`Garagem: ${filtroGaragem}`);
    if (searchTerm) filtrosAplicados.push(`Busca: "${searchTerm}"`);
    const infoFiltros = filtrosAplicados.length > 0 
      ? `Filtros aplicados: ${filtrosAplicados.join(', ')}` 
      : 'Nenhum filtro aplicado';
    
    if (formato === 'html') {
      // Criar HTML
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório de Frota - ${hoje}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { 
            font-size: 2.5rem; 
            font-weight: 300;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header p { 
            font-size: 1.1rem; 
            opacity: 0.9;
        }
        .stats { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8fafc;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-left: 5px solid #667eea;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .filters-info {
            background: #e3f2fd;
            padding: 15px 30px;
            border-left: 4px solid #2196f3;
            margin: 0 30px 30px;
            border-radius: 8px;
        }
        .table-container {
            margin: 0 30px 30px;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        table { 
            width: 100%;
            border-collapse: collapse;
        }
        th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.85rem;
        }
        td { 
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        tr:nth-child(even) { 
            background: #f8f9ff;
        }
        tr:hover {
            background: #e3f2fd;
            transform: translateY(-1px);
            transition: all 0.2s;
        }
        .status-badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-ativo { background: #4caf50; color: white; }
        .status-inativo { background: #f44336; color: white; }
        .status-reserva { background: #2196f3; color: white; }
        .status-manutencao { background: #ff9800; color: white; }
        .prefixo-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 12px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 0.9rem;
        }
        .placa {
            font-family: 'Courier New', monospace;
            background: #f5f5f5;
            padding: 5px 8px;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Frota</h1>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${sortedVeiculos.length}</div>
                <div class="stat-label">Total Filtrado</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${sortedVeiculos.filter(v => v.status === 'ATIVO').length}</div>
                <div class="stat-label">Ativos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${sortedVeiculos.filter(v => v.status === 'INATIVO').length}</div>
                <div class="stat-label">Inativos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${sortedVeiculos.filter(v => v.status === 'RESERVA').length}</div>
                <div class="stat-label">Reserva</div>
            </div>
        </div>
        
        <div class="filters-info">
            <strong>🔍 ${infoFiltros}</strong><br>
            <small>Mostrando ${sortedVeiculos.length} de ${veiculos.length} veículos no total • Ordenação: ${sortBy === 'newest' ? 'Mais Recentes' : 'Mais Antigos'}</small>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>🚛 Prefixo</th>
                        <th>📋 Placa</th>
                        <th>🚗 Modelo</th>
                        <th>📅 Ano</th>
                        <th>📊 Status</th>
                        <th>📍 Garagem</th>
                        <th>🔧 Tipo</th>
                    </tr>
                </thead>
                <tbody>
                    ${dadosParaExportar.map(row => `
                        <tr>
                            <td><span class="prefixo-badge">${row.Prefixo}</span></td>
                            <td><span class="placa">${row.Placa}</span></td>
                            <td><strong>${row.Modelo}</strong></td>
                            <td>${row.Ano}</td>
                            <td><span class="status-badge status-${row.Status.toLowerCase()}">${row.Status}</span></td>
                            <td>${row.Garagem}</td>
                            <td>${row.Tipo}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>💼 Sistema de Gestão de Frota | Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
    </div>
</body>
</html>`;
      
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `frota_${hoje}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Relatório HTML exportado com sucesso!', {
        description: `Arquivo: frota_${hoje}.html`
      });
      
    } else if (formato === 'excel') {
      // Criar conteúdo Excel em formato HTML que pode ser aberto pelo Excel
      const excelContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Relatório Frota</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <style>
        body { font-family: Calibri, Arial, sans-serif; }
        .title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 15px;
            border-radius: 10px;
        }
        .subtitle {
            font-size: 14px;
            text-align: center;
            color: #666;
            padding: 10px;
            font-style: italic;
        }
        .stats-header {
            background-color: #E3F2FD;
            font-weight: bold;
            padding: 12px;
            border: 2px solid #2196F3;
            text-align: center;
            color: #1976D2;
        }
        .filters-info {
            background-color: #FFF3E0;
            padding: 10px;
            border-left: 4px solid #FF9800;
            font-style: italic;
            color: #E65100;
        }
        .header-row {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 12px;
            padding: 12px 8px;
        }
        .data-row {
            border: 1px solid #E0E0E0;
        }
        .data-row:nth-child(even) {
            background-color: #F8F9FF;
        }
        .data-row:nth-child(odd) {
            background-color: white;
        }
        .prefixo-cell {
            background-color: #E3F2FD;
            font-weight: bold;
            text-align: center;
            color: #1976D2;
        }
        .placa-cell {
            font-family: 'Courier New', monospace;
            background-color: #F5F5F5;
            font-weight: bold;
            text-align: center;
        }
        .status-ativo {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
            text-align: center;
            border-radius: 15px;
        }
        .status-inativo {
            background-color: #F44336;
            color: white;
            font-weight: bold;
            text-align: center;
            border-radius: 15px;
        }
        .status-reserva {
            background-color: #2196F3;
            color: white;
            font-weight: bold;
            text-align: center;
            border-radius: 15px;
        }
        .status-manutencao {
            background-color: #FF9800;
            color: white;
            font-weight: bold;
            text-align: center;
            border-radius: 15px;
        }
        .garagem-cell {
            background-color: #E8F5E8;
            color: #2E7D2E;
        }
        .modelo-cell {
            font-weight: bold;
            color: #333;
        }
        .ano-cell {
            text-align: center;
            color: #666;
        }
        .tipo-cell {
            background-color: #FFF3E0;
            color: #E65100;
            font-size: 11px;
            text-align: center;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        td, th {
            border: 1px solid #BDBDBD;
            padding: 8px;
        }
        .footer {
            text-align: center;
            font-size: 10px;
            color: #666;
            padding: 15px;
            background-color: #FAFAFA;
            border-top: 2px solid #E0E0E0;
        }
    </style>
</head>
<body>
    <table>
        <!-- Título Principal -->
        <tr>
            <td colspan="${headers.length}" class="title">
                🚛 RELATÓRIO DE GESTÃO DE FROTA 🚛
            </td>
        </tr>
        
        <!-- Subtítulo com Data -->
        <tr>
            <td colspan="${headers.length}" class="subtitle">
                Gerado em ${new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </td>
        </tr>
        
        <!-- Linha em Branco -->
        <tr><td colspan="${headers.length}" style="height: 10px; border: none;"></td></tr>
        
        <!-- Estatísticas -->
        <tr>
            <td colspan="${headers.length}" class="stats-header">
                📊 RESUMO ESTATÍSTICO 📊
            </td>
        </tr>
        <tr>
            <td colspan="2" style="background-color: #E3F2FD; font-weight: bold; text-align: center; padding: 8px;">📈 TOTAL FILTRADO</td>
            <td style="background-color: #BBDEFB; font-weight: bold; text-align: center; font-size: 16px; color: #1976D2;">${sortedVeiculos.length}</td>
            <td colspan="2" style="background-color: #C8E6C9; font-weight: bold; text-align: center; padding: 8px;">✅ ATIVOS</td>
            <td style="background-color: #A5D6A7; font-weight: bold; text-align: center; font-size: 16px; color: #2E7D2E;">${sortedVeiculos.filter(v => v.status === 'ATIVO').length}</td>
            <td style="background-color: #FFCDD2; font-weight: bold; text-align: center; padding: 8px;">❌ INATIVOS: ${sortedVeiculos.filter(v => v.status === 'INATIVO').length}</td>
        </tr>
        <tr>
            <td colspan="2" style="background-color: #E1F5FE; font-weight: bold; text-align: center; padding: 8px;">📋 TOTAL GERAL</td>
            <td style="background-color: #B3E5FC; font-weight: bold; text-align: center; font-size: 16px; color: #0277BD;">${veiculos.length}</td>
            <td colspan="2" style="background-color: #E3F2FD; font-weight: bold; text-align: center; padding: 8px;">🔄 RESERVA</td>
            <td style="background-color: #BBDEFB; font-weight: bold; text-align: center; font-size: 16px; color: #1976D2;">${sortedVeiculos.filter(v => v.status === 'RESERVA').length}</td>
            <td style="background-color: #FFF3E0; font-weight: bold; text-align: center; padding: 8px;">🔧 MANUTENÇÃO: ${sortedVeiculos.filter(v => v.status === 'MANUTENCAO').length}</td>
        </tr>
        
        <!-- Filtros Aplicados -->
        <tr>
            <td colspan="${headers.length}" class="filters-info">
                🔍 ${infoFiltros}
            </td>
        </tr>
        
        <!-- Linha em Branco -->
        <tr><td colspan="${headers.length}" style="height: 15px; border: none;"></td></tr>
        
        <!-- Cabeçalho da Tabela -->
        <tr>
            <th class="header-row">🚛 PREFIXO</th>
            <th class="header-row">📋 PLACA</th>
            <th class="header-row">🚗 MODELO</th>
            <th class="header-row">📅 ANO</th>
            <th class="header-row">📊 STATUS</th>
            <th class="header-row">📍 GARAGEM</th>
            <th class="header-row">🔧 TIPO</th>
        </tr>
        
        <!-- Dados da Tabela -->
        ${dadosParaExportar.map(row => `
            <tr class="data-row">
                <td class="prefixo-cell">${row.Prefixo}</td>
                <td class="placa-cell">${row.Placa}</td>
                <td class="modelo-cell">${row.Modelo}</td>
                <td class="ano-cell">${row.Ano}</td>
                <td class="status-${row.Status.toLowerCase()}">${row.Status}</td>
                <td class="garagem-cell">${row.Garagem}</td>
                <td class="tipo-cell">${row.Tipo}</td>
            </tr>
        `).join('')}
        
        <!-- Rodapé -->
        <tr>
            <td colspan="${headers.length}" class="footer">
                💼 Sistema de Gestão de Frota | Relatório gerado automaticamente<br>
                📧 Para mais informações, entre em contato com o departamento de operações<br>
                ⏰ ${new Date().toLocaleString('pt-BR')}
            </td>
        </tr>
    </table>
</body>
</html>`;
      
      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `frota_${hoje}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Relatório Excel exportado com sucesso!', {
        description: `Arquivo: frota_${hoje}.xls`
      });
    }
  };

  const handleViewDetails = (veiculo: any) => {
    setSelectedVeiculo(veiculo);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVeiculo(null);
  };

  const calcularEstatisticasLocais = () => {
    if (veiculos.length === 0) {
      return {
        total: 0,
        ativos: 0,
        inativos: 0,
        reserva: 0
      };
    }
    
    return {
      total: veiculos.length,
      ativos: veiculos.filter(v => v.status === 'ATIVO').length,
      inativos: veiculos.filter(v => v.status === 'INATIVO').length,
      reserva: veiculos.filter(v => v.status === 'RESERVA').length
    };
  };

  // Obter lista única de garagens para o filtro
  const garagensDisponiveis = [...new Set(veiculos.map(v => v.garagemNome || v.garagem).filter(Boolean))].sort();

  const stats = estatisticas || calcularEstatisticasLocais();

  // Filtrar veículos
  const filteredVeiculos = veiculos.filter(v => {
    // Filtro de busca por texto
    const matchesSearch = !searchTerm || 
      v.prefixo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.modelo && v.modelo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro de status
    const matchesStatus = filtroStatus === 'TODOS' || v.status === filtroStatus;
    
    // Filtro de garagem
    const matchesGaragem = filtroGaragem === 'TODAS' || 
      v.garagemNome === filtroGaragem || 
      v.garagem === filtroGaragem;
    
    return matchesSearch && matchesStatus && matchesGaragem;
  });

  // Ordenar veículos (simulando por ID para "mais recentes")
  const sortedVeiculos = [...filteredVeiculos].sort((a, b) => {
    if (sortBy === 'newest') {
      return (b.id || 0) - (a.id || 0); // Maiores IDs primeiro (mais recentes)
    } else {
      return (a.id || 0) - (b.id || 0); // Menores IDs primeiro (mais antigos)
    }
  });

  // Calcular paginação
  const totalItems = sortedVeiculos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedVeiculos.slice(startIndex, endIndex);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroStatus, filtroGaragem]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Breadcrumb */}
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
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Bus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <span>Gestão de Frota</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Gerenciar e monitorar todos os veículos da frota
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative flex items-center">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                  <span className="font-medium tracking-wide">
                    {isLoading ? 'Atualizando...' : 'Atualizar'}
                  </span>
                </div>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={isLoading || filteredVeiculos.length === 0}
                    className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                  >
                    {/* Efeito de brilho animado */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                    
                    <div className="relative flex items-center">
                      <Download className="h-4 w-4 mr-2 group-hover:animate-bounce transition-all duration-300" />
                      <span className="font-medium tracking-wide">
                        Exportar
                      </span>
                      <div className="ml-2 w-1 h-1 bg-white rounded-full group-hover:animate-ping"></div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-xl p-2 min-w-[220px]">
                  <DropdownMenuItem 
                    onClick={() => handleExportarRelatorio('html')}
                    className="group flex items-center px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700 transition-all duration-200 cursor-pointer border-0"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-200">
                        📄
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Exportar como HTML</div>
                        <div className="text-xs text-gray-500 group-hover:text-orange-600">Arquivo web formatado</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => handleExportarRelatorio('excel')}
                    className="group flex items-center px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 cursor-pointer border-0"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-200">
                        📊
                      </div>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
          >
            <Card className="hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-0 hover:scale-105 hover:-translate-y-1 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-semibold tracking-wide">Total de Veículos</p>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent dark:from-blue-300 dark:to-blue-500 mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg">
                  <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          >
            <Card className="hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 border-0 hover:scale-105 hover:-translate-y-1 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-semibold tracking-wide">Veículos Ativos</p>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent dark:from-green-300 dark:to-emerald-400 mt-1">
                    {stats.ativos}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl shadow-lg">
                  <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
          >
            <Card className="hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-800/30 border-0 hover:scale-105 hover:-translate-y-1 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-semibold tracking-wide">Veículos Inativos</p>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent dark:from-red-300 dark:to-rose-400 mt-1">
                    {stats.inativos}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-400 to-rose-600 rounded-xl shadow-lg">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
          >
            <Card className="hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-800/30 border-0 hover:scale-105 hover:-translate-y-1 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-semibold tracking-wide">Em Reserva</p>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent dark:from-purple-300 dark:to-violet-400 mt-1">
                    {stats.reserva}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-400 to-violet-600 rounded-xl shadow-lg">
                  <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

      {/* Filters and Search */}
      <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por prefixo, placa ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                className={`group relative font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-0 ${
                  showFilters 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="relative flex items-center">
                  <Filter className={`h-4 w-4 mr-2 transition-all duration-300 ${
                    showFilters ? 'rotate-180 text-white' : 'group-hover:rotate-12'
                  }`} />
                  <span className="tracking-wide">
                    Filtros {showFilters ? '▲' : '▼'}
                  </span>
                </div>
              </Button>
            </div>
            
            {/* Filtros Expandidos */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos os Status</SelectItem>
                      <SelectItem value="ATIVO">Ativos</SelectItem>
                      <SelectItem value="INATIVO">Inativos</SelectItem>
                      <SelectItem value="RESERVA">Em Reserva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Garagem</label>
                  <Select value={filtroGaragem} onValueChange={setFiltroGaragem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar garagem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas as Garagens</SelectItem>
                      {garagensDisponiveis.map((garagem) => (
                        <SelectItem key={garagem} value={garagem}>{garagem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={() => {
                      setFiltroStatus('TODOS');
                      setFiltroGaragem('TODAS');
                      setSearchTerm('');
                    }}
                    className="group relative bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-0 w-full overflow-hidden"
                  >
                    {/* Efeito de brilho */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                    
                    <div className="relative flex items-center justify-center">
                      <Filter className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="tracking-wide">Limpar Filtros</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Estado de carregamento */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando dados da frota...</p>
          </CardContent>
        </Card>
      )}

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
            <div className="mt-4 flex gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicles Table */}
      {!isLoading && !error && (
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <CardTitle>Veículos ({totalItems})</CardTitle>
                <div className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages} • Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Controle de Ordenação */}
                <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest') => setSortBy(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">🔽 Mais Recentes</SelectItem>
                    <SelectItem value="oldest">🔼 Mais Antigos</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Badges de Filtros */}
                {(filtroStatus !== 'TODOS' || filtroGaragem !== 'TODAS') && (
                  <div className="flex gap-2">
                    {filtroStatus !== 'TODOS' && (
                      <Badge variant="secondary" className="text-xs">
                        Status: {filtroStatus}
                      </Badge>
                    )}
                    {filtroGaragem !== 'TODAS' && (
                      <Badge variant="secondary" className="text-xs">
                        Garagem: {filtroGaragem}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bus className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Nenhum veículo encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchTerm || filtroStatus !== 'TODOS' || filtroGaragem !== 'TODAS' 
                    ? 'Nenhum veículo corresponde aos filtros aplicados. Tente ajustar os critérios de busca.' 
                    : 'Nenhum veículo foi encontrado no sistema. Tente atualizar os dados.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleRefresh} variant="outline" className="bg-white hover:bg-gray-50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar Dados
                  </Button>
                  {(searchTerm || filtroStatus !== 'TODOS' || filtroGaragem !== 'TODAS') && (
                    <Button 
                      onClick={() => {
                        setSearchTerm('');
                        setFiltroStatus('TODOS');
                        setFiltroGaragem('TODAS');
                      }} 
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <th className="text-left p-4 text-sm font-bold tracking-wide">
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4" />
                          Prefixo
                        </div>
                      </th>
                      <th className="text-left p-4 text-sm font-bold tracking-wide">Placa</th>
                      <th className="text-left p-4 text-sm font-bold tracking-wide">Modelo</th>
                      <th className="text-left p-4 text-sm font-bold tracking-wide">Ano</th>
                      <th className="text-left p-4 text-sm font-bold tracking-wide">Status</th>
                      <th className="text-left p-4 text-sm font-bold tracking-wide">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Garagem
                        </div>
                      </th>
                      <th className="text-right p-4 text-sm font-bold tracking-wide">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((veiculo, index) => (
                      <tr 
                        key={veiculo.id} 
                        className={`border-b border-gray-100 dark:border-gray-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:shadow-md ${
                          index % 2 === 0 
                            ? 'bg-white dark:bg-gray-800' 
                            : 'bg-gray-50/30 dark:bg-gray-700/30'
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {veiculo.prefixo.slice(-2)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">{veiculo.prefixo}</div>
                              <div className="text-xs text-gray-500">Veículo</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                            {veiculo.placa}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {veiculo.modelo || '-'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {veiculo.ano || '-'}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${getStatusBadge(veiculo.status)} px-3 py-1 text-xs font-semibold shadow-sm`}>
                            {veiculo.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {veiculo.garagemNome || veiculo.garagem || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Visualizar Detalhes"
                              onClick={() => handleViewDetails(veiculo)}
                              className="group hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 transition-all duration-200 rounded-lg p-2"
                            >
                              <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} veículos
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Primeira Página */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Página Anterior */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Números das Páginas */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      
                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(i)}
                            className={`h-9 w-9 p-0 ${
                              currentPage === i
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md'
                                : 'hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            {i}
                          </Button>
                        );
                      }
                      
                      return pages;
                    })()} 
                  </div>
                  
                  {/* Próxima Página */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  {/* Última Página */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes */}
      <VeiculoDetailsModal
        veiculo={selectedVeiculo}
        isOpen={showModal}
        onClose={handleCloseModal}
      />
      </div>
    </div>
  );
}
