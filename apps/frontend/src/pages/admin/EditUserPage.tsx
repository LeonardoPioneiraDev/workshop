// src/pages/admin/EditUserPage.tsx - COMPLETO E ATUALIZADO
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Lock,
  Building2, // ✅ Usado Building2 para Departamento
  Shield,
  Eye,
  EyeOff,
  Phone,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Briefcase // ✅ Usado Briefcase para Posição
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  position: string;
  phone: string;
  isActive: boolean;
  notes: string;
}

interface PasswordChangeData {
  newPassword: string;
  confirmPassword: string;
}

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    fullName: '',
    role: '',
    department: '',
    position: '',
    phone: '',
    isActive: true,
    notes: ''
  });

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<any>({});
  const [passwordErrors, setPasswordErrors] = useState<any>({});

  // ✅ ROLES ATUALIZADOS CONFORME O BACKEND (role.enum.ts)
  const roles = [
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Controle total do sistema',
      color: 'bg-red-500/20 text-red-400',
      permissions: ['Gerenciar usuários', 'Configurações do sistema', 'Todos os relatórios', 'Acesso completo ao Oracle', 'Dashboard administrativo', 'Auditoria completa']
    },
    {
      id: 'director',
      name: 'Diretor(a)',
      description: 'Direção executiva',
      color: 'bg-purple-500/20 text-purple-400',
      permissions: ['Relatórios executivos', 'Dashboard analítico', 'Visão geral dos departamentos', 'Planejamento estratégico', 'Analytics avançados', 'Gerenciar status de usuários']
    },
    {
      id: 'gerente',
      name: 'Gerente',
      description: 'Gestão de equipes e departamentos',
      color: 'bg-blue-500/20 text-blue-400',
      permissions: ['Gerenciar equipes', 'Relatórios de departamento', 'Dashboard de equipe', 'Aprovar despesas', 'Configurações de departamento']
    },
    {
      id: 'encarregado',
      name: 'Encarregado(a)',
      description: 'Supervisão de tarefas e operações',
      color: 'bg-cyan-500/20 text-cyan-400',
      permissions: ['Visualizar equipe', 'Atribuir tarefas', 'Acompanhar progresso', 'Monitorar operações', 'Visualizar casos jurídicos']
    },
    {
      id: 'coordenador',
      name: 'Coordenador(a)',
      description: 'Coordenação de projetos e atividades',
      color: 'bg-emerald-500/20 text-emerald-400',
      permissions: ['Gerenciar tarefas de equipe', 'Revisar trabalho', 'Planejar operações', 'Coordenar logística', 'Acessar dados limitados do Oracle']
    },
    {
      id: 'supervisor',
      name: 'Supervisor(a)',
      description: 'Supervisão direta de operações e pessoal',
      color: 'bg-amber-500/20 text-amber-400',
      permissions: ['Visualizar equipe', 'Reportar problemas', 'Aprovar operações básicas', 'Visualizar status de manutenção', 'Monitoramento de status']
    },
    {
      id: 'analista',
      name: 'Analista',
      description: 'Análise de dados e suporte técnico/operacional',
      color: 'bg-orange-500/20 text-orange-400',
      permissions: ['Ler dados do Oracle', 'Dashboard de leitura', 'Analisar dados', 'Extrair e transformar dados', 'Analisar documentos jurídicos']
    },
    {
      id: 'operator',
      name: 'Operador(a)',
      description: 'Execução de tarefas operacionais básicas',
      color: 'bg-gray-700/20 text-gray-400',
      permissions: ['Executar operações', 'Inserir dados', 'Visualizar dashboards básicos', 'Rastrear veículos', 'Processar pedidos']
    },
    {
      id: 'user',
      name: 'Usuário',
      description: 'Acesso padrão ao sistema',
      color: 'bg-gray-500/20 text-gray-400',
      permissions: ['Dashboard pessoal', 'Alterar perfil', 'Alterar senha', 'Notificações básicas']
    }
  ];

  // ✅ DEPARTAMENTOS ATUALIZADOS CONFORME O BACKEND (department.enum.ts)
  const departments = [
    { id: 'recursos_humanos', name: 'Recursos Humanos', description: 'Gestão de pessoas, recrutamento e desenvolvimento' },
    { id: 'departamento_pessoal', name: 'Departamento Pessoal', description: 'Administração de pessoal e folha de pagamento' },
    { id: 'financeiro', name: 'Financeiro', description: 'Gestão financeira e contábil' },
    { id: 'planejamento', name: 'Planejamento', description: 'Planejamento estratégico e análise de dados' },
    { id: 'juridico', name: 'Jurídico', description: 'Assessoria jurídica e compliance' },
    { id: 'centro_controle_operacional', name: 'Centro de Controle Operacional', description: 'Monitoramento e controle das operações' },
    { id: 'operacao', name: 'Operação', description: 'Execução das atividades operacionais' },
    { id: 'manutencao', name: 'Manutenção', description: 'Manutenção preventiva e corretiva' },
    { id: 'frota', name: 'Frota', description: 'Gestão e controle da frota de veículos' }
  ];

  // ✅ POSIÇÕES ATUALIZADAS CONFORME O BACKEND (position.enum.ts)
  const positions = [
    { id: 'administrador_sistema', name: 'Administrador do Sistema', hierarchy: 100 },
    { id: 'diretor', name: 'Diretor(a)', hierarchy: 90 },
    { id: 'gerente', name: 'Gerente', hierarchy: 80 },
    { id: 'coordenador', name: 'Coordenador(a)', hierarchy: 70 },
    { id: 'supervisor', name: 'Supervisor(a)', hierarchy: 60 },
    { id: 'especialista', name: 'Especialista', hierarchy: 45 },
    { id: 'analista', name: 'Analista', hierarchy: 50 }, // Mantido como 50 para hierarquia
    { id: 'tecnico', name: 'Técnico(a)', hierarchy: 40 },
    { id: 'operador', name: 'Operador(a)', hierarchy: 30 },
    { id: 'assistente', name: 'Assistente', hierarchy: 20 },
    { id: 'auxiliar', name: 'Auxiliar', hierarchy: 10 },
  ].sort((a, b) => b.hierarchy - a.hierarchy); // Garante que a lista está ordenada por hierarquia

  // ✅ CARREGAR DADOS DO USUÁRIO
  useEffect(() => {
    const loadUserData = async () => {
      if (!id) {
        setError('ID do usuário não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('workshop_token');
        
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }

        console.log('🔍 [EDIT_USER] Carregando usuário ID:', id);

        const response = await fetch(`http://localhost:3336/users/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 [EDIT_USER] Response status:', response.status);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Usuário não encontrado');
          }
          if (response.status === 403) {
            throw new Error('Sem permissão para editar este usuário');
          }
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const userData = await response.json();
        console.log('✅ [EDIT_USER] Dados carregados:', userData);

        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          fullName: userData.fullName || '',
          role: userData.role || '',
          department: userData.department || '',
          position: userData.position || '',
          phone: userData.phone || '',
          isActive: userData.isActive ?? true,
          notes: userData.notes || ''
        });

      } catch (error) {
        console.error('❌ [EDIT_USER] Erro ao carregar usuário:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [id]);

  // ✅ VALIDAÇÃO DO FORMULÁRIO
  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Nome de usuário deve ter pelo menos 3 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    } else if (!formData.email.endsWith('@vpioneira.com.br')) { // ✅ Validação de domínio aqui também
      newErrors.email = 'Email deve ser do domínio @vpioneira.com.br';
    }

    if (!formData.role) {
      newErrors.role = 'Cargo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ VALIDAÇÃO DE SENHA (PARA A SEÇÃO COMENTADA)
  const validatePassword = (): boolean => {
    const newErrors: any = {};

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ SALVAR ALTERAÇÕES DO USUÁRIO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('workshop_token');
      
      // Preparar dados para envio
      const updateData: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        role: formData.role,
        isActive: formData.isActive,
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.phone && formData.phone.trim()) {
        updateData.phone = formData.phone.trim();
      }
      if (formData.department) {
        updateData.department = formData.department;
      }
      if (formData.position) {
        updateData.position = formData.position;
      }
      if (formData.notes && formData.notes.trim()) {
        updateData.notes = formData.notes.trim();
      }

      console.log('📤 [EDIT_USER] Enviando dados:', updateData);

      const response = await fetch(`http://localhost:3336/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        console.log('✅ [EDIT_USER] Usuário atualizado com sucesso');
        setSuccessMessage('Usuário atualizado com sucesso!');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/users', { 
            state: { message: 'Usuário atualizado com sucesso!' }
          });
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error('❌ [EDIT_USER] Erro do servidor:', errorData);
        
        if (errorData.message && errorData.message.includes('já existe')) {
          throw new Error(errorData.message);
        }
        
        throw new Error(errorData.message || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('💥 [EDIT_USER] Erro ao atualizar:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  // ✅ ALTERAR SENHA (SEÇÃO COMENTADA)
  const handleAdminPasswordChange = async (e: React.FormEvent) => { // Renomeado para Admin
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setChangingPassword(true);
    setError(null);

    try {
      const token = localStorage.getItem('workshop_token');
      
      console.log('🔐 [PASSWORD] Alterando senha para usuário:', id);
      
      const response = await fetch(`http://localhost:3336/users/${id}/admin-change-password`, { // ✅ Usando endpoint de admin
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        console.log('✅ [PASSWORD] Senha alterada com sucesso pelo admin');
        setSuccessMessage('Senha alterada com sucesso! O usuário deverá trocá-la no próximo login.');
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setShowPasswordSection(false);
        
        // Limpar mensagens após 3 segundos
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ [PASSWORD] Erro do servidor:', errorData);
        throw new Error(errorData.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('💥 [PASSWORD] Erro ao alterar senha:', error);
      setError(error instanceof Error ? error.message : 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  // ✅ MANIPULAR MUDANÇAS NO FORMULÁRIO
  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Limpar mensagens
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handlePasswordInputChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // ✅ OBTER INFORMAÇÕES DO ROLE
  const getSelectedRole = () => {
    return roles.find(role => role.id === formData.role);
  };

  const getSelectedDepartment = () => {
    return departments.find(dept => dept.id === formData.department);
  };

  const getSelectedPosition = () => {
    return positions.find(pos => pos.id === formData.position);
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Carregando dados do usuário...</p>
          <p className="text-gray-400 text-sm mt-2">Aguarde um momento...</p>
        </div>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (error && !formData.username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erro ao Carregar Usuário</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => navigate('/users')} 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
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
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Editar Usuário
                </span>
              </h1>
              <p className="text-gray-400">
                Altere os dados do usuário: <strong>{formData.fullName}</strong>
              </p>
            </div>
          </div>

          {/* Mensagens de Feedback */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <p className="text-green-300">{successMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Informações Pessoais */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit}>
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName" className="text-gray-300">
                          Nome Completo *
                        </Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          placeholder="Digite o nome completo"
                          className={`bg-white/5 border-white/20 text-white placeholder:text-gray-400 ${
                            errors.fullName ? 'border-red-500' : ''
                          }`}
                        />
                        {errors.fullName && (
                          <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="username" className="text-gray-300">
                          Nome de Usuário *
                        </Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          placeholder="Digite o nome de usuário"
                          className={`bg-white/5 border-white/20 text-white placeholder:text-gray-400 ${
                            errors.username ? 'border-red-500' : ''
                          }`}
                        />
                        {errors.username && (
                          <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email" className="text-gray-300">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Digite o email"
                          className={`bg-white/5 border-white/20 text-white placeholder:text-gray-400 ${
                            errors.email ? 'border-red-500' : ''
                          }`}
                        />
                        {errors.email && (
                          <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-gray-300">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="(61) 99999-9999"
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-gray-300">
                        Observações
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Observações adicionais sobre o usuário"
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                        rows={3}
                      />
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex justify-end gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/users')}
                        className="border-white/20 text-white hover:bg-white/10"
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>

              {/* Seção de Alteração de Senha (Descomentada e usando endpoint de admin) */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Alterar Senha (Administrativo)
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordSection(!showPasswordSection)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {showPasswordSection ? 'Cancelar' : 'Alterar Senha'}
                    </Button>
                  </div>
                </CardHeader>
                {showPasswordSection && (
                  <CardContent>
                    <form onSubmit={handleAdminPasswordChange} className="space-y-4"> {/* ✅ Usando handleAdminPasswordChange */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="newPassword" className="text-gray-300">
                            Nova Senha *
                          </Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                              placeholder="Digite a nova senha"
                              className={`bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10 ${
                                passwordErrors.newPassword ? 'border-red-500' : ''
                              }`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          {passwordErrors.newPassword && (
                            <p className="text-red-400 text-sm mt-1">{passwordErrors.newPassword}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword" className="text-gray-300">
                            Confirmar Nova Senha *
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                              placeholder="Confirme a nova senha"
                              className={`bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10 ${
                                passwordErrors.confirmPassword ? 'border-red-500' : ''
                              }`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          {passwordErrors.confirmPassword && (
                            <p className="text-red-400 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={changingPassword}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                        >
                          {changingPassword ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Alterando...
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Alterar Senha
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                )}
              </Card>
              
            </div>

            {/* Configurações de Acesso */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Configurações de Acesso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="role" className="text-gray-300">
                      Cargo *
                    </Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                      <SelectTrigger className={`bg-white/5 border-white/20 text-white ${
                        errors.role ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div>
                              <div className="font-medium">{role.name}</div>
                              <div className="text-sm text-gray-500">{role.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-red-400 text-sm mt-1">{errors.role}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="department" className="text-gray-300">
                      Departamento
                    </Label>
                    <Select value={formData.department} onValueChange={(value) => {
                      handleInputChange('department', value);
                      // Limpar posição se o departamento mudar
                      setFormData(prev => ({ ...prev, position: '' }));
                    }}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            <div>
                              <div className="font-medium">{dept.name}</div>
                              <div className="text-sm text-gray-500">{dept.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="position" className="text-gray-300">
                      Posição
                    </Label>
                    <Select 
                      value={formData.position} 
                      onValueChange={(value) => handleInputChange('position', value)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Selecione a posição" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              <div className="flex items-center gap-2">
                                <span>{position.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  Nível {position.hierarchy}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <Label htmlFor="isActive" className="text-gray-300">
                        Usuário Ativo
                      </Label>
                      <p className="text-sm text-gray-400">
                        Usuário pode fazer login no sistema
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preview das Seleções */}
              {getSelectedRole() && (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Nível de Acesso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <Badge className={`${getSelectedRole()?.color} text-lg px-3 py-1`}>
                        {getSelectedRole()?.name}
                      </Badge>
                      <p className="text-gray-400 text-sm mt-2">
                        {getSelectedRole()?.description}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium mb-2">Permissões:</h4>
                      <div className="space-y-1">
                        {getSelectedRole()?.permissions.map((permission) => (
                          <div key={permission} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="text-gray-300">{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {getSelectedDepartment() && (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Departamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <h4 className="text-white font-medium">{getSelectedDepartment()?.name}</h4>
                      <p className="text-gray-400 text-sm mt-1">
                        {getSelectedDepartment()?.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {getSelectedPosition() && (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Cargo/Posição
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <h4 className="text-white font-medium">{getSelectedPosition()?.name}</h4>
                      <Badge variant="outline" className="mt-2">
                        Hierarquia: Nível {getSelectedPosition()?.hierarchy}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}