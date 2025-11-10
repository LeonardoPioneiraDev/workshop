// src/pages/admin/CreateUserPage.tsx - COMPLETO E ATUALIZADO
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Home,
  UserPlus,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Users,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Shield,
  FileText,
  Send,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

// ✅ SCHEMA ATUALIZADO COM TODOS OS ROLES
const createUserSchema = z.object({
  username: z.string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(100, 'Username deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username deve conter apenas letras, números, pontos, hífens e underscores'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .refine(
      (email) => email.endsWith('@vpioneira.com.br'),
      'Email deve ser do domínio @vpioneira.com.br'
    ),
  fullName: z.string()
    .min(2, 'Nome completo deve ter pelo menos 2 caracteres')
    .max(255, 'Nome completo deve ter no máximo 255 caracteres'),
  phone: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  // ✅ ENUM ATUALIZADO COM OS NOVOS ROLES
  role: z.enum(['admin', 'director', 'gerente', 'encarregado', 'coordenador', 'supervisor', 'analista', 'operator', 'user']),
  isActive: z.boolean().default(true),
  sendWelcomeEmail: z.boolean().default(true),
  notes: z.string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

interface Department {
  id: string;
  name: string;
  description: string;
}

interface Position {
  id: string;
  name: string;
  hierarchy: number;
}

export function CreateUserPage() {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      isActive: true,
      sendWelcomeEmail: true,
      role: 'user',
    },
    mode: 'onChange'
  });

  // ✅ ROLES ATUALIZADOS CONFORME O BACKEND (role.enum.ts)
  const roles: Role[] = [
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Controle total do sistema',
      color: 'bg-red-500/20 text-red-400',
      permissions: [
        'Gerenciar usuários', 'Configurações do sistema', 'Todos os relatórios', 'Acesso completo ao Oracle', 'Dashboard administrativo', 'Auditoria completa'
      ]
    },
    {
      id: 'director',
      name: 'Diretor(a)',
      description: 'Direção executiva',
      color: 'bg-purple-500/20 text-purple-400',
      permissions: [
        'Relatórios executivos', 'Dashboard analítico', 'Visão geral dos departamentos', 'Planejamento estratégico', 'Analytics avançados', 'Gerenciar status de usuários'
      ]
    },
    {
      id: 'gerente',
      name: 'Gerente',
      description: 'Gestão de equipes e departamentos',
      color: 'bg-blue-500/20 text-blue-400',
      permissions: [
        'Gerenciar equipes', 'Relatórios de departamento', 'Dashboard de equipe', 'Aprovar despesas', 'Configurações de departamento'
      ]
    },
    {
      id: 'encarregado',
      name: 'Encarregado(a)',
      description: 'Supervisão de tarefas e operações',
      color: 'bg-cyan-500/20 text-cyan-400',
      permissions: [
        'Visualizar equipe', 'Atribuir tarefas', 'Acompanhar progresso', 'Monitorar operações', 'Visualizar casos jurídicos'
      ]
    },
    {
      id: 'coordenador',
      name: 'Coordenador(a)',
      description: 'Coordenação de projetos e atividades',
      color: 'bg-emerald-500/20 text-emerald-400',
      permissions: [
        'Gerenciar tarefas de equipe', 'Revisar trabalho', 'Planejar operações', 'Coordenar logística', 'Acessar dados limitados do Oracle'
      ]
    },
    {
      id: 'supervisor',
      name: 'Supervisor(a)',
      description: 'Supervisão direta de operações e pessoal',
      color: 'bg-amber-500/20 text-amber-400',
      permissions: [
        'Visualizar equipe', 'Reportar problemas', 'Aprovar operações básicas', 'Visualizar status de manutenção', 'Monitoramento de status'
      ]
    },
    {
      id: 'analista',
      name: 'Analista',
      description: 'Análise de dados e suporte técnico/operacional',
      color: 'bg-orange-500/20 text-orange-400',
      permissions: [
        'Ler dados do Oracle', 'Dashboard de leitura', 'Analisar dados', 'Extrair e transformar dados', 'Analisar documentos jurídicos'
      ]
    },
    {
      id: 'operator',
      name: 'Operador(a)',
      description: 'Execução de tarefas operacionais básicas',
      color: 'bg-gray-700/20 text-gray-400',
      permissions: [
        'Executar operações', 'Inserir dados', 'Visualizar dashboards básicos', 'Rastrear veículos', 'Processar pedidos'
      ]
    },
    {
      id: 'user',
      name: 'Usuário',
      description: 'Acesso padrão ao sistema',
      color: 'bg-gray-500/20 text-gray-400',
      permissions: [
        'Dashboard pessoal', 'Alterar perfil', 'Alterar senha', 'Notificações básicas'
      ]
    }
  ];

  // ✅ DEPARTAMENTOS ATUALIZADOS CONFORME O BACKEND (department.enum.ts)
  const departments: Department[] = [
    { id: 'recursos_humanos', name: 'Recursos Humanos', description: 'Gestão de pessoas, recrutamento e desenvolvimento' },
    { id: 'departamento_pessoal', name: 'Departamento Pessoal', description: 'Administração de pessoal e folha de pagamento' },
    { id: 'financeiro', name: 'Financeiro', description: 'Gestão financeira e contábil' },
    { id: 'planejamento', name: 'Planejamento', description: 'Planejamento estratégico e análise de dados' },
    { id: 'juridico', name: 'Jurídico', description: 'Assessoria jurídica e compliance' },
    { id: 'centro_controle_operacional', name: 'Centro de Controle Operacional', description: 'Monitoramento e controle das operações' },
    { id: 'operacao', name: 'Operação', description: 'Execução das atividades operacionais' },
    { id: 'manutencao', name: 'Manutenção', description: 'Manutenção preventiva e corretiva' },
    { id: 'frota', name: 'Frota', description: 'Gestão e controle da frota de veículos' },
  ];

  // ✅ POSIÇÕES ATUALIZADAS CONFORME O BACKEND (position.enum.ts)
  const positions: Position[] = [
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

  const watchedRole = watch('role');
  const watchedDepartment = watch('department');
  const watchedPosition = watch('position');
  const watchedSendEmail = watch('sendWelcomeEmail');
  const watchedEmail = watch('email');

  // ✅ FUNÇÃO DE SUBMIT COMPLETA
  const onSubmit = async (data: CreateUserFormData) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('workshop_token');
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Preparar dados conforme esperado pelo backend
      const submitData: any = {
        username: data.username.trim(),
        email: data.email.trim(),
        fullName: data.fullName.trim(),
        role: data.role,
        isActive: data.isActive,
        sendWelcomeEmail: data.sendWelcomeEmail,
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (data.phone && data.phone.trim()) {
        submitData.phone = data.phone.trim();
      }
      if (data.department) {
        submitData.department = data.department;
      }
      if (data.position) {
        submitData.position = data.position;
      }
      if (data.notes && data.notes.trim()) {
        submitData.notes = data.notes.trim();
      }
      
      console.log('📤 [CREATE_USER] Enviando dados:', submitData);
      
      const response = await fetch('http://localhost:3336/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      console.log('📡 [CREATE_USER] Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [CREATE_USER] Usuário criado:', result);
        setCreatedUser(result);
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        console.error('❌ [CREATE_USER] Erro do servidor:', error);
        
        // Tratar erros específicos
        if (error.message && error.message.includes('já existe')) {
          throw new Error(error.message);
        }
        
        if (error.message && error.message.includes('domínio')) {
          throw new Error('Email deve ser do domínio @vpioneira.com.br');
        }
        
        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((err: any) => 
            `${err.property}: ${Object.values(err.constraints || {}).join(', ')}`
          ).join('\n');
          throw new Error(`Erro de validação:\n${errorMessages}`);
        }
        
        throw new Error(error.message || 'Erro ao criar usuário');
      }
    } catch (error) {
      console.error('💥 [CREATE_USER] Erro ao criar usuário:', error);
      alert(error instanceof Error ? error.message : 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
      navigate('/users');
    }
  };

  const getSelectedRole = () => {
    return roles.find(role => role.id === watchedRole);
  };

  const getSelectedDepartment = () => {
    return departments.find(dept => dept.id === watchedDepartment);
  };

  const getSelectedPosition = () => {
    return positions.find(pos => pos.id === watchedPosition);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/users');
  };

  // ✅ VERIFICAR SE EMAIL É VÁLIDO PARA DOMÍNIO
  const isEmailDomainValid = watchedEmail ? watchedEmail.endsWith('@vpioneira.com.br') : true;

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
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <UserPlus className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Criar Novo Usuário
                  </span>
                </h1>
                <p className="text-gray-400">
                  Adicione um novo usuário ao sistema com domínio @vpioneira.com.br
                </p>
              </div>
            </div>
          </div>

          {/* ✅ ALERTA DE DOMÍNIO */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-blue-400 font-medium mb-2">Política de Email Corporativo</h4>
                <p className="text-blue-300 text-sm">
                  Por segurança, apenas emails do domínio <strong>@vpioneira.com.br</strong> são aceitos. 
                  Isso garante que apenas funcionários da empresa tenham acesso ao sistema.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Formulário Principal */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Informações Básicas */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Username */}
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-300">
                          Nome de Usuário *
                        </Label>
                        <Input
                          id="username"
                          {...register('username')}
                          placeholder="ex: joao.silva"
                          className="bg-white/5 border-white/20 text-white"
                        />
                        {errors.username && (
                          <p className="text-red-400 text-sm flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.username.message}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">
                          Email Corporativo *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          placeholder="joao.silva@vpioneira.com.br"
                          className={`bg-white/5 border-white/20 text-white ${
                            !isEmailDomainValid && watchedEmail ? 'border-red-500' : ''
                          }`}
                        />
                        {!isEmailDomainValid && watchedEmail && (
                          <p className="text-red-400 text-sm flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Email deve ser do domínio @vpioneira.com.br
                          </p>
                        )}
                        {errors.email && (
                          <p className="text-red-400 text-sm flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.email.message}
                          </p>
                        )}
                        <p className="text-gray-400 text-xs">
                          ✓ Apenas emails corporativos são aceitos
                        </p>
                      </div>
                    </div>

                    {/* Nome Completo */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-300">
                        Nome Completo *
                      </Label>
                      <Input
                        id="fullName"
                        {...register('fullName')}
                        placeholder="João da Silva Santos"
                        className="bg-white/5 border-white/20 text-white"
                      />
                      {errors.fullName && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="(61) 99999-9999"
                        className="bg-white/5 border-white/20 text-white"
                      />
                      {errors.phone && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Informações Profissionais */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Informações Profissionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Departamento */}
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-gray-300">
                          Departamento
                        </Label>
                        <Select 
                          value={watch('department') || ''} 
                          onValueChange={(value) => setValue('department', value as any)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Selecione um departamento" />
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

                      {/* Cargo/Posição */}
                      <div className="space-y-2">
                        <Label htmlFor="position" className="text-gray-300">
                          Cargo/Posição
                        </Label>
                        <Select 
                          value={watch('position') || ''} 
                          onValueChange={(value) => setValue('position', value as any)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Selecione um cargo" />
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
                    </div>

                    {/* Role/Permissão */}
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-300">
                        Nível de Acesso *
                      </Label>
                      <Select 
                        value={watch('role')} 
                        onValueChange={(value) => setValue('role', value as any)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Selecione o nível de acesso" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <Badge className={role.color}>
                                  {role.name}
                                </Badge>
                                <span className="text-gray-400 text-sm">- {role.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.role.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Configurações de Email */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Configurações de Acesso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div>
                        <Label htmlFor="sendWelcomeEmail" className="text-gray-300 font-medium">
                          Enviar email de boas-vindas
                        </Label>
                        <p className="text-gray-400 text-sm mt-1">
                          O usuário receberá um email com suas credenciais de acesso e senha temporária
                        </p>
                      </div>
                      <Switch
                        id="sendWelcomeEmail"
                        checked={watch('sendWelcomeEmail')}
                        onCheckedChange={(checked) => setValue('sendWelcomeEmail', checked)}
                      />
                    </div>

                    {watchedSendEmail && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Send className="h-5 w-5 text-green-400 mt-0.5" />
                          <div>
                            <h4 className="text-green-400 font-medium">O que o usuário receberá:</h4>
                            <ul className="text-green-300 text-sm mt-2 space-y-1">
                              <li>• Email de boas-vindas personalizado</li>
                              <li>• Nome de usuário para acesso</li>
                              <li>• Senha temporária gerada automaticamente</li>
                              <li>• Link para primeiro acesso ao sistema</li>
                              <li>• Instruções para definir nova senha</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div>
                          <h4 className="text-yellow-400 font-medium">Processo de Primeiro Acesso:</h4>
                          <ol className="text-yellow-300 text-sm mt-2 space-y-1">
                            <li>1. Usuário recebe email com credenciais</li>
                            <li>2. Acessa o sistema com senha temporária</li>
                            <li>3. Sistema força a criação de nova senha</li>
                            <li>4. Nova senha deve atender aos requisitos de segurança</li>
                            <li>5. Acesso liberado com senha personalizada</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Observações */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Observações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-gray-300">
                        Observações (Opcional)
                      </Label>
                      <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Informações adicionais sobre o usuário..."
                        className="bg-white/5 border-white/20 text-white min-h-[100px]"
                        maxLength={500}
                      />
                      {errors.notes && (
                        <p className="text-red-400 text-sm flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.notes.message}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs">
                        {watch('notes')?.length || 0}/500 caracteres
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar de Informações */}
              <div className="space-y-6">
                
                {/* Status do Usuário */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Status do Usuário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <Label htmlFor="isActive" className="text-gray-300">
                          Usuário Ativo
                        </Label>
                        <p className="text-gray-400 text-sm">
                          Permitir acesso ao sistema
                        </p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={watch('isActive')}
                        onCheckedChange={(checked) => setValue('isActive', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Preview do Role Selecionado */}
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

                {/* Preview do Departamento */}
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

                {/* Preview da Posição */}
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

                {/* Ações */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4 space-y-3">
                    <Button
                      type="submit"
                      disabled={!isValid || loading || !isEmailDomainValid}
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Criando usuário...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Criar Usuário
                        </div>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={loading}
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>

          {/* Modal de Sucesso */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 border border-white/20 rounded-lg p-6 max-w-md w-full"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">
                    Usuário Criado com Sucesso!
                  </h3>
                  
                  <p className="text-gray-400 mb-4">
                    O usuário <strong className="text-white">{createdUser?.fullName}</strong> foi criado 
                    {watchedSendEmail ? ' e receberá um email com as credenciais de acesso.' : '.'}
                  </p>

                  {watchedSendEmail && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                      <div className="flex items-center gap-2 text-blue-400 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>Email enviado para: {createdUser?.email}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSuccessClose}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      Voltar para Lista
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setShowSuccessModal(false);
                        reset();
                        setCreatedUser(null);
                      }}
                      variant="outline"
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      Criar Outro
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}