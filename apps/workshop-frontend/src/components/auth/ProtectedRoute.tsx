// src/components/auth/ProtectedRoute.tsx
import React, { useMemo, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  position?: string;
}

// Mapeamento de roles do backend para hierarquia
const ROLE_HIERARCHY = {
  'usuario': 1,
  'operador': 2,
  'supervisor': 3,
  'coordenador': 4,
  'gerente': 5,
  'diretor': 6,
  'admin': 7
};

// Mapeamento de roles para exibição
const ROLE_DISPLAY = {
  'admin': 'Administrador',
  'diretor': 'Diretor',
  'gerente': 'Gerente',
  'coordenador': 'Coordenador',
  'supervisor': 'Supervisor',
  'operador': 'Operador',
  'usuario': 'Usuário'
};

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallbackPath = '/login',
  showAccessDenied = true
}: ProtectedRouteProps) {
  const location = useLocation();

  // ✅ MEMOIZAR verificação de autenticação para evitar loops
  const authData = useMemo(() => {
    try {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        return { isAuthenticated: false, user: null };
      }

      const user: User = JSON.parse(userStr);
      return { isAuthenticated: true, user };
    } catch (error) {
      console.error('❌ [PROTECTED_ROUTE] Erro ao verificar autenticação:', error);
      // Limpar dados corrompidos
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return { isAuthenticated: false, user: null };
    }
  }, []); // ✅ Dependências vazias - só executa uma vez por mount

  // ✅ MEMOIZAR verificação de acesso
  const hasAccess = useMemo(() => {
    if (!authData.isAuthenticated || !authData.user) {
      return false;
    }

    const { user } = authData;

    // Se não há requisitos, libera acesso
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }

    // Verificar roles
    if (requiredRoles.length > 0) {
      const userRoleLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0;
      
      // Verificar se o usuário tem pelo menos um dos roles necessários
      const hasRequiredRole = requiredRoles.some(role => {
        const requiredLevel = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0;
        return userRoleLevel >= requiredLevel;
      });
      
      if (!hasRequiredRole) {
        return false;
      }
    }

    // Por enquanto, apenas verificação de roles
    // Implementar verificação de permissões quando necessário
    if (requiredPermissions.length > 0) {
      // Implementar quando necessário
    }

    return true;
  }, [authData.isAuthenticated, authData.user, requiredRoles, requiredPermissions]); // ✅ Dependências específicas

  // ✅ MEMOIZAR função de logout
  const logout = useCallback(() => {
    console.log('🚺 [PROTECTED_ROUTE] Fazendo logout...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  // ✅ Log apenas quando necessário (uma vez por verificação)
  React.useEffect(() => {
    if (authData.isAuthenticated && authData.user) {
      console.log('🔐 [PROTECTED_ROUTE] Verificação:', {
        path: location.pathname,
        user: authData.user.username,
        role: authData.user.role,
        hasAccess,
        requiredRoles
      });
    }
  }, [location.pathname, authData.isAuthenticated, authData.user, hasAccess, requiredRoles]);

  // Redirecionar para login se não autenticado
  if (!authData.isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Verificar se tem acesso (só se estiver autenticado)
  if (!hasAccess && showAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800">
        {/* Elementos de background */}
        <div className="absolute top-4 left-4 w-12 h-12 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute top-0 right-4 w-12 h-12 bg-amber-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-4 left-8 w-12 h-12 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md w-full relative z-10">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
              <p className="text-gray-300">
                Você não tem permissão para acessar esta página.
              </p>
            </div>

            <Alert className="bg-red-500/20 border-red-500/50 text-red-200">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1 text-sm">
                  <p><strong>Seu perfil:</strong> {ROLE_DISPLAY[authData.user?.role as keyof typeof ROLE_DISPLAY] || authData.user?.role || 'Não identificado'}</p>
                  {requiredRoles.length > 0 && (
                    <p><strong>Perfis necessários:</strong> {requiredRoles.map(role => ROLE_DISPLAY[role as keyof typeof ROLE_DISPLAY] || role).join(', ')}</p>
                  )}
                  {requiredPermissions.length > 0 && (
                    <p><strong>Permissões necessárias:</strong> {requiredPermissions.join(', ')}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => window.history.back()} 
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                Voltar
              </Button>
              <Button 
                onClick={logout}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              >
                Sair do Sistema
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estilos para animações */}
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

  // Se não tem acesso e não deve mostrar página de negação, redirecionar
  if (!hasAccess) {
    return <Navigate to="/home" replace />;
  }

  // Renderizar children se tem acesso
  return <>{children}</>;
}