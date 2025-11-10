import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';

// Páginas de autenticação
import { FirstLoginPage } from '@/pages/auth/FirstLoginPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// ✅ PÁGINAS DE PESSOAL - IMPORTAÇÕES COMPLETAS E CORRIGIDAS
import DashboardPessoalPage from '@/pages/departments/pessoal/DashboardPessoalPage';
import FuncionariosAtivosPage from '@/pages/departments/pessoal/FuncionariosAtivosPage';
import FuncionariosAfastadosPage from '@/pages/departments/pessoal/FuncionariosAfastadosPage';
import FuncionariosDemitidosPage from '@/pages/departments/pessoal/FuncionariosDemitidosPage';
import FuncionariosCompletosPage from '@/pages/departments/pessoal/FuncionariosCompletosPage';
import GraficosPessoalPage from '@/pages/departments/pessoal/GraficosPessoalPage';

// ✅ PÁGINAS DE OPERAÇÕES
import { DashboardOperacoesPage } from '@/pages/departments/operacoes/DashboardOperacoesPage';
import { OperacoesConfigPage } from '@/pages/departments/operacoes/OperacoesConfigPage';
import { FrotaPage } from '@/pages/departments/operacoes/FrotaPage';
import { AcidentesPage } from '@/pages/departments/operacoes/AcidentesPage';
import { HistoricoPage } from '@/pages/departments/operacoes/HistoricoPage';
import { AnalyticsPage } from '@/pages/departments/operacoes/AnalyticsPage';
import { RelatoriosPage } from '@/pages/departments/operacoes/RelatoriosPage';

// Páginas públicas
import { HomePage } from '@/pages/HomePage';

// Páginas protegidas
import { DashboardHomePage } from '@/pages/DashboardHomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';

// Páginas administrativas
import { UsersListPage } from '@/pages/admin/users/UsersListPage'; 
import { CreateUserPage } from '@/pages/admin/CreateUserPage';
import { EditUserPage } from '@/pages/admin/EditUserPage';
import { SystemSettingsPage } from '@/pages/admin/SystemSettingsPage';
import { UserLogsPage } from '@/pages/admin/UserLogsPage'; 
import { UserLastAccessPage } from '@/pages/admin/UserLastAccessPage'; 

// ✅ Páginas do departamento jurídico
import DashboardJuridicoPage from '@/pages/departments/juridico/DashboardJuridicoPage';
import MultasTransitoPage from '@/pages/departments/juridico/MultasTransitoPage';
import MultasSemobPage from '@/pages/departments/juridico/MultasSemobPage';
import MultasSufisaPage from '@/pages/departments/juridico/MultasSufisaPage';
import MultasSufisaPage2 from '@/pages/departments/juridico/MultasSufisaPage2';
import MultasSufisaPage3 from '@/pages/departments/juridico/MultasSufisaPage3';
import GraficosPage from '@/pages/departments/juridico/GraficosPage';
import RelatoriosJuridicoPage from '@/pages/departments/juridico/RelatoriosPage';

// ✅ Páginas do departamento de manutenção
import { DashboardManutencaoPage, OrdemServicoPage, RelatoriosManutencaoPage } from '@/pages/departments/manutencao';

// Páginas de erro
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { UnauthorizedPage } from '@/pages/errors/UnauthorizedPage';

