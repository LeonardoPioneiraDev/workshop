// src/pages/admin/users/UserCreatePage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Lock,
  Building,
  Shield,
  Eye,
  EyeOff
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

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  role: string;
  department: string;
  isActive: boolean;
  notes: string;
}

export function UserCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    isActive: true,
    notes: ''
  });
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const departments = [
    'Operações',
    'Financeiro',
    'Jurídico',
    'Recursos Humanos',
    'Departamento Pessoal',
    'Manutenção',
    'Logística',
    'Combustível',
    'TI',
    'Diretoria'
  ];

  const roles = [
    { value: 'user', label: 'Usuário', description: 'Acesso básico ao sistema' },
    { value: 'operator', label: 'Operador', description: 'Operações diárias e relatórios' },
    { value: 'director', label: 'Diretor', description: 'Acesso a relatórios e departamentos' },
    { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

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
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (!formData.role) {
      newErrors.role = 'Cargo é obrigatório';
    }

    if (!formData.department) {
      newErrors.department = 'Departamento é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 9000));
      
      // Aqui você faria a chamada real para a API
      console.log('Criando usuário:', formData);
      
      navigate('/admin/users', { 
        state: { message: 'Usuário criado com sucesso!' }
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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
              onClick={() => navigate('/admin/users')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Criar Novo Usuário
                </span>
              </h1>
              <p className="text-gray-400">
                Preencha os dados para criar um novo usuário no sistema
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Informações Pessoais */}
              <div className="lg:col-span-2">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password" className="text-gray-300">
                          Senha *
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Digite a senha"
                            className={`bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10 ${
                              errors.password ? 'border-red-500' : ''
                            }`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {errors.password && (
                          <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword" className="text-gray-300">
                          Confirmar Senha *
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            placeholder="Confirme a senha"
                            className={`bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10 ${
                              errors.confirmPassword ? 'border-red-500' : ''
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
                        {errors.confirmPassword && (
                          <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                        )}
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
                  </CardContent>
                </Card>
              </div>

              {/* Configurações de Acesso */}
              <div>
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
                            <SelectItem key={role.value} value={role.value}>
                              <div>
                                <div className="font-medium">{role.label}</div>
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
                        Departamento *
                      </Label>
                      <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                        <SelectTrigger className={`bg-white/5 border-white/20 text-white ${
                          errors.department ? 'border-red-500' : ''
                        }`}>
                          <SelectValue placeholder="Selecione o departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.department && (
                        <p className="text-red-400 text-sm mt-1">{errors.department}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
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

                {/* Resumo das Permissões */}
                {formData.role && (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 mt-6">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">
                        Permissões do Cargo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {formData.role === 'admin' && (
                          <>
                            <p className="text-green-400">✓ Acesso total ao sistema</p>
                            <p className="text-green-400">✓ Gerenciar usuários</p>
                            <p className="text-green-400">✓ Configurações do sistema</p>
                            <p className="text-green-400">✓ Todos os relatórios</p>
                          </>
                        )}
                        {formData.role === 'director' && (
                          <>
                            <p className="text-green-400">✓ Relatórios executivos</p>
                            <p className="text-green-400">✓ Acesso aos departamentos</p>
                            <p className="text-green-400">✓ Dashboard completo</p>
                            <p className="text-red-400">✗ Gerenciar usuários</p>
                          </>
                        )}
                        {formData.role === 'operator' && (
                          <>
                            <p className="text-green-400">✓ Operações diárias</p>
                            <p className="text-green-400">✓ Relatórios operacionais</p>
                            <p className="text-green-400">✓ Teste de email</p>
                            <p className="text-red-400">✗ Configurações</p>
                          </>
                        )}
                        {formData.role === 'user' && (
                          <>
                            <p className="text-green-400">✓ Acesso básico</p>
                            <p className="text-green-400">✓ Dashboard limitado</p>
                            <p className="text-red-400">✗ Relatórios</p>
                            <p className="text-red-400">✗ Configurações</p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/users')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}