// src/pages/admin/users/UsersListPage.tsx - VERSÃO COM CARREGAMENTO FORÇADO DO AUTOTABLE
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
// Importação forçada do autoTable
import autoTable from 'jspdf-autotable';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Download,
  RefreshCw,
  AlertCircle,
  Home,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  mustChangePassword: boolean;
  lastLogin?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface Statistics {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  recentLogins: number;
  mustChangePassword: number;
}

export function UsersListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Função para buscar usuários (com ou sem paginação, para exportação)
  const fetchUsersData = async (options?: { page?: number, limit?: number, ignorePagination?: boolean }) => {
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
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (filterRole !== 'all') {
        params.append('role', filterRole);
      }
      if (filterStatus !== 'all') {
        params.append('isActive', filterStatus === 'active' ? 'true' : 'false');
      }
      if (filterDepartment !== 'all') {
        params.append('department', filterDepartment);
      }

      console.log('🔍 [USERS_LIST] Buscando usuários:', `http://localhost:3336/users?${params}`);

      const response = await fetch(`http://localhost:3336/users?${params}`, {
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
          throw new Error('Você não tem permissão para acessar esta funcionalidade.');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('✅ [USERS_LIST] Usuários carregados:', data);

      if (!options?.ignorePagination) {
        setUsers(data.data || []);
        setCurrentPage(options?.page || 1);
      }
      return data.data || [];

    } catch (error) {
      console.error('❌ [USERS_LIST] Erro ao carregar usuários:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar usuários');
      return [];
    } finally {
      if (!options?.ignorePagination) setLoading(false);
      setRefreshing(false);
    }
  };

  // Wrapper para a função de buscar usuários para a lista principal
  const fetchUsersList = (page: number = 1, showLoading: boolean = true) => {
    fetchUsersData({ page, showLoading });
  };

  // Buscar estatísticas
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('workshop_token');
      if (!token) return;

      const response = await fetch('http://localhost:3336/users/statistics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const stats = await response.json();
        console.log('📊 [USERS_LIST] Estatísticas carregadas:', stats);
        setStatistics(stats);
      }
    } catch (error) {
      console.error('❌ [USERS_LIST] Erro ao carregar estatísticas:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchUsersList(1);
    fetchStatistics();
  }, []);

  // Aplicar filtros (com debounce para busca)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchUsersList(1, false);
      } else {
        setCurrentPage(1);
        fetchUsersList(1, false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterRole, filterStatus, filterDepartment]);

  // Refresh manual
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsersList(currentPage, false);
    fetchStatistics();
  };

  // Funções auxiliares
  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      director: 'Diretor(a)',
      gerente: 'Gerente',
      encarregado: 'Encarregado(a)',
      coordenador: 'Coordenador(a)',
      supervisor: 'Supervisor(a)',
      analista: 'Analista',
      operator: 'Operador(a)',
      user: 'Usuário'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      director: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      gerente: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      encarregado: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      coordenador: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      supervisor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      analista: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      operator: 'bg-gray-700/20 text-gray-400 border-gray-700/30',
      user: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[role] || colors.user;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getDepartmentName = (department?: string) => {
    const departments: Record<string, string> = {
      recursos_humanos: 'Recursos Humanos',
      departamento_pessoal: 'Departamento Pessoal',
      financeiro: 'Financeiro',
      planejamento: 'Planejamento',
      juridico: 'Jurídico',
      centro_controle_operacional: 'C.C. Operacional',
      operacao: 'Operação',
      manutencao: 'Manutenção',
      frota: 'Frota'
    };
    return department ? departments[department] || department : '-';
  };

  // ✅ FUNÇÃO PARA EXPORTAR DADOS PARA PDF - VERSÃO CORRIGIDA
  const handleExportUsersToPdf = async () => {
    try {
      // Busca todos os usuários com os filtros atuais, ignorando a paginação
      const allUsersForExport: User[] = await fetchUsersData({ ignorePagination: true });

      if (allUsersForExport.length === 0) {
        alert('Nenhum usuário para exportar com os filtros atuais.');
        return;
      }

      // Criar novo documento PDF
      const doc = new jsPDF('landscape');

      // Adicionar título
      doc.setFontSize(16);
      doc.text('Relatório de Usuários - Viação Pioneira', 14, 20);

      // Adicionar data de geração
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

      // Adicionar informações dos filtros aplicados
      let filterInfo = 'Filtros aplicados: ';
      const appliedFilters = [];
      
      if (searchTerm.trim()) appliedFilters.push(`Busca: "${searchTerm}"`);
      if (filterRole !== 'all') appliedFilters.push(`Cargo: ${getRoleName(filterRole)}`);
      if (filterStatus !== 'all') appliedFilters.push(`Status: ${filterStatus === 'active' ? 'Ativo' : 'Inativo'}`);
      if (filterDepartment !== 'all') appliedFilters.push(`Departamento: ${getDepartmentName(filterDepartment)}`);
      
      if (appliedFilters.length > 0) {
        filterInfo += appliedFilters.join(', ');
      } else {
        filterInfo += 'Nenhum';
      }
      
      doc.text(filterInfo, 14, 35);

      // Definir cabeçalhos da tabela
      const tableHeaders = [
        'Nome Completo',
        'Usuário',
        'Email',
        'Cargo',
        'Departamento',
        'Status',
        'Email Verificado',
        'Último Login'
      ];

      // Mapear dados dos usuários para o formato da tabela
      const tableData = allUsersForExport.map(user => [
        user.fullName,
        user.username,
        user.email,
        getRoleName(user.role),
        getDepartmentName(user.department),
        user.isActive ? 'Ativo' : 'Inativo',
        user.emailVerified ? 'Sim' : 'Não',
        user.lastLogin 
          ? new Date(user.lastLogin).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Nunca'
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
          0: { cellWidth: 35 }, // Nome Completo
          1: { cellWidth: 25 }, // Usuário
          2: { cellWidth: 45 }, // Email
          3: { cellWidth: 25 }, // Cargo
          4: { cellWidth: 30 }, // Departamento
          5: { cellWidth: 20 }, // Status
          6: { cellWidth: 20 }, // Email Verificado
          7: { cellWidth: 35 }  // Último Login
        }
      });

      // Adicionar rodapé com total de usuários
      const finalY = (doc as any).lastAutoTable?.finalY || doc.internal.pageSize.height - 20;
      doc.setFontSize(10);
      doc.text(`Total de usuários: ${allUsersForExport.length}`, 14, finalY + 10);

      // Salvar o arquivo
      const fileName = `usuarios_workshop_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      // alert('Usuários exportados com sucesso para PDF!');

    } catch (err: any) {
      console.error('Erro ao exportar usuários para PDF:', err);
      alert('Erro ao exportar usuários. Verifique o console para mais detalhes: ' + (err.message || err));
    }
  };

  // Ações de usuário
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('workshop_token');
      const response = await fetch(`http://localhost:3336/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isActive: !currentStatus }
            : user
        ));
        fetchStatistics();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar status do usuário');
      }
    } catch (error) {
      console.error('❌ [USERS_LIST] Erro ao alterar status:', error);
      alert(error instanceof Error ? error.message : 'Erro ao alterar status do usuário');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('workshop_token');
      const response = await fetch(`http://localhost:3336/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        fetchStatistics();
        alert('Usuário excluído com sucesso');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('❌ [USERS_LIST] Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  // Obter departamentos únicos para filtro
  const uniqueDepartments = Array.from(new Set(users.map(u => u.department).filter(Boolean)));
  const filterableRoles = [
    { id: 'admin', name: 'Administrador' },
    { id: 'director', name: 'Diretor' },
    { id: 'gerente', name: 'Gerente' },
    { id: 'encarregado', name: 'Encarregado' },
    { id: 'coordenador', name: 'Coordenador' },
    { id: 'supervisor', name: 'Supervisor' },
    { id: 'analista', name: 'Analista' },
    { id: 'operator', name: 'Operador' },
    { id: 'user', name: 'Usuário' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erro ao Carregar Usuários</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => fetchUsersList(1)} className="bg-yellow-500 hover:bg-yellow-600 text-black">
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
              onClick={() => navigate('/home')}
              className="text-white hover:bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            
            <div className="h-6 w-px bg-white/20" />
            
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                      Gerenciamento de Usuários
                    </span>
                  </h1>
                  <p className="text-gray-400">
                    Administre usuários, permissões e acessos do sistema
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
                    onClick={() => navigate('/admin/users/logs')} 
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Ver Logs
                  </Button>

                  <Button
                    onClick={() => navigate('/admin/users/create')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleExportUsersToPdf}
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
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total de Usuários</p>
                      <p className="text-2xl font-bold text-white">{statistics.total}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Usuários Ativos</p>
                      <p className="text-2xl font-bold text-white">{statistics.active}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Administradores</p>
                      <p className="text-2xl font-bold text-white">{statistics.byRole.admin || 0}</p>
                    </div>
                    <Shield className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Precisam Trocar Senha</p>
                      <p className="text-2xl font-bold text-white">{statistics.mustChangePassword}</p>
                    </div>
                    <UserX className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
                
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Filtrar por cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os cargos</SelectItem>
                    {filterableRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Filtrar por departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {uniqueDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept!}>
                        {getDepartmentName(dept)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de usuários */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">
                Lista de Usuários ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Nenhum usuário encontrado</h3>
                  <p className="text-gray-400 mb-6">
                    {searchTerm || filterRole !== 'all' || filterStatus !== 'all' || filterDepartment !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando o primeiro usuário do sistema'
                    }
                  </p>
                  <Button
                    onClick={() => navigate('/admin/users/create')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Usuário
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-gray-300">Nome Completo</TableHead>
                        <TableHead className="text-gray-300">Usuário</TableHead>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Cargo</TableHead>
                        <TableHead className="text-gray-300">Departamento</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Último Acesso</TableHead>
                        <TableHead className="text-gray-300">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-white font-medium">
                            <div>
                              <div>{user.fullName}</div>
                              {user.mustChangePassword && (
                                <Badge variant="outline" className="text-xs mt-1 border-yellow-500/30 text-yellow-400">
                                  Deve trocar senha
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {user.username}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <div>
                              <div>{user.email}</div>
                              {!user.emailVerified && (
                                <span className="text-xs text-red-400">Não verificado</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>
                              {getRoleName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {getDepartmentName(user.department)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.isActive)}>
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {user.lastLogin 
                              ? new Date(user.lastLogin).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Nunca'
                            }
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-white/20">
                                <DropdownMenuLabel className="text-white">Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/20" />
                               
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                                  className="text-gray-300 hover:text-white hover:bg-white/10"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleStatus(user.id, user.isActive)}
                                  className="text-gray-300 hover:text-white hover:bg-white/10"
                                >
                                  {user.isActive ? (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Ativar
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/20" />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id, user.fullName)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  disabled={user.id === currentUser?.id}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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