export function AppRoutes() {
  console.log('✅ [ROUTES] AppRoutes carregado - Versão COMPLETA com PESSOAL, JURÍDICO e OPERAÇÕES');
  
  return (
    <Routes>
      {/* ========== ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) ========== */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* ========== ROTAS DE AUTENTICAÇÃO ESPECIAIS (PÚBLICAS) ========== */}
      <Route path="/first-login" element={<FirstLoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ========== ROTAS PROTEGIDAS COM LAYOUT ========== */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* ========== PÁGINAS PRINCIPAIS ========== */}
        <Route path="/home" element={<DashboardHomePage />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/profile" element={<ProfilePage />} />

        {/* ========== DEPARTAMENTO DE OPERAÇÕES ========== */}
        <Route 
          path="/departments/operacoes" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'operacoes', 'gerente']}>
              <DashboardOperacoesPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/operacoes/frota" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'operacoes', 'gerente']}>
              <FrotaPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/operacoes/historico" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'operacoes', 'gerente']}>
              <HistoricoPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/operacoes/acidentes" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'operacoes', 'gerente']}>
              <AcidentesPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/operacoes/analytics" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'operacoes', 'gerente']}>
              <AnalyticsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/operacoes/relatorios" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'operacoes', 'gerente']}>
              <RelatoriosPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/operacoes/configuracoes" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'operacoes', 'gerente']}>
              <OperacoesConfigPage />
            </ProtectedRoute>
          } 
        />

        {/* ========== DEPARTAMENTO PESSOAL - ROTAS COMPLETAS E CORRIGIDAS ========== */}
        <Route 
          path="/pessoal/dashboard" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'pessoal', 'rh']}>
              <DashboardPessoalPage />
            </ProtectedRoute>
          } 
        />
        
        {/* ✅ FUNCIONÁRIOS ATIVOS */}
        <Route 
          path="/pessoal/funcionarios-ativos" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'pessoal', 'rh']}>
              <FuncionariosAtivosPage />
            </ProtectedRoute>
          } 
        />
        
        {/* ✅ FUNCIONÁRIOS AFASTADOS */}
        <Route 
          path="/pessoal/funcionarios-afastados" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'pessoal', 'rh']}>
              <FuncionariosAfastadosPage />
            </ProtectedRoute>
          } 
        />

        {/* ✅ FUNCIONÁRIOS DEMITIDOS */}
        <Route 
          path="/pessoal/funcionarios-demitidos" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'pessoal', 'rh']}>
              <FuncionariosDemitidosPage />
            </ProtectedRoute>
          } 
        />

        {/* ✅ FUNCIONÁRIOS COMPLETOS (TODOS) */}
        <Route 
          path="/pessoal/funcionarios-completos" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'pessoal', 'rh']}>
              <FuncionariosCompletosPage />
            </ProtectedRoute>
          } 
        />

        {/* ✅ GRÁFICOS E ANALYTICS */}
        <Route 
          path="/pessoal/graficos" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'pessoal', 'rh']}>
              <GraficosPessoalPage />
            </ProtectedRoute>
          } 
        />

        {/* ✅ ROTA GENÉRICA PARA FUNCIONÁRIOS INATIVOS (AFASTADOS + DEMITIDOS) */}
        <Route 
          path="/pessoal/funcionarios-inativos" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'pessoal', 'rh']}>
              <FuncionariosAfastadosPage />
            </ProtectedRoute>
          } 
        />

        {/* ========== DEPARTAMENTO DE MANUTENÇÃO ========== */}
        <Route 
          path="/departments/manutencao" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'manutencao', 'gerente']}>
              <DashboardManutencaoPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/manutencao/ordens-servico" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'manutencao', 'gerente']}>
              <OrdemServicoPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/manutencao/relatorios" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'manutencao', 'gerente']}>
              <RelatoriosManutencaoPage />
            </ProtectedRoute>
          } 
        />

        {/* ========== DEPARTAMENTO JURÍDICO ========== */}
        <Route 
          path="/departments/juridico" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'juridico']}>
              <DashboardJuridicoPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/juridico/transito" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'juridico']}>
              <MultasTransitoPage />
            </ProtectedRoute>
          } 
        />
              
        <Route 
          path="/departments/juridico/semob" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'juridico']}>
              <MultasSemobPage />
            </ProtectedRoute>
          } 
        />
        
        {/* ✅ ROTAS SUFISA - PÁGINA 1, 2 E 3 */}
        <Route 
          path="/departments/juridico/sufisa" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'juridico']}>
              <MultasSufisaPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/juridico/sufisa/page2" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'juridico']}>
              <MultasSufisaPage2 />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/departments/juridico/sufisa/page3" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'juridico']}>
              <MultasSufisaPage3 />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/juridico/graficos" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'juridico']}>
              <GraficosPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/departments/juridico/relatorios" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor', 'juridico']}>
              <RelatoriosJuridicoPage />
            </ProtectedRoute>
          } 
        />

        {/* ========== REDIRECTS INTELIGENTES PARA DEPARTAMENTO DE OPERAÇÕES ========== */}
        <Route path="/operacoes" element={<Navigate to="/departments/operacoes" replace />} />
        <Route path="/operacoes/dashboard" element={<Navigate to="/departments/operacoes" replace />} />
        <Route path="/frota" element={<Navigate to="/departments/operacoes/frota" replace />} />
        <Route path="/acidentes" element={<Navigate to="/departments/operacoes/acidentes" replace />} />
        <Route path="/colisoes" element={<Navigate to="/departments/operacoes/acidentes" replace />} />
        <Route path="/veiculos" element={<Navigate to="/departments/operacoes/frota" replace />} />
        <Route path="/onibus" element={<Navigate to="/departments/operacoes/frota" replace />} />
        <Route path="/garagem" element={<Navigate to="/departments/operacoes/frota" replace />} />
        <Route path="/sinistros" element={<Navigate to="/departments/operacoes/acidentes" replace />} />
        <Route path="/dashboard-operacoes" element={<Navigate to="/departments/operacoes" replace />} />
        <Route path="/relatorios-operacoes" element={<Navigate to="/departments/operacoes/relatorios" replace />} />
        <Route path="/gestao-frota" element={<Navigate to="/departments/operacoes/frota" replace />} />
        <Route path="/controle-acidentes" element={<Navigate to="/departments/operacoes/acidentes" replace />} />
        <Route path="/analytics-operacoes" element={<Navigate to="/departments/operacoes" replace />} />

        {/* ========== REDIRECTS INTELIGENTES PARA DEPARTAMENTO JURÍDICO ========== */}
        <Route path="/departments/legal" element={<Navigate to="/departments/juridico" replace />} />
        <Route path="/legal" element={<Navigate to="/departments/juridico" replace />} />
        <Route path="/juridico" element={<Navigate to="/departments/juridico" replace />} />
        <Route path="/multas" element={<Navigate to="/departments/juridico" replace />} />
        <Route path="/transito" element={<Navigate to="/departments/juridico/transito" replace />} />
        <Route path="/semob" element={<Navigate to="/departments/juridico/semob" replace />} />
        <Route path="/sufisa" element={<Navigate to="/departments/juridico/sufisa" replace />} />
        <Route path="/multas-transito" element={<Navigate to="/departments/juridico/transito" replace />} />
        <Route path="/multas-semob" element={<Navigate to="/departments/juridico/semob" replace />} />
        <Route path="/multas-sufisa" element={<Navigate to="/departments/juridico/sufisa" replace />} />
        <Route path="/agentes" element={<Navigate to="/departments/juridico/semob" replace />} />
        <Route path="/agentes-semob" element={<Navigate to="/departments/juridico/semob" replace />} />
        <Route path="/agentes-sufisa" element={<Navigate to="/departments/juridico/sufisa" replace />} />
        <Route path="/dashboard-legal" element={<Navigate to="/departments/juridico" replace />} />
        <Route path="/graficos-multas" element={<Navigate to="/departments/juridico/graficos" replace />} />

        {/* ========== REDIRECTS INTELIGENTES PARA DEPARTAMENTO PESSOAL ========== */}
        <Route path="/departments" element={<Navigate to="/home" replace />} />
        <Route path="/departments/pessoal" element={<Navigate to="/pessoal/dashboard" replace />} />
        <Route path="/pessoal" element={<Navigate to="/pessoal/dashboard" replace />} />
        <Route path="/funcionarios" element={<Navigate to="/pessoal/funcionarios-completos" replace />} />
        <Route path="/funcionarios-completos" element={<Navigate to="/pessoal/funcionarios-completos" replace />} />
        <Route path="/rh" element={<Navigate to="/pessoal/dashboard" replace />} />
        <Route path="/departamento-pessoal" element={<Navigate to="/pessoal/dashboard" replace />} />
        <Route path="/dashboard-pessoal" element={<Navigate to="/pessoal/dashboard" replace />} />
        
        {/* ✅ REDIRECTS ESPECÍFICOS PARA CADA TIPO DE FUNCIONÁRIO */}
        <Route path="/funcionarios-ativos" element={<Navigate to="/pessoal/funcionarios-ativos" replace />} />
        <Route path="/funcionarios-afastados" element={<Navigate to="/pessoal/funcionarios-afastados" replace />} />
        <Route path="/funcionarios-demitidos" element={<Navigate to="/pessoal/funcionarios-demitidos" replace />} />
        <Route path="/funcionarios-inativos" element={<Navigate to="/pessoal/funcionarios-afastados" replace />} />
        
        {/* ✅ REDIRECTS ALTERNATIVOS */}
        <Route path="/pessoal/ativos" element={<Navigate to="/pessoal/funcionarios-ativos" replace />} />
        <Route path="/pessoal/afastados" element={<Navigate to="/pessoal/funcionarios-afastados" replace />} />
        <Route path="/pessoal/demitidos" element={<Navigate to="/pessoal/funcionarios-demitidos" replace />} />
        <Route path="/pessoal/inativos" element={<Navigate to="/pessoal/funcionarios-afastados" replace />} />
        <Route path="/pessoal/todos" element={<Navigate to="/pessoal/funcionarios-completos" replace />} />
        
        {/* ✅ REDIRECTS PARA ANALYTICS E RELATÓRIOS */}
        <Route path="/analytics-pessoal" element={<Navigate to="/pessoal/graficos" replace />} />
        <Route path="/relatorios-pessoal" element={<Navigate to="/pessoal/graficos" replace />} />
        <Route path="/graficos-pessoal" element={<Navigate to="/pessoal/graficos" replace />} />
        
        {/* ========== REDIRECTS INTELIGENTES PARA DEPARTAMENTO DE MANUTENÇÃO ========== */}
        <Route path="/manutencao" element={<Navigate to="/departments/manutencao" replace />} />
        <Route path="/manutencao/dashboard" element={<Navigate to="/departments/manutencao" replace />} />
        <Route path="/os" element={<Navigate to="/departments/manutencao/ordens-servico" replace />} />
        <Route path="/ordens-servico" element={<Navigate to="/departments/manutencao/ordens-servico" replace />} />
        <Route path="/manutencao/os" element={<Navigate to="/departments/manutencao/ordens-servico" replace />} />
        <Route path="/preventivas" element={<Navigate to="/departments/manutencao/preventivas" replace />} />
        <Route path="/corretivas" element={<Navigate to="/departments/manutencao/corretivas" replace />} />
        <Route path="/oficina" element={<Navigate to="/departments/manutencao" replace />} />
        <Route path="/dashboard-manutencao" element={<Navigate to="/departments/manutencao" replace />} />
        <Route path="/relatorios-manutencao" element={<Navigate to="/departments/manutencao/relatorios" replace />} />

        {/* ✅ REDIRECTS LEGADOS PARA COMPATIBILIDADE */}
        <Route 
          path="/departamentos/pessoal/funcionarios-completos" 
          element={<Navigate to="/pessoal/funcionarios-completos" replace />} 
        />
        <Route 
          path="/departments/pessoal/funcionarios-completos" 
          element={<Navigate to="/pessoal/funcionarios-completos" replace />} 
        />
        <Route 
          path="/departments/pessoal/funcionarios-ativos" 
          element={<Navigate to="/pessoal/funcionarios-ativos" replace />} 
        />
        <Route 
          path="/departments/pessoal/funcionarios-afastados" 
          element={<Navigate to="/pessoal/funcionarios-afastados" replace />} 
        />
        <Route 
          path="/departments/pessoal/funcionarios-demitidos" 
          element={<Navigate to="/pessoal/funcionarios-demitidos" replace />} 
        />

        {/* ========== ROTAS PARA ADMINISTRADORES / GERENCIAMENTO DE USUÁRIOS ========== */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor']}>
              <UsersListPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/users/create" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <CreateUserPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/users/:id/edit" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'diretor']}>
              <EditUserPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/users/logs" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <UserLogsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/users/last-access" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <UserLastAccessPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <SystemSettingsPage />
            </ProtectedRoute>
          } 
        />

        {/* ========== ROTAS TEMPORÁRIAS PARA FUNCIONALIDADES EM DESENVOLVIMENTO ========== */}
        <Route path="/reports" element={<Navigate to="/home" replace />} />
        <Route path="/tools/*" element={<Navigate to="/home" replace />} />
      </Route>
 
      {/* ========== ROTAS DE ERRO ========== */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      
      {/* Rota catch-all para 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}