// src/pages/auth/FirstLoginPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle,
  AlertCircle,
  Shield,
  Key,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

// Schema de validação para primeiro login
const firstLoginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .nonempty('Email é obrigatório'),
  temporaryPassword: z.string()
    .min(1, 'Senha temporária é obrigatória'),
  newPassword: z.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Nova senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Nova senha deve conter pelo menos uma letra minúscula')
    .regex(/\d/, 'Nova senha deve conter pelo menos um número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Nova senha deve conter pelo menos um símbolo'),
  confirmPassword: z.string()
    .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type FirstLoginFormData = z.infer<typeof firstLoginSchema>;

export function FirstLoginPage() {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    temporary: false,
    new: false,
    confirm: false,
  });
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isTemporaryValid, setIsTemporaryValid] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<FirstLoginFormData>({
    resolver: zodResolver(firstLoginSchema),
    defaultValues: {
      email: searchParams.get('email') || '',
    },
    mode: 'onChange',
  });

  // Pré-preencher email da URL
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      setValue('email', decodeURIComponent(emailFromUrl));
    }
  }, [searchParams, setValue]);

// Atualizar no FirstLoginPage.tsx
const validateTemporaryCredentials = async (email: string, temporaryPassword: string): Promise<boolean> => {
  if (!email || !temporaryPassword || temporaryPassword.length < 1) {
    setIsTemporaryValid(false);
    setUserInfo(null);
    setMessage('');
    return false;
  }

  setValidating(true);
  setMessage('');
  
  try {
    // ✅ URL corrigida para apontar para o backend
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://10.10.100.176:3336';
    const response = await fetch(`${apiBaseUrl}/auth/validate-temporary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        temporaryPassword,
      }),
      credentials: 'include', // <-- Corrigido: `credentials` como uma opção separada
    });

    // Verificar se a resposta é JSON antes de fazer parse
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Resposta não é JSON:', await response.text());
      setMessage('❌ Erro de comunicação com o servidor. Verifique se o backend está rodando na porta 3333.');
      setIsTemporaryValid(false);
      setUserInfo(null);
      return false;
    }

    if (response.ok) {
      const result = await response.json();
      setUserInfo(result);
      setIsTemporaryValid(true);
      setMessage('✅ Credenciais temporárias validadas!');
      return true;
    } else {
      const error = await response.json();
      setUserInfo(null);
      setIsTemporaryValid(false);
      setMessage(`❌ ${error.message || 'Credenciais inválidas ou expiradas.'}`);
      return false;
    }
  } catch (error: any) {
    console.error('Erro ao validar credenciais temporárias:', error);
    setIsTemporaryValid(false);
    setUserInfo(null);
    
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      setMessage('❌ Erro de comunicação. Verifique se o backend está rodando na porta 3333.');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      setMessage('❌ Não foi possível conectar ao servidor. Verifique se o backend está na porta 3333.');
    } else {
      setMessage(`❌ Erro de conexão: ${error.message}`);
    }
    return false;
  } finally {
    setValidating(false);
  }
};

  // ✅ Validação automática com debounce
  useEffect(() => {
    const emailValue = watch('email');
    const tempPasswordValue = watch('temporaryPassword');

    if (emailValue && !errors.email && tempPasswordValue && !errors.temporaryPassword) {
      const timer = setTimeout(() => {
        validateTemporaryCredentials(emailValue, tempPasswordValue);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTemporaryValid(false);
      setUserInfo(null);
      setMessage('');
    }
  }, [watch('email'), watch('temporaryPassword'), errors.email, errors.temporaryPassword]);

  // Atualizar no FirstLoginPage.tsx
const onSubmit = async (data: FirstLoginFormData) => {
  setLoading(true);
  setMessage('');

  try {
    // ✅ URL corrigida para apontar para o backend
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://10.10.100.176:3336';
    const response = await fetch(`${apiBaseUrl}/auth/first-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        temporaryPassword: data.temporaryPassword,
        newPassword: data.newPassword,
      }),
      credentials: 'include', // <-- Corrigido: `credentials` como uma opção separada
    });

    const result = await response.json();

    if (response.ok && result.access_token) {
      console.log('✅ [FIRST_LOGIN] Login completado:', result);
      setMessage('✅ Senha definida com sucesso! Redirecionando...');

      // Fazer login automático com os tokens recebidos
      if (login && result.user) {
        await login(result.user, result.access_token, result.refresh_token);
      }

      // Redirecionar para o dashboard
      setTimeout(() => {
        navigate('/', {
          replace: true,
          state: {
            message: 'Primeiro acesso realizado com sucesso! Bem-vindo ao sistema.',
            showSuccess: true,
          },
        });
      }, 2000);
    } else {
      setMessage(`❌ ${result.message || 'Erro ao completar primeiro login.'}`);
    }
  } catch (error: any) {
    console.error('Erro ao completar primeiro login:', error);
    setMessage(`❌ Erro de conexão: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  // ✅ Alternar visibilidade das senhas
  const togglePasswordVisibility = (field: 'temporary' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // ✅ Calcular força da senha
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password?.length >= 8) strength++;
    if (/[A-Z]/.test(password || '')) strength++;
    if (/[a-z]/.test(password || '')) strength++;
    if (/[0-9]/.test(password || '')) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password || '')) strength++;

    const levels = ['Muito Fraca', 'Fraca', 'Regular', 'Boa', 'Muito Boa'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return {
      level: levels[strength - 1] || 'Muito Fraca',
      color: colors[strength - 1] || 'bg-red-500',
      strength,
    };
  };

  const newPassword = watch('newPassword');
  const passwordStrength = getPasswordStrength(newPassword);

  // Verificar requisitos da senha
  const passwordRequirements = {
    length: newPassword?.length >= 8,
    uppercase: /[A-Z]/.test(newPassword || ''),
    lowercase: /[a-z]/.test(newPassword || ''),
    number: /\d/.test(newPassword || ''),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword || ''),
  };

  // Determinar se pode submeter o formulário
  const canSubmit = !loading && 
                   !validating && 
                   isTemporaryValid && 
                   watch('newPassword') && 
                   !errors.newPassword && 
                   watch('confirmPassword') && 
                   !errors.confirmPassword && 
                   passwordStrength.strength === 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-yellow-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 p-2 shadow-lg shadow-yellow-200/30"
          >
            <img
              src={logo}
              alt="Viação Pioneira LTDA"
              className="w-full h-full object-contain filter drop-shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="text-yellow-400 font-bold text-xl"><Key class="w-8 h-8" /></div>';
              }}
            />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Primeiro Acesso
            </span>
          </h1>
          <p className="text-gray-400 text-sm">
            Use sua senha temporária para criar uma nova senha segura
          </p>
          <p className="text-yellow-400 text-xs mt-1 font-medium">Viação Pioneira LTDA - Sistema Workshop</p>
        </div>

        {/* Card Principal */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl shadow-black/20">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              Definir Nova Senha
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Informações do Usuário Validado */}
            {userInfo && (
              <Alert className="bg-green-500/20 border-green-500/50 text-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">✅ Usuário validado</p>
                    <p><strong>Nome:</strong> {userInfo.fullName}</p>
                    <p><strong>Email:</strong> {userInfo.email}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Mensagem de Status */}
              {message && (
                <Alert
                  className={
                    message.includes('✅')
                      ? 'bg-green-500/20 border-green-500/50 text-green-200'
                      : 'bg-red-500/20 border-red-500/50 text-red-200'
                  }
                >
                  {message.includes('✅') ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="seu.email@vpioneira.com.br"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
                  disabled={!!searchParams.get('email') || loading || validating}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Senha Temporária */}
              <div className="space-y-2">
                <Label htmlFor="temporaryPassword" className="text-white flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha Temporária
                  {validating && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400 ml-2" />
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="temporaryPassword"
                    type={showPasswords.temporary ? 'text' : 'password'}
                    {...register('temporaryPassword')}
                    placeholder="Digite a senha temporária recebida"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pr-10 focus:border-yellow-400 focus:ring-yellow-400"
                    disabled={loading || validating}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('temporary')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={loading || validating}
                  >
                    {showPasswords.temporary ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.temporaryPassword && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.temporaryPassword.message}
                  </p>
                )}
              </div>

              {/* Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    {...register('newPassword')}
                    placeholder="Digite sua nova senha"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pr-10 focus:border-yellow-400 focus:ring-yellow-400"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={loading}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Indicador de Força da Senha */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 min-w-[80px]">{passwordStrength.level}</span>
                    </div>

                    {/* Requisitos da Senha */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div
                        className={`flex items-center gap-1 ${
                          passwordRequirements.length ? 'text-green-400' : 'text-gray-400'
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        8+ caracteres
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordRequirements.uppercase ? 'text-green-400' : 'text-gray-400'
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Maiúscula
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordRequirements.lowercase ? 'text-green-400' : 'text-gray-400'
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Minúscula
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordRequirements.number ? 'text-green-400' : 'text-gray-400'
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Número
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordRequirements.symbol ? 'text-green-400' : 'text-gray-400'
                        }`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Símbolo
                      </div>
                    </div>
                  </div>
                )}

                {errors.newPassword && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Confirme sua nova senha"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pr-10 focus:border-yellow-400 focus:ring-yellow-400"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={loading}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>

                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-medium"
                  disabled={!canSubmit}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                      Definindo...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Definir Senha
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Dica sobre email */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-blue-400 font-medium">Não recebeu o email?</h4>
                  <p className="text-blue-300 text-sm mt-1">
                    Verifique sua caixa de spam ou entre em contato com o administrador do sistema.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Segurança */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 text-center"
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <h3 className="text-white font-medium mb-2 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-yellow-400" />
              Regras de Segurança
            </h3>
            <div className="text-gray-400 text-sm space-y-1">
              <p>• Mínimo de 8 caracteres</p>
              <p>• Pelo menos 1 letra maiúscula (A-Z)</p>
              <p>• Pelo menos 1 letra minúscula (a-z)</p>
              <p>• Pelo menos 1 número (0-9)</p>
              <p>• Pelo menos 1 caractere especial (!@#$%^&*)</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Elementos de Background */}
      <div className="fixed top-10 left-10 w-16 h-16 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="fixed top-0 right-4 w-16 h-16 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="fixed -bottom-8 left-20 w-16 h-16 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}