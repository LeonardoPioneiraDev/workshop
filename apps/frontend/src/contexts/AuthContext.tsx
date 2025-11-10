// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LegalAgents } from '../components/departments/legal/LegalAgents';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'director' | 'operator' | 'user';
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  checkAccess: (requiredRoles?: string[], requiredPermissions?: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  // Verificar token ao carregar a aplicação
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('✅ [AUTH] Usuário restaurado do localStorage:', parsedUser);
      } catch (error) {
        console.error('❌ [AUTH] Erro ao restaurar usuário:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Função de login CORRIGIDA
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 [AUTH] Iniciando login para:', username);
      
      const response = await fetch('http://localhost:3336/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      console.log('🔐 [AUTH] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ [AUTH] Erro na resposta:', errorData);
        return { 
          success: false, 
          error: errorData.message || 'Erro de autenticação' 
        };
      }

      const data = await response.json();
      console.log('✅ [AUTH] Dados recebidos:', data);
      
      // ⚠️ CORREÇÃO: Verificar se tem access_token (não success)
      if (data.access_token && data.user) {
        // Salvar token e dados do usuário
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Salvar refresh token se disponível
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        
        setUser(data.user);
        console.log('✅ [AUTH] Login realizado com sucesso:', data.user);
        console.log('🔑 [AUTH] Token salvo:', data.access_token.substring(0, 20) + '...');
        
        return { success: true };
      } else {
        console.log('❌ [AUTH] Login falhou - dados incompletos:', data);
        return { 
          success: false, 
          error: data.message || 'Dados de login incompletos' 
        };
      }
    } catch (error: any) {
      console.error('❌ [AUTH] Erro no login:', error);
      return { 
        success: false, 
        error: 'Erro de conexão com o servidor' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('👋 [AUTH] Logout realizado');
    navigate('/login', { replace: true });
  };

  // Verificar se usuário tem determinado(s) role(s)
  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Verificar se usuário tem determinada permissão
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Se não há array de permissões, assumir que admin tem todas
    if (!user.permissions) {
      return user.role === 'admin';
    }
    return user.permissions.includes(permission);
  };

  // Verificar se usuário tem pelo menos uma das permissões
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    // Se não há array de permissões, assumir que admin tem todas
    if (!user.permissions) {
      return user.role === 'admin';
    }
    return permissions.some(permission => user.permissions.includes(permission));
  };

  // Verificar acesso completo (roles E permissões)
  const checkAccess = (requiredRoles?: string[], requiredPermissions?: string[]): boolean => {
    if (!user) return false;

    // Se não há requisitos, usuário autenticado tem acesso
    if (!requiredRoles && !requiredPermissions) return true;

    // Verificar roles (se especificado)
    const hasRequiredRole = requiredRoles ? hasRole(requiredRoles) : true;

    // Verificar permissões (se especificado)
    const hasRequiredPermission = requiredPermissions ? 
      hasAnyPermission(requiredPermissions) : true;

    return hasRequiredRole && hasRequiredPermission;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
    hasAnyPermission,
    checkAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}