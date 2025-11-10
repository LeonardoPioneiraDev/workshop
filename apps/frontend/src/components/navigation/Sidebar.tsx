// src/components/navigation/Sidebar.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  FileText,
  Settings,
  Truck,
  DollarSign,
  Scale,
  UserCheck,
  CreditCard,
  Wrench,
  Route,
  Fuel,
  Mail,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import logo from "@/assets/logo.png";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  requiredRole?: string;
  badge?: string;
  children?: MenuItem[];
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const hasPermission = (requiredRole?: string) => {
    if (!requiredRole) return true;
    const roleHierarchy = { user: 1, operator: 2, director: 3, admin: 4 };
    const userLevel = roleHierarchy[user?.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    return userLevel >= requiredLevel;
  };

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      path: '/home'
    },
    {
      title: 'Departamentos',
      icon: <Building2 className="h-5 w-5" />,
      path: '/departments',
      children: [
        {
          title: 'Operações',
          icon: <Truck className="h-4 w-4" />,
          path: '/departments/operations'
        },
        {
          title: 'Financeiro',
          icon: <DollarSign className="h-4 w-4" />,
          path: '/departments/financial'
        },
        {
          title: 'Jurídico',
          icon: <Scale className="h-4 w-4" />,
          path: '/departments/legal'
        },
        {
          title: 'Recursos Humanos',
          icon: <Users className="h-4 w-4" />,
          path: '/departments/hr'
        },
        {
          title: 'Depto. Pessoal',
          icon: <UserCheck className="h-4 w-4" />,
          path: '/departments/personal'
        },
        {
          title: 'Manutenção',
          icon: <Wrench className="h-4 w-4" />,
          path: '/departments/manutencao'
        },
        {
          title: 'Logística',
          icon: <Route className="h-4 w-4" />,
          path: '/departments/logistics'
        },
        {
          title: 'Combustível',
          icon: <Fuel className="h-4 w-4" />,
          path: '/departments/fuel'
        }
      ]
    },
    {
      title: 'Relatórios',
      icon: <FileText className="h-5 w-5" />,
      path: '/reports',
      requiredRole: 'operator',
      badge: 'Novo'
    },
    {
      title: 'Usuários',
      icon: <Users className="h-5 w-5" />,
      path: '/admin/users',
      requiredRole: 'admin'
    },
    {
      title: 'Ferramentas',
      icon: <Settings className="h-5 w-5" />,
      path: '/tools',
      requiredRole: 'operator',
      children: [
        {
          title: 'Teste de Email',
          icon: <Mail className="h-4 w-4" />,
          path: '/tools/email-test'
        }
      ]
    },
    {
      title: 'Configurações',
      icon: <Settings className="h-5 w-5" />,
      path: '/admin/settings',
      requiredRole: 'admin'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => hasPermission(item.requiredRole));

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -280,
          width: isOpen ? 280 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur-sm border-r border-white/10 z-50 lg:relative lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Viação Pioneira" 
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'flex';
                }}
              />
              <div className="h-8 w-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg items-center justify-center hidden">
                <Building2 className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Viação Pioneira</h2>
                <p className="text-gray-400 text-xs">Workshop</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-gray-400 hover:text-white hover:bg-white/10 lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {user.fullName || user.username}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {user.role === 'admin' ? 'Administrador' : 
                     user.role === 'director' ? 'Diretor' : 
                     user.role === 'operator' ? 'Operador' : 'Usuário'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <div key={item.title}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left h-auto p-3 ${
                    isActive(item.path)
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => {
                    if (item.children) {
                      toggleExpanded(item.title);
                    } else {
                      navigate(item.path);
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {item.children && (
                        <ChevronRight 
                          className={`h-4 w-4 transition-transform ${
                            expandedItems.includes(item.title) ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </div>
                  </div>
                </Button>

                {/* Submenu */}
                <AnimatePresence>
                  {item.children && expandedItems.includes(item.title) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-2 space-y-1">
                        {item.children.map((child) => (
                          <Button
                            key={child.title}
                            variant="ghost"
                            className={`w-full justify-start text-left h-auto p-2 text-sm ${
                              isActive(child.path)
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                            onClick={() => {
                              navigate(child.path);
                              if (window.innerWidth < 1024) {
                                onToggle();
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {child.icon}
                              <span>{child.title}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair do Sistema
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}