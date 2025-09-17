import { Routes, Route } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { DashboardPage } from '../pages/DashboardPage'
import { ManOs } from '../pages/ManOsPage/ManOs'; // Usa chaves para exportacoes nomeadas


export default function AppRoutes() {
  
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/manos" element={<ManOs />} />     
    </Routes>
  )
}
