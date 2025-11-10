// src/pages/admin/UserLogsPage.tsx - COMPLETO E CORRIGIDO
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
// Importação direta do autoTable
import autoTable from 'jspdf-autotable';
import {
  ArrowLeft,
  Home,
  Activity,
  Search,
  Calendar,
  Clock,
  User,
  MapPin,
  Monitor,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Shield,
  ExternalLink,
  Lock,
  Unlock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface LoginLog {
  id: string;
  userId?: number;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
  failureReason?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
    fullName: string;
  };
}

interface LogStats {
  totalLogs: number;
  successfulLogins: number;
  failedLogins: number;
  uniqueUsers: number;
  uniqueIPs: number;
  mostActiveUser?: { username: string; email: string; loginCount: number };
  mostCommonIP?: { ip: string; count: number };
  recentActivity?: {
    last24h: number;
    last7days: number;
    last30days: number;
  };
  eventTypeDistribution?: Array<{
    eventType: string;
    count: number;
    percentage: number;
  }>;
}

export function UserLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [filterSuccess, setFilterSuccess] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('7days');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Função para buscar logs da API (com ou sem paginação, para exportação)
  const fetchLogsData = async (options?: { page?: number, limit?: number, ignorePagination?: boolean }) => {
    try {
      if (!options?.ignorePagination) setLoading(true);
      setError(null);

      const token = localStorage.getItem('workshop_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Construir parâmetros de busca
      const params = new URLSearchParams();
      if (!options?.ignorePagination) {
        params.append('page', (options?.page || 1).toString());
        params.append('limit', (options?.limit || itemsPerPage).toString());
      } else {
        params.append('limit', '99999'); // Limite alto para exportar tudo
      }
      params.append('orderBy', 'createdAt');
      params.append('orderDirection', 'DESC');

      if (searchTerm.trim()) {
        params.append('username', searchTerm.trim());
      }
      if (filterEventType !== 'all') {
        params.append('eventType', filterEventType);
      }
      if (filterSuccess !== 'all') {
        params.append('success', filterSuccess === 'success' ? 'true' : 'false');
      }

      // Filtro de data
      if (filterDateRange !== 'all') {
        const now = new Date();
        let dateFrom: Date;
        
        switch (filterDateRange) {
          case '24h':
            dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7days':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(0);
        }
        
        params.append('dateFrom', dateFrom.toISOString());
        params.append('dateTo', now.toISOString());
      }

      console.log('🔍 [USER_LOGS] Buscando logs:', `http://localhost:3336/users/logs?${params}`);

      const response = await fetch(`http://localhost:3336/users/logs?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (response.status === 403) {
          throw new Error('Você não tem permissão para acessar os logs.');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [USER_LOGS] Logs carregados:', data);

      if (!options?.ignorePagination) {
        setLogs(data.data || []);
        setCurrentPage(options?.page || 1);
      }
      return data.data || [];

    } catch (error) {
      console.error('❌ [USER_LOGS] Erro ao carregar logs:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar logs');
      return [];
    } finally {
      if (!options?.ignorePagination) setLoading(false);
      setRefreshing(false);
    }
  };

  // Wrapper para a função de buscar logs para a lista principal
  const fetchLogsList = (page: number = 1, showLoading: boolean = true) => {
    fetchLogsData({ page, showLoading });
  };

  // Buscar estatísticas
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('workshop_token');
      if (!token) return;

      const response = await fetch('http://localhost:3336/users/logs/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const statsData = await response.json();
        console.log('📊 [USER_LOGS] Estatísticas carregadas:', statsData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('❌ [USER_LOGS] Erro ao carregar estatísticas:', error);
    }
  };

  // Carregar dados iniciais e re-carregar em mudanças de filtro
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLogsList(1);
      fetchStats();
    }, 500); // Debounce para busca
    return () => clearTimeout(handler);
  }, [searchTerm, filterEventType, filterSuccess, filterDateRange]);

  // Refresh manual
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogsList(currentPage, false);
    fetchStats();
  };

  // Funções auxiliares
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN_SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'LOGIN_FAILED':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'LOGOUT':
        return <ArrowLeft className="h-4 w-4 text-blue-400" />;
      case 'PASSWORD_CHANGE':
        return <Shield className="h-4 w-4 text-yellow-400" />;
      case 'TOKEN_REFRESH':
        return <RefreshCw className="h-4 w-4 text-purple-400" />;
      case 'FIRST_LOGIN':
        return <User className="h-4 w-4 text-cyan-400" />;
      case 'ACCOUNT_LOCKED':
        return <Lock className="h-4 w-4 text-orange-400" />;
      case 'ACCOUNT_UNLOCKED':
        return <Unlock className="h-4 w-4 text-green-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'LOGIN_SUCCESS': 'Login Sucesso',
      'LOGIN_FAILED': 'Login Falhado',
      'LOGOUT': 'Logout',
      'PASSWORD_CHANGE': 'Troca de Senha',
      'TOKEN_REFRESH': 'Renovação de Token',
      'FIRST_LOGIN': 'Primeiro Login',
      'ACCOUNT_LOCKED': 'Conta Bloqueada',
      'ACCOUNT_UNLOCKED': 'Conta Desbloqueada'
    };
    return labels[eventType] || eventType;
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      'LOGIN_SUCCESS': 'bg-green-500/20 text-green-400 border-green-500/30',
      'LOGIN_FAILED': 'bg-red-500/20 text-red-400 border-red-500/30',
      'LOGOUT': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'PASSWORD_CHANGE': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'TOKEN_REFRESH': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'FIRST_LOGIN': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'ACCOUNT_LOCKED': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'ACCOUNT_UNLOCKED': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    };
    return colors[eventType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Agora mesmo';
      if (diffMinutes < 60) return `${diffMinutes}min atrás`;
      if (diffHours < 24) return `${diffHours}h atrás`;
      if (diffDays === 1) return 'Ontem';
      if (diffDays < 7) return `${diffDays}d atrás`;
      return formatDate(dateString);
    } catch {
      return 'Data inválida';
    }
  };

  // ✅ FUNÇÃO PARA EXPORTAR LOGS PARA PDF - VERSÃO CORRIGIDA
  const handleExportLogsToPdf = async () => {
    try {
      // Busca todos os logs com os filtros atuais, ignorando a paginação
      const allLogsForExport: LoginLog[] = await fetchLogsData({ ignorePagination: true });

      if (allLogsForExport.length === 0) {
        alert('Nenhum log para exportar com os filtros atuais.');
        return;
      }

      const doc = new jsPDF('landscape'); // Usar orientação paisagem

      // Adicionar título
      doc.setFontSize(16);
      doc.text('Relatório de Logs de Usuários - Viação Pioneira', 14, 20);

      // Adicionar data de geração
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

      // Adicionar informações dos filtros aplicados
      let filterInfo = 'Filtros aplicados: ';
      const appliedFilters = [];
      
      if (searchTerm.trim()) appliedFilters.push(`Busca: "${searchTerm}"`);
      if (filterEventType !== 'all') appliedFilters.push(`Tipo de Evento: ${getEventTypeLabel(filterEventType)}`);
      if (filterSuccess !== 'all') appliedFilters.push(`Status: ${filterSuccess === 'success' ? 'Sucesso' : 'Falha'}`);
      if (filterDateRange !== 'all') appliedFilters.push(`Período: ${filterDateRange}`);
      
      if (appliedFilters.length > 0) {
        filterInfo += appliedFilters.join(', ');
      } else {
        filterInfo += 'Nenhum';
      }
      
      doc.text(filterInfo, 14, 35);

      // Definir cabeçalhos da tabela
      const tableHeaders = [
        'Data/Hora',
        'Usuário',
        'Evento',
        'Status',
        'IP',
        'Localização',
        'Dispositivo'
      ];

      // Mapear dados dos logs para o formato da tabela
      const tableData = allLogsForExport.map(log => [
        formatDate(log.createdAt),
        log.user ? `${log.user.fullName} (@${log.user.username})` : 'N/A',
        getEventTypeLabel(log.eventType),
        log.success ? 'Sucesso' : `Falha (${log.failureReason || 'N/A'})`,
        log.ipAddress || 'N/A',
        log.location || 'Não identificada',
        log.userAgent ? log.userAgent.split(' ')[0] : 'Desconhecido' // Simplificar User Agent para o PDF
      ]);

      // ✅ USAR autoTable IMPORTADO DIRETAMENTE
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Data/Hora
          1: { cellWidth: 40 }, // Usuário
          2: { cellWidth: 25 }, // Evento
          3: { cellWidth: 30 }, // Status
          4: { cellWidth: 25 }, // IP
          5: { cellWidth: 30 }, // Localização
          6: { cellWidth: 40 }  // Dispositivo
        }
      });

      // Adicionar rodapé com total de logs
      const finalY = (doc as any).lastAutoTable?.finalY || doc.internal.pageSize.height - 20;
      doc.setFontSize(10);
      doc.text(`Total de logs: ${allLogsForExport.length}`, 14, finalY + 10);

      // Salvar o arquivo
      const fileName = `logs_usuarios_workshop_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      //alert('Logs exportados com sucesso para PDF!');

    } catch (err: any) {
      console.error('Erro ao exportar logs para PDF:', err);
      alert('Erro ao exportar logs. Verifique o console para mais detalhes: ' + (err.message || err));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando logs de usuários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erro ao Carregar Logs</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => fetchLogsList(1)} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/home')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800">
      <div className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/users')}
              className="text-white hover:bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Usuários
            </Button>
            
            <div className="h-6 w-px bg-white/20" />
            
            <Button
              variant="ghost"
              onClick={() => navigate('/home')}
              className="text-white hover:bg-white/10 flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            
            <div className="h-6 w-px bg-white/20" />
            
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                      Logs de Usuários
                    </span>
                  </h1>
                  <p className="text-gray-400">
                    Monitore atividades de login, logout e acessos ao sistema
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleExportLogsToPdf}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total de Logs</p>
                      <p className="text-2xl font-bold text-white">{stats.totalLogs}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Logins Sucesso</p>
                      <p className="text-2xl font-bold text-white">{stats.successfulLogins}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Logins Falhados</p>
                      <p className="text-2xl font-bold text-white">{stats.failedLogins}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Usuários Únicos</p>
                      <p className="text-2xl font-bold text-white">{stats.uniqueUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Atividade Recente */}
          {stats?.recentActivity && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Últimas 24h</p>
                      <p className="text-xl font-bold text-white">{stats.recentActivity.last24h}</p>
                    </div>
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Últimos 7 dias</p>
                      <p className="text-xl font-bold text-white">{stats.recentActivity.last7days}</p>
                    </div>
                    <Calendar className="h-6 w-6 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Últimos 30 dias</p>
                      <p className="text-xl font-bold text-white">{stats.recentActivity.last30days}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por usuário..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
                
                <Select value={filterEventType} onValueChange={setFilterEventType}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os eventos</SelectItem>
                    <SelectItem value="LOGIN_SUCCESS">Login Sucesso</SelectItem>
                    <SelectItem value="LOGIN_FAILED">Login Falhado</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                    <SelectItem value="PASSWORD_CHANGE">Troca de Senha</SelectItem>
                    <SelectItem value="TOKEN_REFRESH">Renovação Token</SelectItem>
                    <SelectItem value="FIRST_LOGIN">Primeiro Login</SelectItem>
                    <SelectItem value="ACCOUNT_LOCKED">Conta Bloqueada</SelectItem>
                    <SelectItem value="ACCOUNT_UNLOCKED">Conta Desbloqueada</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSuccess} onValueChange={setFilterSuccess}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="false">Falha</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Últimas 24 horas</SelectItem>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="all">Todos os períodos</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => navigate('/admin/users/last-access')}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Último Acesso
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de logs */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">
                Logs de Atividade ({logs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Nenhum log encontrado</h3>
                  <p className="text-gray-400 mb-6">
                    {searchTerm || filterEventType !== 'all' || filterSuccess !== 'all' || filterDateRange !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Não há atividade registrada no período selecionado'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-gray-300">Data/Hora</TableHead>
                        <TableHead className="text-gray-300">Usuário</TableHead>
                        <TableHead className="text-gray-300">Evento</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">IP</TableHead>
                        <TableHead className="text-gray-300">Localização</TableHead>
                        <TableHead className="text-gray-300">Dispositivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-gray-300">
                            <div>
                              <div className="font-medium">{formatDate(log.createdAt)}</div>
                              <div className="text-xs text-gray-400">{getRelativeTime(log.createdAt)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div>
                                <div className="text-white font-medium">{log.user.fullName}</div>
                                <div className="text-gray-400 text-sm">@{log.user.username}</div>
                                <div className="text-gray-400 text-xs">{log.user.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Usuário não identificado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getEventTypeIcon(log.eventType)}
                              <Badge className={getEventTypeColor(log.eventType)}>
                                {getEventTypeLabel(log.eventType)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={log.success 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }>
                              {log.success ? 'Sucesso' : 'Falha'}
                            </Badge>
                            {!log.success && log.failureReason && (
                              <div className="text-xs text-red-400 mt-1">
                                {log.failureReason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {log.ipAddress || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {log.location || 'Não identificada'}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <div className="flex items-center gap-1">
                              <Monitor className="h-3 w-3" />
                              <span className="text-xs">
                                {log.userAgent 
                                  ? log.userAgent.split(' ')[0] 
                                  : 'Desconhecido'
                                }
                              </span>
                              {log.userAgent && (
                                <ExternalLink className="h-3 w-3 ml-1 text-gray-500 hover:text-white cursor-pointer" 
                                  onClick={() => alert(`User Agent Completo:\n${log.userAgent}`)} 
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}