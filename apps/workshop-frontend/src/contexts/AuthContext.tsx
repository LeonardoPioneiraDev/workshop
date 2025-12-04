// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/services/api';

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

  // Função de login
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await api.login({ username, password });

      if (data?.access_token && data?.user) {
        // api.login já persiste os tokens e o usuário no localStorage
        setUser(data.user);
        console.log('✅ [AUTH] Login realizado com sucesso:', data.user);
        return { success: true };
      }

      console.warn('⚠️ [AUTH] Resposta de login sem dados esperados:', data);
      return { success: false, error: 'Dados de login incompletos' };
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Erro ao fazer login';
      console.error('❌ [AUTH] Erro no login:', message);
      return { success: false, error: message };
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
    console.log('🔓 [AUTH] Logout realizado');
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
    if (!(user as any).permissions) {
      return user.role === 'admin';
    }
    return user.permissions.includes(permission);
  };

  // Verificar se usuário tem pelo menos uma das permissões
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    // Se não há array de permissões, assumir que admin tem todas
    if (!(user as any).permissions) {
      return user.role === 'admin';
    }
    return permissions.some((p) => user.permissions.includes(p));
  };

  // Verificação de acesso (roles e/ou permissões)
  const checkAccess = (requiredRoles?: string[], requiredPermissions?: string[]): boolean => {
    if (!user) return false;
    if (!requiredRoles && !requiredPermissions) return true;
    const hasRequiredRole = requiredRoles ? hasRole(requiredRoles) : true;
    const hasRequiredPermission = requiredPermissions ? hasAnyPermission(requiredPermissions) : true;
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
    checkAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

