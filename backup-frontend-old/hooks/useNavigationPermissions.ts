// src/hooks/useNavigationPermissions.ts
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  children?: NavigationItem[];
}

export function useNavigationPermissions() {
  const { checkAccess, hasRole, hasPermission } = useAuth();
  const navigate = useNavigate();

  // Filtrar itens de navegação baseado em permissões
  const filterNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter(item => {
      const hasAccess = checkAccess(item.requiredRoles, item.requiredPermissions);
      
      if (hasAccess && item.children) {
        // Se tem acesso ao item pai, filtrar filhos recursivamente
        item.children = filterNavigationItems(item.children);
      }
      
      return hasAccess;
    });
  };

  // Navegar com verificação de permissão
  const navigateWithPermission = (
    path: string, 
    requiredRoles?: string[], 
    requiredPermissions?: string[]
  ) => {
    const hasAccess = checkAccess(requiredRoles, requiredPermissions);
    
    if (hasAccess) {
      navigate(path);
    } else {
      navigate('/unauthorized');
    }
  };

  // Verificar se pode acessar uma rota
  const canAccessRoute = (requiredRoles?: string[], requiredPermissions?: string[]): boolean => {
    return checkAccess(requiredRoles, requiredPermissions);
  };

  return {
    filterNavigationItems,
    navigateWithPermission,
    canAccessRoute,
    hasRole,
    hasPermission,
    checkAccess
  };
}