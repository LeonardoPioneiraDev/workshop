import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/auth/Login';
import Instructions from '@/pages/auth/Instructions';
import { HomePage } from '@/pages/HomePage';
import SufisaPage from '@/pages/departments/juridico/MultasSufisaPage';
import MultasSufisaPage2 from '@/pages/departments/juridico/MultasSufisaPage2';
import MultasSufisaPage3 from '@/pages/departments/juridico/MultasSufisaPage3';
import DeptPessoalSnapshotsPage from '@/pages/departments/pessoal/DeptPessoalSnapshotsPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import DepesSlides from '@/pages/workshop/DepesSlides';
import WorkshopAllSlides from '@/pages/workshop/WorkshopAllSlides';
import TrafegoSlides from '@/pages/workshop/TrafegoSlides';
import ManutencaoSlides from '@/pages/workshop/ManutencaoSlides';
import DemanSlides from '@/pages/workshop/DemanSlides';
import SegurancaSlides from '@/pages/workshop/SegurancaSlides';
import IpKSlide from '@/pages/workshop/trafego/IpKSlide';
import HoraExtraSlide from '@/pages/workshop/trafego/HoraExtraSlide';
import KMOciosaSlide from '@/pages/workshop/trafego/KMOciosaSlide';
import PreventivaGeralSlide from '@/pages/workshop/manutencao/PreventivaGeralSlide';
import PreventivaSetoresSlide from '@/pages/workshop/manutencao/PreventivaSetoresSlide';
import DieselGeralSlide from '@/pages/workshop/deman/DieselGeralSlide';
import DieselSetoresSlide from '@/pages/workshop/deman/DieselSetoresSlide';
import ColisoesMesSlide from '@/pages/workshop/seguranca/ColisoesMesSlide';
import ColisoesTiposSlide from '@/pages/workshop/seguranca/ColisoesTiposSlide';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import UsersPage from '@/pages/admin/UsersPage';

 

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-3xl font-bold">{title} - Em Construção</h1>
  </div>
);

// A simple loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-3xl font-bold">Carregando...</h1>
  </div>
);

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/instrucoes" element={<Instructions />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ResetPassword />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        
         
       
        
        <Route
          path="/workshop"
          element={
            <ProtectedRoute>
              <WorkshopAllSlides />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workshop/trafego"
          element={
            <ProtectedRoute>
              <TrafegoSlides />
            </ProtectedRoute>
          }
        />
        <Route path="/workshop/trafego/ipk" element={<ProtectedRoute><IpKSlide /></ProtectedRoute>} />
        <Route path="/workshop/trafego/hora-extra" element={<ProtectedRoute><HoraExtraSlide /></ProtectedRoute>} />
        <Route path="/workshop/trafego/km-ociosa" element={<ProtectedRoute><KMOciosaSlide /></ProtectedRoute>} />
        <Route
          path="/workshop/manutencao"
          element={
            <ProtectedRoute>
              <ManutencaoSlides />
            </ProtectedRoute>
          }
        />
        <Route path="/workshop/manutencao/preventiva" element={<ProtectedRoute><PreventivaGeralSlide /></ProtectedRoute>} />
        <Route path="/workshop/manutencao/setores" element={<ProtectedRoute><PreventivaSetoresSlide /></ProtectedRoute>} />
        <Route
          path="/workshop/deman"
          element={
            <ProtectedRoute>
              <DemanSlides />
            </ProtectedRoute>
          }
        />
        <Route path="/workshop/deman/geral" element={<ProtectedRoute><DieselGeralSlide /></ProtectedRoute>} />
        <Route path="/workshop/deman/setores" element={<ProtectedRoute><DieselSetoresSlide /></ProtectedRoute>} />
        <Route
          path="/workshop/seguranca"
          element={
            <ProtectedRoute>
              <SegurancaSlides />
            </ProtectedRoute>
          }
        />
        <Route path="/workshop/seguranca/colisoes-mes" element={<ProtectedRoute><ColisoesMesSlide /></ProtectedRoute>} />
        <Route path="/workshop/seguranca/colisoes-tipos" element={<ProtectedRoute><ColisoesTiposSlide /></ProtectedRoute>} />
        <Route
          path="/departments/juridico/sufisa"
          element={
            <ProtectedRoute>
              <SufisaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments/juridico/sufisa/page2"
          element={
            <ProtectedRoute>
              <MultasSufisaPage2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments/juridico/sufisa/page3"
          element={
            <ProtectedRoute>
              <MultasSufisaPage3 />
            </ProtectedRoute>
          }
        />

        <Route
          path="/departments/pessoal/snapshots"
          element={
            <ProtectedRoute>
              <DeptPessoalSnapshotsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}
