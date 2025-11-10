// src/pages/auth/LoginPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  User, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  Mail,
  ArrowLeft,
  Shield,
  Loader2,
  Home,
  Settings,
  Server,
  RefreshCw,
  UserCheck,
  Globe,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import logo from "@/assets/logo.png";

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estados para recuperação de senha
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: ''
  });
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  
  // Estados para verificação de conexão
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    // Se já estiver autenticado, redirecionar
    if (isAuthenticated) {
      console.log('✅ [LOGIN] Usuário já autenticado, redirecionando...');
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setIsVisible(true);
    checkBackendStatus();
    
    // Timer para atualizar data/hora
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Verificar se veio de redirecionamento com mensagem
    const state = location.state as any;
    if (state?.message) {
      console.log('📧 [LOGIN] Mensagem recebida:', state.message);
    }

    return () => clearInterval(timer);
  }, []);

  // Função para verificar status do backend
  const checkBackendStatus = async () => {
    try {
      setBackendStatus('checking');
      const response = await fetch('http://localhost:3336/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [HEALTH] Backend online:', data);
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch (error) {
      console.error('❌ [HEALTH] Erro ao verificar backend:', error);
      setBackendStatus('offline');
    }
  };

  // Função para recuperação de senha
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordData.email.trim()) {
      setError('Por favor, digite seu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordData.email)) {
      setError('Por favor, digite um email válido');
      return;
    }

    setForgotPasswordLoading(true);
    setError('');

    try {
      console.log('📧 [RECUPERAÇÃO] Enviando solicitação para:', forgotPasswordData.email);

      const response = await fetch('http://localhost:3336/auth/forgot-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordData.email
        })
      });

      console.log('📧 [RECUPERAÇÃO] Response status:', response.status);

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

      const result: ForgotPasswordResponse = await response.json();
      console.log('✅ [RECUPERAÇÃO] Response data:', result);

      if (result.success) {
        setForgotPasswordSuccess(true);
        setError('');
        
        console.log('✅ [RECUPERAÇÃO] Solicitação enviada com sucesso');
        
        // Voltar para login após 8 segundos
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotPasswordSuccess(false);
          setForgotPasswordData({ email: '' });
        }, 8000);
      } else {
        setError(`❌ ${result.message || 'Erro ao enviar solicitação'}`);
      }

    } catch (error: any) {
      console.error('❌ [RECUPERAÇÃO] Erro:', error);
      
      if (error.message.includes('404')) {
        setError('❌ Endpoint não encontrado. Verifique se o backend está rodando.');
      } else if (error.message.includes('500')) {
        setError('❌ Erro interno do servidor. Verifique os logs do backend.');
      } else if (error.message.includes('fetch')) {
        setError('❌ Erro de conexão. Verifique se o backend está rodando em http://localhost:3336');
      } else {
        setError(`❌ Erro de conexão: ${error.message}`);
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Função para login usando AuthContext
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoginSuccess(false);
  
    console.log('🚀 [LOGIN] Iniciando processo de login via AuthContext...');

    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    if (username.trim().length < 3) {
      setError('O usuário deve ter pelo menos 3 caracteres');
      setIsLoading(false);
      return;
    }

    if (password.trim().length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(username.trim(), password);
      
      if (result.success) {
        console.log('✅ [LOGIN] Login bem-sucedido via AuthContext!');
        setLoginSuccess(true);
        setError('');
        
        setTimeout(() => {
          console.log('🔄 [LOGIN] Redirecionando para /home');
          navigate('/home', { replace: true });
        }, 1500);
        
      } else {
        const errorMessage = result.error || 'Credenciais inválidas';
        
        if (errorMessage.toLowerCase().includes('usuário') || 
            errorMessage.toLowerCase().includes('senha') ||
            errorMessage.toLowerCase().includes('incorret') ||
            errorMessage.toLowerCase().includes('inválid') ||
            errorMessage.toLowerCase().includes('unauthorized')) {
          setError('❌ Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.');
        } else {
          setError(`❌ ${errorMessage}`);
        }
        
        setPassword('');
      }
    } catch (error: any) {
      console.error('❌ [LOGIN] Erro no login:', error);
      setError(`🚨 ${error.message || 'Erro de conexão'}`);
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleForgotPasswordDataChange = (field: string, value: string) => {
    setForgotPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  // Renderizar alerta de status do backend
  const renderBackendStatus = () => {
    if (backendStatus === 'checking') {
      return (
        <Alert className="mb-4 bg-blue-500/20 border-blue-500/50 text-blue-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Verificando conexão com o servidor...
          </AlertDescription>
        </Alert>
      );
    }

    if (backendStatus === 'offline') {
      return (
        <Alert className="mb-4 bg-red-500/20 border-red-500/50 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium">Servidor offline</p>
                <p className="text-sm">Verifique se o backend está rodando na porta 3336</p>
              </div>
              <Button 
                onClick={checkBackendStatus} 
                variant="outline" 
                size="sm"
                className="border-red-400 text-red-300 hover:bg-red-500/20 w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="mb-4 bg-green-500/20 border-green-500/50 text-green-200">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span className="text-sm">✅ Servidor online e funcionando</span>
            <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300 text-xs">
              <Server className="w-3 h-3 mr-1" />
              Conectado
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800">
      
      {/* Elementos de background animados */}
      <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
      <div className="absolute top-0 right-2 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-amber-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-4 left-8 sm:-bottom-8 sm:left-20 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>

      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* Header simplificado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full border-b border-white/10 bg-black/20 backdrop-blur-sm"
      >
        <div className="w-full max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Logo e empresa */}
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Viação Pioneira" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg items-center justify-center hidden">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-gray-900" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Viação Pioneira Ltda</h1>
                <p className="text-xs sm:text-sm text-gray-300">Sistema de Autenticação</p>
              </div>
            </div>
            
            {/* Data e hora */}
            <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                {currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Conteúdo principal */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md mx-auto">
          
          {/* Status do Backend */}
          {renderBackendStatus()}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-4 sm:mb-6"
          >
            {/* Logo/Ícone principal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center mb-3 sm:mb-4"
            >
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-400/60 opacity-70 blur-xl sm:blur-2xl"></div>
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 bg-gradient-to-br from-gray-900 via-yellow-600 to-amber-700 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden border-2 border-yellow-400/30">
                  {/* Logo principal */}
                  <img 
                    src={logo} 
                    alt="Viação Pioneira" 
                    className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 object-contain filter drop-shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'block';
                    }}
                  />
                  {/* Fallback icon */}
                  <Shield className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-yellow-300 hidden" />
                </div>
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-2 sm:mb-3"
            >
              <Badge
                variant="secondary"
                className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-yellow-400 backdrop-blur hover:from-yellow-500/30 hover:to-amber-500/30"
              >
                <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Workshop Platform
              </Badge>
            </motion.div>

            {/* Título */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mb-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight"
            >
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                {showForgotPassword ? 'Recuperar Senha' : 'Acesso ao Sistema'}
              </span>
            </motion.h1>
          </motion.div>

          {/* Card de Login/Recuperação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="space-y-1 pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-center text-white flex items-center justify-center gap-2">
                  {showForgotPassword ? (
                    <>
                      <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-400" />
                      <span className="hidden sm:inline">Recuperar Senha</span>
                      <span className="sm:hidden">Recuperar</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-400" />
                      Login
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                
                {/* Alerta de sucesso */}
                {loginSuccess && (
                  <Alert className="bg-green-500/20 border-green-500/50 text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-sm">✅ Login realizado com sucesso!</span>
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Redirecionando...</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Alerta de sucesso recuperação */}
                {forgotPasswordSuccess && (
                  <Alert className="bg-green-500/20 border-green-500/50 text-green-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium text-sm">✅ Solicitação enviada com sucesso!</p>
                        <p className="text-xs">
                          Você receberá um email com sua nova senha temporária em breve.
                        </p>
                        <p className="text-xs text-green-300">
                          📧 Email: {forgotPasswordData.email}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Alerta de erro */}
                {error && !loginSuccess && !forgotPasswordSuccess && (
                  <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs sm:text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Formulário de Login */}
                {!showForgotPassword ? (
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {/* Campo Usuário */}
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-200">
                        Usuário
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Digite seu usuário"
                          value={username}
                          onChange={handleUsernameChange}
                          className={`pl-8 sm:pl-10 text-sm sm:text-base py-2 sm:py-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400 ${
                            error && !username.trim() ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                          }`}
                          disabled={isLoading || loginSuccess || backendStatus === 'offline'}
                          autoComplete="username"
                          autoFocus={backendStatus === 'online'}
                        />
                      </div>
                    </div>

                    {/* Campo Senha */}
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-200">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={handlePasswordChange}
                          className={`pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base py-2 sm:py-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400 ${
                            error && !password.trim() ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                          }`}
                          disabled={isLoading || loginSuccess || backendStatus === 'offline'}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 sm:top-3 text-gray-400 hover:text-gray-200 transition-colors"
                          disabled={isLoading || loginSuccess || backendStatus === 'offline'}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Link Esqueceu Senha */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs sm:text-sm text-yellow-400 hover:text-yellow-300 transition-colors underline"
                        disabled={isLoading || loginSuccess || backendStatus === 'offline'}
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>

                    {/* Botão de Login */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-gray-900 font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={isLoading || loginSuccess || backendStatus === 'offline'}
                    >
                      {backendStatus === 'offline' ? (
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Servidor offline</span>
                        </div>
                      ) : isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="text-xs sm:text-sm">Verificando...</span>
                        </div>
                      ) : loginSuccess ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Sucesso! Entrando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Entrar no Sistema</span>
                        </div>
                      )}
                    </Button>
                  </form>
                ) : (
                  /* Formulário de Recuperação de Senha */
                  <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
                    
                    {/* Campo Email */}
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-200">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="Digite seu email"
                          value={forgotPasswordData.email}
                          onChange={(e) => handleForgotPasswordDataChange('email', e.target.value)}
                          className="pl-8 sm:pl-10 text-sm sm:text-base py-2 sm:py-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400"
                          disabled={forgotPasswordLoading || forgotPasswordSuccess || backendStatus === 'offline'}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Botões */}
                    <div className="space-y-2 sm:space-y-3">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={forgotPasswordLoading || forgotPasswordSuccess || backendStatus === 'offline'}
                      >
                        {forgotPasswordLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            <span className="text-xs sm:text-sm">Enviando...</span>
                          </div>
                        ) : forgotPasswordSuccess ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs sm:text-sm">Enviado!</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs sm:text-sm">Solicitar Nova Senha</span>
                          </div>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordData({ email: '' });
                          setError('');
                          setForgotPasswordSuccess(false);
                        }}
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white text-sm sm:text-base py-2.5 sm:py-3"
                        disabled={forgotPasswordLoading}
                      >
                        <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Voltar ao Login
                      </Button>
                    </div>
                  </form>
                )}

                {/* Informações de contato do suporte */}
                {showForgotPassword && (
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs sm:text-sm text-blue-200">
                        <p className="font-medium mb-1">Contato direto:</p>
                        <p className="break-all">📧 <span className="font-mono text-xs">suporte@workshop.com</span></p>
                        <p className="mt-1 text-blue-300 text-xs">
                          Em caso de urgência, entre em contato diretamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Botões de navegação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6"
          >
            {/* Botão API Docs */}
            <Button
              variant="ghost"
              onClick={() => window.open('http://localhost:3336/api', '_blank')}
              className="flex-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-300 group border border-blue-500/30 text-xs sm:text-sm py-2 sm:py-3"
              disabled={isLoading || loginSuccess}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Globe className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline">API Docs</span>
                <span className="sm:hidden">API</span>
              </div>
            </Button>

            {/* Botão Voltar à Homepage */}
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex-1 text-gray-400 hover:text-gray-300 hover:bg-gray-500/10 transition-all duration-300 group border border-gray-500/30 text-xs sm:text-sm py-2 sm:py-3"
              disabled={isLoading || loginSuccess}
            >
              <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform group-hover:-translate-x-1" />
              Início
            </Button>
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
        
        @media (max-width: 640px) {
          .bg-grid-pattern { background-size: 12px 12px; }
        }
        
        @media (max-width: 480px) {
          .bg-grid-pattern { background-size: 10px 10px; }
        }
      `}</style>
    </div>
  );
}