// src/components/navigation/NavigationMenu.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigationPermissions } from '@/hooks/useNavigationPermissions';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Users,
  FileText,
  Settings,
  Mail,
  Shield,
  BarChart3,
  User,
  LogOut,
  Crown,
  Briefcase,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navigationItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <Home className="w-4 h-4" />,
  },
  {
    label: 'Workshop',
    path: '/workshop',
    icon: <Monitor className="w-4 h-4" />,
    requiredRoles: ['admin', 'director', 'operator'],
    children: [
      { label: 'DEPES', path: '/workshop', icon: <Briefcase className="w-4 h-4" /> },
      { label: 'Tráfego (Visão)', path: '/workshop/trafego', icon: <Monitor className="w-4 h-4" /> },
      { label: '— IPK', path: '/workshop/trafego/ipk', icon: <Monitor className="w-4 h-4" /> },
      { label: '— Hora Extra', path: '/workshop/trafego/hora-extra', icon: <Monitor className="w-4 h-4" /> },
      { label: '— KM Ociosa', path: '/workshop/trafego/km-ociosa', icon: <Monitor className="w-4 h-4" /> },
      { label: 'Manutenção (Visão)', path: '/workshop/manutencao', icon: <Monitor className="w-4 h-4" /> },
      { label: '— Preventiva (Geral)', path: '/workshop/manutencao/preventiva', icon: <Monitor className="w-4 h-4" /> },
      { label: '— Preventiva (Setores)', path: '/workshop/manutencao/setores', icon: <Monitor className="w-4 h-4" /> },
      { label: 'DEMAN (Visão)', path: '/workshop/deman', icon: <Monitor className="w-4 h-4" /> },
      { label: '— Diesel (Geral)', path: '/workshop/deman/geral', icon: <Monitor className="w-4 h-4" /> },
      { label: '— Diesel (Setores)', path: '/workshop/deman/setores', icon: <Monitor className="w-4 h-4" /> },
      { label: 'Segurança (Visão)', path: '/workshop/seguranca', icon: <Shield className="w-4 h-4" /> },
      { label: '— Colisões por Mês', path: '/workshop/seguranca/colisoes-mes', icon: <Shield className="w-4 h-4" /> },
      { label: '— Colisões por Tipo', path: '/workshop/seguranca/colisoes-tipos', icon: <Shield className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Depto. Pessoal',
    path: '/departments/pessoal/snapshots',
    icon: <Briefcase className="w-4 h-4" />,
    requiredRoles: ['admin', 'director', 'operator'],
  },
  {
    label: 'Perfil',
    path: '/profile',
    icon: <User className="w-4 h-4" />,
  },
  {
    label: 'Relatórios',
    path: '/reports',
    icon: <BarChart3 className="w-4 h-4" />,
    requiredRoles: ['admin', 'director', 'operator'],
    requiredPermissions: ['reports.view'],
  },
  {
    label: 'Ferramentas',
    path: '/tools',
    icon: <Settings className="w-4 h-4" />,
    requiredRoles: ['admin', 'director', 'operator'],
    children: [
      {
        label: 'Teste de Email',
        path: '/tools/email-test',
        icon: <Mail className="w-4 h-4" />,
        requiredPermissions: ['tools.email'],
      },
    ],
  },
  {
    label: 'Usuários',
    path: '/users',
    icon: <Users className="w-4 h-4" />,
    requiredRoles: ['admin', 'director'],
    requiredPermissions: ['users.view'],
  },
  {
    label: 'Administração',
    path: '/admin',
    icon: <Crown className="w-4 h-4" />,
    requiredRoles: ['admin'],
    children: [
      {
        label: 'Criar Usuário',
        path: '/admin/users/create',
        icon: <Users className="w-4 h-4" />,
        requiredPermissions: ['users.create'],
      },
      {
        label: 'Configurações',
        path: '/admin/settings',
        icon: <Settings className="w-4 h-4" />,
        requiredPermissions: ['system.settings'],
      },
    ],
  },
];

export function NavigationMenu() {
  const { user, logout } = useAuth();
  const { filterNavigationItems } = useNavigationPermissions();
  const location = useLocation();

  const allowedItems = filterNavigationItems(navigationItems);

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { 
        label: 'Admin', 
        color: 'bg-red-500/20 border-red-500/30 text-red-300',
        icon: <Crown className="w-3 h-3 mr-1" />
      },
      director: { 
        label: 'Diretor', 
        color: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
        icon: <Briefcase className="w-3 h-3 mr-1" />
      },
      operator: { 
        label: 'Operador', 
        color: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
        icon: <Monitor className="w-3 h-3 mr-1" />
      },
      user: { 
        label: 'Usuário', 
        color: 'bg-green-500/20 border-green-500/30 text-green-300',
        icon: <User className="w-3 h-3 mr-1" />
      },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    
    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm border-r border-gray-700/50 w-64 min-h-screen flex flex-col">
      {/* Header do usuário */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{user?.fullName}</p>
            <div className="flex items-center gap-2 mt-1">
              {user?.role && getRoleBadge(user.role)}
            </div>
          </div>
        </div>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 p-4 space-y-2">
        {allowedItems.map((item) => (
          <div key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
            
            {/* Submenu */}
            {item.children && (
              <div className="ml-6 mt-2 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.path}
                    to={child.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                      location.pathname === child.path
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    {child.icon}
                    <span>{child.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Botão de logout */}
      <div className="p-4 border-t border-gray-700/50">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-red-500/20"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sair do Sistema
        </Button>
      </div>
    </div>
  );
}
