// src/pages/admin/UsersManagementPage.tsx - CORRIGIDO
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Home,
  Building2,
  Mail,
  Phone,
  Calendar,
  Activity,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  position?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  phone?: string;
  notes?: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  byRole?: Record<string, number>;
  byDepartment?: Record<string, number>;
}

export function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();

  // ✅ ROLES CORRIGIDOS CONFORME BACKEND
  const roles = [
    { id: 'admin', name: 'Administrador', color: 'bg-red-500/20 text-red-400' },
    { id: 'director', name: 'Diretor', color: 'bg-purple-500/20 text-purple-400' },
    { id: 'operator', name: 'Operador', color: 'bg-orange-500/20 text-orange-400' },
    { id: 'user', name: 'Usuário', color: 'bg-gray-500/20 text-gray-400' }
  ];

  const departments = [
    'Recursos Humanos', 'Departamento Pessoal', 'Financeiro', 'Planejamento', 
    'Jurídico', 'Centro de Controle Operacional', 'Operação', 'Manutenção', 'Frota'
  ];

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedDepartment, selectedStatus]);

  // ✅ FUNÇÃO CORRIGIDA PARA CARREGAR USUÁRIOS
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('workshop_token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      console.log('🔍 [USERS] Carregando usuários...');
      
      const response = await fetch('http://localhost:3336/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 [USERS] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado. Faça login novamente.');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado. Você não tem permissão para visualizar usuários.');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [USERS] Dados recebidos:', data);

      // ✅ VERIFICAR ESTRUTURA DOS DADOS
      if (Array.isArray(data)) {
        setUsers(data);
        console.log('📋 [USERS] Usuários carregados:', data.length);
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
        console.log('📋 [USERS] Usuários carregados:', data.users.length);
      } else if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
        console.log('�� [USERS] Usuários carregados:', data.data.length);
      } else {
        console.warn('⚠️ [USERS] Estrutura de dados inesperada:', data);
        setUsers([]);
      }

    } catch (error) {
      console.error('❌ [USERS] Erro ao carregar usuários:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar usuários');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNÇÃO CORRIGIDA PARA CARREGAR ESTATÍSTICAS
  const loadStats = async () => {
    try {
      const token = localStorage.getItem('workshop_token');
      
      if (!token) return;

      console.log('📊 [STATS] Carregando estatísticas...');
      
      const response = await fetch('http://localhost:3336/users/statistics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [STATS] Estatísticas carregadas:', data);
        setStats(data);
      } else {
        console.warn('⚠️ [STATS] Não foi possível carregar estatísticas');
        // Calcular estatísticas localmente se a API não retornar
        calculateLocalStats();
      }
    } catch (error) {
      console.error('❌ [STATS] Erro ao carregar estatísticas:', error);
      calculateLocalStats();
    }
  };

  // ✅ CALCULAR ESTATÍSTICAS LOCALMENTE
  const calculateLocalStats = () => {
    if (users.length === 0) return;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const localStats: UserStats = {
      total: users.length,
      active: users.filter(user => user.isActive).length,
      inactive: users.filter(user => !user.isActive).length,
      newThisMonth: users.filter(user => 
        new Date(user.createdAt) >= thisMonth
      ).length
    };

    console.log('📊 [STATS] Estatísticas calculadas localmente:', localStats);
    setStats(localStats);
  };

  // ✅ FUNÇÃO DE FILTRO CORRIGIDA
  const filterUsers = () => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users.filter(user => {
      // Verificar se user é um objeto válido
      if (!user || typeof user !== 'object') return false;

      // Filtro de busca
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
        (user.username && user.username.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower));
      
      // Filtro de role
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      
      // Filtro de departamento
      const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
      
      // Filtro de status
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'active' && user.isActive) ||
                           (selectedStatus === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });

    console.log('🔍 [FILTER] Usuários filtrados:', filtered.length, 'de', users.length);
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  // ✅ FUNÇÕES AUXILIARES CORRIGIDAS
  const getRoleName = (roleId: string) => {
    const role = roles.find(role => role.id === roleId);
    return role?.name || roleId;
  };

  const getRoleColor = (roleId: string) => {
    const role = roles.find(role => role.id === roleId);
    return role?.color || 'bg-gray-500/20 text-gray-400';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Nunca';
    try {
      const date = new Date(lastLogin);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Hoje';
      if (diffDays === 1) return 'Ontem';
      if (diffDays < 7) return `${diffDays} dias atrás`;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  // ✅ FUNÇÃO PARA DELETAR USUÁRIO
  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.fullName}"?`)) return;

    try {
      const token = localStorage.getItem('workshop_token');
      const response = await fetch(`http://localhost:3336/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ [DELETE] Usuário excluído com sucesso');
        await loadUsers();
        await loadStats();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('❌ [DELETE] Erro ao excluir usuário:', error);
      alert(error instanceof Error ? error.message : 'Erro ao excluir usuário');
    }
  };

  // ✅ FUNÇÃO PARA ALTERAR STATUS
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const action = currentStatus ? 'desativar' : 'ativar';
    if (!confirm(`Tem certeza que deseja ${action} o usuário "${user.fullName}"?`)) return;

    try {
      const token = localStorage.getItem('workshop_token');
      const response = await fetch(`http://localhost:3336/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        console.log(`✅ [STATUS] Usuário ${action} com sucesso`);
        await loadUsers();
        await loadStats();
      } else {
        const error = await response.json();
        throw new Error(error.message || `Erro ao ${action} usuário`);
      }
    } catch (error) {
      console.error(`❌ [STATUS] Erro ao ${action} usuário:`, error);
      alert(error instanceof Error ? error.message : `Erro ao ${action} usuário`);
    }
  };

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // ✅ LOADING STATE MELHORADO
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Carregando usuários...</p>
          <p className="text-gray-400 text-sm mt-2">Conectando com o servidor...</p>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erro ao Carregar Usuários</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadUsers} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => navigate('/home')} 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar para Home
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
              <Home className="h-4 w-4" />
              Voltar para Home
            </Button>
            
            <div className="h-6 w-px bg-white/20" />
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Gerenciamento de Usuários
                  </span>
                </h1>
                <p className="text-gray-400">
                  Administre usuários, permissões e acessos do sistema
                </p>
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
                      <p className="text-sm text-gray-400">Total de Usuários</p>
                      <p className="text-2xl font-bold text-white">{stats.total}</p>
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
                      <p className="text-2xl font-bold text-white">{stats.active}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Usuários Inativos</p>
                      <p className="text-2xl font-bold text-white">{stats.inactive}</p>
                    </div>
                    <UserX className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Novos este Mês</p>
                      <p className="text-2xl font-bold text-white">{stats.newThisMonth}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Controles e Filtros */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Busca */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white"
                    />
                  </div>

                  {/* Filtros */}
                  <div className="flex gap-2">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-40 bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os cargos</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-40 bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={loadUsers}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/admin/users/create')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Usuários */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-0">
              {/* ✅ VERIFICAÇÃO SE HÁ USUÁRIOS */}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {users.length === 0 ? 'Nenhum usuário encontrado' : 'Nenhum usuário corresponde aos filtros'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {users.length === 0 
                      ? 'Comece criando o primeiro usuário do sistema.'
                      : 'Tente ajustar os filtros de busca.'
                    }
                  </p>
                  {users.length === 0 && (
                    <Button
                      onClick={() => navigate('/admin/users/create')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Primeiro Usuário
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-gray-300">Usuário</TableHead>
                        <TableHead className="text-gray-300">Cargo</TableHead>
                        <TableHead className="text-gray-300">Departamento</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Último Login</TableHead>
                        <TableHead className="text-gray-300">Criado em</TableHead>
                        <TableHead className="text-gray-300 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentUsers.map((user) => (
                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                                <span className="text-black font-semibold text-sm">
                                  {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">{user.fullName || user.username}</p>
                                <p className="text-gray-400 text-sm">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>
                              {getRoleName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">{user.department || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {formatLastLogin(user.lastLogin)}
                          </TableCell>
                          <TableCell className="text-gray-300">{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-white/20">
                                <DropdownMenuLabel className="text-gray-300">Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/20" />
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                                  className="text-gray-300 hover:bg-white/10"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => toggleUserStatus(user.id, user.isActive)}
                                  className="text-gray-300 hover:bg-white/10"
                                >
                                  {user.isActive ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-2" />
                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Ativar
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/20" />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-white/10">
                      <p className="text-gray-400 text-sm">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuários
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Próximo
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
    </div>
  );
}