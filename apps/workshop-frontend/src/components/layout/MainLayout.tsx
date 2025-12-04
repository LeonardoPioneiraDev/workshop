// src/components/layout/MainLayout.tsx - VERSÃO CORRIGIDA SEM ERROS
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Users, BarChart3, Database, Scale, UserPlus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/navigation/Sidebar';
import { useAuth } from '@/contexts/AuthContext';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ✅ FUNÇÃO PARA NAVEGAÇÃO RÁPIDA
  const handleQuickNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false); // Fechar sidebar no mobile
  };

  // ✅ VERIFICAR SE ESTÁ NA PÁGINA HOME (PARA NÃO MOSTRAR LAYOUT DUPLO)
  const isHomePage = location.pathname === '/home';
  
  // Se estiver na página home, não renderizar o MainLayout
  if (isHomePage) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-white hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-white font-semibold">Workshop Pioneira</h1>
          
          {/* ✅ MENU RÁPIDO JURÍDICO NO MOBILE */}
          {location.pathname.includes('/departments/legal') && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/legal/agents')}
                className="text-white hover:bg-white/10 p-1"
                title="Agentes"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/legal/analytics')}
                className="text-white hover:bg-white/10 p-1"
                title="Analytics"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ✅ MENU RÁPIDO DEPARTAMENTO PESSOAL NO MOBILE */}
          {location.pathname.includes('/departments/pessoal') && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/pessoal/funcionarios')}
                className="text-white hover:bg-white/10 p-1"
                title="Funcionários"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/pessoal/analytics')}
                className="text-white hover:bg-white/10 p-1"
                title="Analytics"
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* ✅ BARRA DE NAVEGAÇÃO RÁPIDA JURÍDICO (DESKTOP) */}
        {location.pathname.includes('/departments/legal') && (
          <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-black/10 backdrop-blur-sm border-b border-white/5">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Departamento Jurídico</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400 text-sm">Usuário: {user?.fullName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/legal')}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Database className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/legal/agents')}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Agentes
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/legal/analytics')}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        )}

        {/* ✅ BARRA DE NAVEGAÇÃO RÁPIDA DEPARTAMENTO PESSOAL (DESKTOP) */}
        {location.pathname.includes('/departments/pessoal') && (
          <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-black/10 backdrop-blur-sm border-b border-white/5">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-400" />
              <span className="text-indigo-400 font-medium">Departamento Pessoal</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400 text-sm">Usuário: {user?.fullName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/pessoal/dashboard')}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Database className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/pessoal/funcionarios')}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Funcionários
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickNavigation('/departments/pessoal/analytics')}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}