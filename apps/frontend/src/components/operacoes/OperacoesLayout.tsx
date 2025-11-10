// src/components/operacoes/OperacoesLayout.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Truck,
  BarChart3,
  FileText,
  History,
  AlertTriangle,
  TrendingUp,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function OperacoesLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/departments/operacoes',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Visão geral de operações'
    },
    {
      title: 'Gestão de Frota',
      path: '/departments/operacoes/frota',
      icon: <Truck className="w-5 h-5" />,
      description: 'Gerenciar veículos'
    },
    {
      title: 'Histórico de Veículos',
      path: '/departments/operacoes/historico',
      icon: <History className="w-5 h-5" />,
      description: 'Consultar histórico'
    },
    {
      title: 'Gestão de Acidentes',
      path: '/departments/operacoes/acidentes',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Gerenciar acidentes'
    },
    {
      title: 'Analytics',
      path: '/departments/operacoes/analytics',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Gráficos e análises'
    },
    {
      title: 'Relatórios',
      path: '/departments/operacoes/relatorios',
      icon: <FileText className="w-5 h-5" />,
      description: 'Gerar relatórios'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Operações</h1>
                  <p className="text-sm text-gray-600">Gestão de Frota e Operações</p>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => navigate('/home')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Menu Operações</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={`
                    w-full justify-start h-auto p-3
                    ${isActive(item.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    {item.icon}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="hidden lg:flex items-center gap-2 overflow-x-auto pb-2">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant={isActive(item.path) ? "default" : "outline"}
              className={`
                flex items-center gap-2 whitespace-nowrap
                ${isActive(item.path) ? 'bg-blue-500 hover:bg-blue-600' : ''}
              `}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span className="font-medium">{item.title}</span>
            </Button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
}
