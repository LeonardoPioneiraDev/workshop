// src/pages/auth/ResetPasswordPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Shield,
  Loader2,
  Key,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import logo from "@/assets/logo.png";

interface ResetPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface TokenValidationResponse {
  valid: boolean;
  message: string;
  userId?: string;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Estados principais
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estados de validação e controle
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  // Estados de validação de senha
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false
  });

  useEffect(() => {
    // Timer para atualizar data/hora
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Validar token ao carregar a página
    if (token) {
      validateToken();
    } else {
      setIsValidatingToken(false);
      setValidationError('Token não fornecido na URL');
    }

    return () => clearInterval(timer);
  }, [token]);

  // Validar senha em tempo real
  useEffect(() => {
    if (newPassword) {
      setPasswordValidation({
        minLength: newPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /\d/.test(newPassword),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(newPassword),
        passwordsMatch: newPassword === confirmPassword && confirmPassword.length > 0
      });
    }
  }, [newPassword, confirmPassword]);

  // Validar token com o backend
  const validateToken = async () => {
    if (!token) {
      setIsValidatingToken(false);
      setValidationError('Token não fornecido');
      return;
    }

    try {
      setIsValidatingToken(true);
      console.log('🔍 [RESET] Validando token:', token.substring(0, 10) + '...');

      const response = await fetch(`http://10.10.100.176:3333/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: TokenValidationResponse = await response.json();
      console.log('✅ [RESET] Resposta da validação:', result);

      if (result.valid) {
        setIsTokenValid(true);
        setValidationError('');
        console.log('✅ [RESET] Token válido');
      } else {
        setIsTokenValid(false);
        setValidationError(result.message || 'Token inválido');
        console.log('❌ [RESET] Token inválido:', result.message);
      }

    } catch (error: any) {
      console.error('❌ [RESET] Erro na validação:', error);
      setIsTokenValid(false);
      
      if (error.message.includes('404')) {
        setValidationError('Serviço de validação não encontrado. Verifique se o backend está rodando.');
      } else if (error.message.includes('500')) {
        setValidationError('Erro interno do servidor. Tente novamente mais tarde.');
      } else if (error.message.includes('fetch')) {
        setValidationError('Erro de conexão. Verifique sua internet e se o backend está rodando.');
      } else {
        setValidationError(`Erro de validação: ${error.message}`);
      }
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Submeter nova senha
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações locais
    if (!newPassword.trim()) {
      setError('Por favor, digite uma nova senha');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Por favor, confirme a nova senha');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    // Verificar se senha atende aos critérios
    const allValid = Object.values(passwordValidation).every(valid => valid);
    if (!allValid) {
      setError('A senha não atende a todos os critérios de segurança');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔐 [RESET] Enviando nova senha...');

      const response = await fetch('http://10.10.100.176:3333/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword
        })
      });

      console.log('🔐 [RESET] Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Se não conseguir fazer parse do JSON, usar mensagem padrão
        }
        
        throw new Error(errorMessage);
      }

      const result: ResetPasswordResponse = await response.json();
      console.log('✅ [RESET] Response data:', result);

      if (result.success) {
        setIsSuccess(true);
        setError('');
        
        console.log('✅ [RESET] Senha alterada com sucesso');
        
        // Redirecionar para login após 5 segundos
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Senha alterada com sucesso! Faça login com sua nova senha.' 
            } 
          });
        }, 5000);
      } else {
        setError(`❌ ${result.message || 'Erro ao alterar senha'}`);
      }

    } catch (error: any) {
      console.error('❌ [RESET] Erro:', error);
      
      if (error.message.includes('404')) {
        setError('❌ Endpoint não encontrado. Verifique se o backend está rodando.');
      } else if (error.message.includes('500')) {
        setError('❌ Erro interno do servidor. Tente novamente mais tarde.');
      } else if (error.message.includes('fetch')) {
        setError('❌ Erro de conexão. Verifique sua internet e se o backend está rodando.');
      } else {
        setError(`❌ ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar indicador de critério de senha
  const renderPasswordCriterion = (isValid: boolean, text: string) => (
    <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
      {isValid ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <div className="w-4 h-4 border border-gray-300 rounded-full" />
      )}
      <span>{text}</span>
    </div>
  );

  // Renderizar página de validação de token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="relative z-10 w-full flex-1 flex items-center justify-center p-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-blue-400/60 opacity-70 blur-xl"></div>
                  <div className="relative h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Validando Token</h2>
              <p className="text-gray-300 text-sm">
                Verificando a validade do seu token de recuperação...
              </p>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-blue-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Aguarde um momento</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Renderizar erro de token inválido
  if (!isTokenValid) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 via-red-900 to-slate-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full border-b border-white/10 bg-black/20 backdrop-blur-sm"
        >
          <div className="w-full max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={logo} 
                  alt="Viação Pioneira" 
                  className="h-10 w-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="h-10 w-10 bg-gradient-to-br from-red-400 to-red-600 rounded-lg items-center justify-center hidden">
                  <Shield className="h-6 w-6 text-gray-900" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Viação Pioneira Ltda</h1>
                  <p className="text-sm text-gray-300">Recuperação de Senha</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                <Clock className="w-4 h-4" />
                <span>{currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 w-full flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-md w-full"
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-red-400/60 opacity-70 blur-xl"></div>
                    <div className="relative h-16 w-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-white">Token Inválido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {validationError || 'O token de recuperação é inválido ou expirou.'}
                  </AlertDescription>
                </Alert>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-blue-200 mb-2">💡 O que fazer agora?</h4>
                  <ul className="text-sm text-blue-300 space-y-1">
                    <li>• Solicite uma nova recuperação de senha</li>
                    <li>• Verifique se o link não expirou (válido por 1 hora)</li>
                    <li>• Use o link mais recente recebido por email</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Login
                  </Button>

                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white py-3"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 via-green-900 to-slate-800">
      
      {/* Elementos de background animados */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
      <div className="absolute top-0 right-4 w-20 h-20 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-20 h-20 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full border-b border-white/10 bg-black/20 backdrop-blur-sm"
      >
        <div className="w-full max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Viação Pioneira" 
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg items-center justify-center hidden">
                <Shield className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Viação Pioneira Ltda</h1>
                <p className="text-sm text-gray-300">Definir Nova Senha</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
              <Clock className="w-4 h-4" />
              <span>{currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Conteúdo principal */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-6"
          >
            {/* Logo/Ícone principal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-green-400/60 opacity-70 blur-xl"></div>
                <div className="relative h-20 w-20 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-green-400/30">
                  <Key className="h-10 w-10 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-3"
            >
              <Badge
                variant="secondary"
                className="border-green-500/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-1 text-sm font-medium text-green-400 backdrop-blur"
              >
                <Shield className="mr-2 h-4 w-4" />
                Recuperação Segura
              </Badge>
            </motion.div>

            {/* Título */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mb-2 text-2xl font-bold leading-tight"
            >
              <span className="bg-gradient-to-r from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                Definir Nova Senha
              </span>
            </motion.h1>
          </motion.div>

          {/* Card principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-bold text-center text-white flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5 text-green-400" />
                  Nova Senha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Alerta de sucesso */}
                {isSuccess && (
                  <Alert className="bg-green-500/20 border-green-500/50 text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">✅ Senha alterada com sucesso!</p>
                        <p className="text-sm">
                          Você será redirecionado para o login em instantes...
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Alerta de erro */}
                {error && !isSuccess && (
                  <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Formulário */}
                {!isSuccess && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Campo Nova Senha */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">
                        Nova Senha *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Digite sua nova senha"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 pr-10 py-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400 focus:ring-green-400"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition-colors"
                          disabled={isSubmitting}
                          tabIndex={-1}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Campo Confirmar Senha */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-200">
                        Confirmar Nova Senha *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 py-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400 focus:ring-green-400"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition-colors"
                          disabled={isSubmitting}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Critérios de senha */}
                    {newPassword && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-200 mb-2">Critérios da senha:</h4>
                        <div className="grid grid-cols-1 gap-1">
                          {renderPasswordCriterion(passwordValidation.minLength, 'Mínimo 8 caracteres')}
                          {renderPasswordCriterion(passwordValidation.hasUppercase, 'Pelo menos 1 letra maiúscula')}
                          {renderPasswordCriterion(passwordValidation.hasLowercase, 'Pelo menos 1 letra minúscula')}
                          {renderPasswordCriterion(passwordValidation.hasNumber, 'Pelo menos 1 número')}
                          {renderPasswordCriterion(passwordValidation.hasSpecialChar, 'Pelo menos 1 símbolo especial')}
                          {confirmPassword && renderPasswordCriterion(passwordValidation.passwordsMatch, 'Senhas coincidem')}
                        </div>
                      </div>
                    )}

                    {/* Botão de submit */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={isSubmitting || !Object.values(passwordValidation).every(valid => valid)}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Alterando Senha...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Key className="h-4 w-4" />
                          <span>Alterar Senha</span>
                        </div>
                      )}
                    </Button>
                  </form>
                )}

                {/* Botão voltar */}
                {!isSubmitting && !isSuccess && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white py-3"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Login
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Estilos CSS */}
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
        .bg-grid-pattern {
          background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 15px 15px;
        }
      `}</style>
    </div>
  );
}