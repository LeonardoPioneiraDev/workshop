// src/pages/admin/UserLastAccessPage.tsx - COMPLETO E CORRIGIDO
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  Search,
  User,
  Clock,
  MapPin,
  Monitor,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  Activity,
  Shield,
  Mail,
  XCircle,
  Lock,
  Unlock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';

interface UserInfo {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  isActive: boolean;
  lastLogin?: string;
}

interface LastAccessInfo {
  user: UserInfo;
  lastAccess?: {
    date: string;
    ipAddress?: string;
    location?: string;
    userAgent?: string;
    eventType: string;
  };
  accessHistory: Array<{
    date: string;
    eventType: string;
    ipAddress?: string;
    success: boolean;
  }>;
  stats: {
    totalLogins: number;
    lastLoginDaysAgo: number;
    averageLoginsPerWeek: number;
    mostUsedIP?: string;
  };
}

export function UserLastAccessPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'email' | 'fullName'>('username');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<LastAccessInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Carregar lista de usuários para sugestões
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('workshop_token');
        if (!token) return;

        // Buscar todos os usuários (limite alto, ou ajuste a paginação da API para trazer todos)
        const response = await fetch('http://localhost:3336/users?limit=9999', { 
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAllUsers(data.data || []);
        }
      } catch (error) {
        console.error('❌ [LAST_ACCESS] Erro ao carregar usuários para sugestões:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Buscar informações de último acesso
  const searchLastAccess = async () => {
    if (!searchTerm.trim()) {
      setError('Digite um termo de busca');
      setUserInfo(null);
      return;
    }

    setLoading(true);
    setError(null);
    setUserInfo(null);

    try {
      const token = localStorage.getItem('workshop_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Primeiro, encontrar o usuário
      let foundUser: UserInfo | null = null;
      
      if (searchType === 'username') {
        foundUser = allUsers.find(u => u.username.toLowerCase() === searchTerm.toLowerCase());
      } else if (searchType === 'email') {
        foundUser = allUsers.find(u => u.email.toLowerCase() === searchTerm.toLowerCase());
      } else { // fullName
        foundUser = allUsers.find(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      if (!foundUser) {
        throw new Error('Usuário não encontrado');
      }

      console.log('🔍 [LAST_ACCESS] Buscando logs para usuário ID:', foundUser.id);

      // Buscar logs do usuário
      const logsResponse = await fetch(`http://localhost:3336/users/logs/user/${foundUser.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let logsData: any[] = [];
      if (logsResponse.ok) {
        const response = await logsResponse.json();
        console.log('✅ [LAST_ACCESS] Logs carregados:', response);
        
        // ✅ CORREÇÃO: Extrair o array de logs da propriedade 'data'
        logsData = response.data || []; // Se response.data existir, usa ele, senão array vazio
        
      } else if (logsResponse.status === 404) {
        console.warn('⚠️ [LAST_ACCESS] Nenhum log encontrado para este usuário.');
        logsData = []; // Nenhum log, mas não é um erro fatal
      } else {
        throw new Error(`Erro ${logsResponse.status}: ${logsResponse.statusText}`);
      }
      
      // ✅ CORREÇÃO: Agora logsData é um array, então podemos usar .filter()
      const loginLogs = logsData.filter((log: any) => 
        log.eventType === 'LOGIN_SUCCESS' || log.eventType === 'LOGIN_FAILED'
      );

      const successfulLogins = loginLogs.filter((log: any) => log.eventType === 'LOGIN_SUCCESS');
      const lastSuccessfulLogin = successfulLogins.length > 0 ? successfulLogins[0] : undefined; // Os logs vêm em ordem DESC por createdAt
      
      let lastLoginDaysAgo = -1;
      if (lastSuccessfulLogin) {
        const now = new Date();
        const lastLoginDate = new Date(lastSuccessfulLogin.createdAt);
        lastLoginDaysAgo = Math.floor((now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      const stats = {
        totalLogins: successfulLogins.length,
        lastLoginDaysAgo: lastLoginDaysAgo,
        averageLoginsPerWeek: 0, // Calcular se necessário
        mostUsedIP: getMostUsedIP(loginLogs)
      };

      const userLastAccess: LastAccessInfo = {
        user: foundUser,
        lastAccess: lastSuccessfulLogin ? {
          date: lastSuccessfulLogin.createdAt,
          ipAddress: lastSuccessfulLogin.ipAddress,
          location: lastSuccessfulLogin.location,
          userAgent: lastSuccessfulLogin.userAgent,
          eventType: lastSuccessfulLogin.eventType
        } : undefined,
        accessHistory: logsData.slice(0, 10).map((log: any) => ({
          date: log.createdAt,
          eventType: log.eventType,
          ipAddress: log.ipAddress,
          success: log.success
        })),
        stats
      };

      setUserInfo(userLastAccess);

    } catch (error) {
      console.error('❌ [LAST_ACCESS] Erro na busca:', error);
      setError(error instanceof Error ? error.message : 'Erro ao buscar informações');
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para encontrar IP mais usado
  const getMostUsedIP = (logs: any[]) => {
    const ipCount: Record<string, number> = {};
    logs.forEach(log => {
      if (log.ipAddress) {
        ipCount[log.ipAddress] = (ipCount[log.ipAddress] || 0) + 1;
      }
    });
    
    let mostUsed = '';
    let maxCount = 0;
    Object.entries(ipCount).forEach(([ip, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = ip;
      }
    });
    
    return mostUsed || undefined;
  };

  // Formatação de data
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
      if (diffMinutes < 60) return `${diffMinutes} minutos atrás`;
      if (diffHours < 24) return `${diffHours} horas atrás`;
      if (diffDays === 1) return 'Ontem';
      if (diffDays < 7) return `${diffDays} dias atrás`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
      return `${Math.floor(diffDays / 30)} meses atrás`;
    } catch {
      return 'Data inválida';
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-400',
      director: 'bg-purple-500/20 text-purple-400',
      gerente: 'bg-blue-500/20 text-blue-400',
      encarregado: 'bg-cyan-500/20 text-cyan-400',
      coordenador: 'bg-emerald-500/20 text-emerald-400',
      supervisor: 'bg-amber-500/20 text-amber-400',
      analista: 'bg-orange-500/20 text-orange-400',
      operator: 'bg-gray-700/20 text-gray-400',
      user: 'bg-gray-500/20 text-gray-400'
    };
    return colors[role] || colors.user;
  };

  const getRoleName = (role: string) => {
    const names: Record<string, string> = {
      admin: 'Administrador',
      director: 'Diretor',
      gerente: 'Gerente',
      encarregado: 'Encarregado',
      coordenador: 'Coordenador',
      supervisor: 'Supervisor',
      analista: 'Analista',
      operator: 'Operador',
      user: 'Usuário'
    };
    return names[role] || 'Usuário';
  };

  const getEventTypeIcon = (eventType: string, success?: boolean) => {
    if (success === false) return <XCircle className="h-4 w-4 text-red-400" />;
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

  // Sugestões de usuários baseadas na busca
  const getSuggestions = () => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];
    
    return allUsers
      .filter(user => {
        const term = searchTerm.toLowerCase();
        if (searchType === 'username') {
          return user.username.toLowerCase().includes(term);
        } else if (searchType === 'email') {
          return user.email.toLowerCase().includes(term);
        } else {
          return user.fullName.toLowerCase().includes(term);
        }
      })
      .slice(0, 5);
  };

  const suggestions = getSuggestions();

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
              onClick={() => navigate('/admin/users/logs')}
              className="text-white hover:bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Logs
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
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Último Acesso de Usuário
                  </span>
                </h1>
                <p className="text-gray-400">
                  Consulte quando foi o último acesso de qualquer usuário
                </p>
              </div>
            </div>
          </div>

          {/* Formulário de Busca */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Tipo de Busca</Label>
                  <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="username">Nome de Usuário</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="fullName">Nome Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 relative">
                  <Label className="text-gray-300">
                    {searchType === 'username' ? 'Nome de Usuário' :
                    searchType === 'email' ? 'Email' :
                    'Nome Completo'}
                  </Label>
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      searchType === 'username' ? 'Digite o username...' :
                      searchType === 'email' ? 'Digite o email...' :
                      'Digite o nome...'
                    }
                    className="bg-white/5 border-white/20 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && searchLastAccess()}
                  />
                  
                  {/* Sugestões */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-lg">
                      {suggestions.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-b-0"
                          onClick={() => {
                            if (searchType === 'username') setSearchTerm(user.username);
                            else if (searchType === 'email') setSearchTerm(user.email);
                            else setSearchTerm(user.fullName);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                              <span className="text-black font-semibold text-xs">
                                {user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">{user.fullName}</div>
                              <div className="text-gray-400 text-xs">@{user.username} • {user.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={searchLastAccess}
                    disabled={loading || !searchTerm.trim()}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Buscando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Buscar
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultados */}
          {userInfo && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Informações do Usuário */}
              <div className="lg:col-span-1">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações do Usuário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-black font-bold text-xl">
                          {userInfo.user.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-lg">{userInfo.user.fullName}</h3>
                      <p className="text-gray-400">@{userInfo.user.username}</p>
                      <p className="text-gray-400 text-sm">{userInfo.user.email}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Cargo:</span>
                        <Badge className={getRoleColor(userInfo.user.role)}>
                          {getRoleName(userInfo.user.role)}
                        </Badge>
                      </div>

                      {userInfo.user.department && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Departamento:</span>
                          <span className="text-white">{userInfo.user.department}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Status:</span>
                        <Badge className={userInfo.user.isActive 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                        }>
                          {userInfo.user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estatísticas */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Estatísticas de Acesso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total de Logins Sucesso:</span>
                      <span className="text-white font-bold">{userInfo.stats.totalLogins}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Último Login Sucesso:</span>
                      <span className="text-white font-bold">
                        {userInfo.stats.lastLoginDaysAgo >= 0 
                          ? `${userInfo.stats.lastLoginDaysAgo} dias atrás`
                          : 'Nunca'
                        }
                      </span>
                    </div>

                    {userInfo.stats.mostUsedIP && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">IP mais usado:</span>
                        <span className="text-white font-mono text-sm">{userInfo.stats.mostUsedIP}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Último Acesso e Histórico */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Último Acesso */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Detalhes do Último Login (Sucesso)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userInfo.lastAccess ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">Data e Hora</span>
                            </div>
                            <p className="text-white font-bold text-lg">{formatDate(userInfo.lastAccess.date)}</p>
                            <p className="text-gray-400 text-sm">{getRelativeTime(userInfo.lastAccess.date)}</p>
                          </div>

                          {userInfo.lastAccess.ipAddress && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <MapPin className="h-4 w-4" />
                                <span className="font-medium">Endereço IP</span>
                              </div>
                              <p className="text-white font-bold text-lg">{userInfo.lastAccess.ipAddress}</p>
                              {userInfo.lastAccess.location && (
                                <p className="text-gray-400 text-sm">{userInfo.lastAccess.location}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {userInfo.lastAccess.userAgent && (
                          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                              <Monitor className="h-4 w-4" />
                              <span className="font-medium">Dispositivo / Agente</span>
                            </div>
                            <p className="text-white text-sm break-all">{userInfo.lastAccess.userAgent}</p>
                            <ExternalLink className="h-3 w-3 mt-2 text-gray-500 hover:text-white cursor-pointer" 
                                  onClick={() => alert(`User Agent Completo:\n${userInfo.lastAccess?.userAgent}`)} 
                                />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400 text-lg">Nenhum login de sucesso encontrado.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Histórico de Acessos Recentes */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Histórico de Acessos Recentes (Últimos 10)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userInfo.accessHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20">
                              <TableHead className="text-gray-300">Data/Hora</TableHead>
                              <TableHead className="text-gray-300">Evento</TableHead>
                              <TableHead className="text-gray-300">Status</TableHead>
                              <TableHead className="text-gray-300">IP</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userInfo.accessHistory.map((log, index) => (
                              <TableRow key={index} className="border-white/10 hover:bg-white/5">
                                <TableCell className="text-gray-300">
                                  <div>
                                    <div className="font-medium">{formatDate(log.date)}</div>
                                    <div className="text-xs text-gray-400">{getRelativeTime(log.date)}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getEventTypeIcon(log.eventType, log.success)}
                                    <Badge className={log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                      {getEventTypeLabel(log.eventType)}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={log.success 
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                  }>
                                    {log.success ? 'Sucesso' : 'Falha'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-300">{log.ipAddress || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400 text-lg">Nenhum histórico de acesso recente encontrado para este usuário.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}