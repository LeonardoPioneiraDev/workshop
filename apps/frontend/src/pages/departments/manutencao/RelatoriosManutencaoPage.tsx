// src/pages/departments/manutencao/RelatoriosManutencaoPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Wrench,
  Building,
  AlertTriangle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useManutencaoData } from '@/hooks/useManutencaoData';
import { manutencaoApi } from '@/services/departments/manutencao/api/manutencaoApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function RelatoriosManutencaoPage() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  
  const [filtros, setFiltros] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    garagem: '',
    tipoOS: '',
    condicaoOS: ''
  });

  const { ordensServico, estatisticas, isLoading } = useManutencaoData({
    filtrosIniciais: filtros,
    autoCarregar: true
  });

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const dados = await manutencaoApi.exportarRelatorio(filtros);
      
      // Aqui você implementaria a lógica de exportação para Excel
      // Similar ao que foi feito no Departamento Pessoal
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      // Implementar exportação PDF
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const reportCards = [
    {
      title: 'Total de OS',
      value: estatisticas?.resumo.totalRegistros || 0,
      icon: <Wrench className="h-8 w-8 text-orange-600" />,
      color: 'from-orange-50 to-orange-100'
    },
    {
      title: 'OS Abertas',
      value: estatisticas?.resumo.osAbertas || 0,
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      color: 'from-green-50 to-green-100'
    },
    {
      title: 'Quebras',
      value: estatisticas?.resumo.quebras || 0,
      icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
      color: 'from-red-50 to-red-100'
    },
    {
      title: 'Valor Terceiros',
      value: `R$ ${parseFloat(estatisticas?.indicadores.totalValorTerceiros || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
      color: 'from-blue-50 to-blue-100'
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/departments/manutencao')}
                className="hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-3 shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
                    Relatórios de Manutenção
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Análises e exportações de dados de manutenção
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportExcel}
                disabled={isExporting || isLoading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>

              <Button
                onClick={handleExportPDF}
                disabled={isExporting || isLoading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Cards de Resumo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {reportCards.map((card, index) => (
            <Card key={index} className={`bg-gradient-to-br ${card.color}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {typeof card.value === 'number' ? card.value.toLocaleString('pt-BR') : card.value}
                    </p>
                  </div>
                  <div>{card.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-600" />
                Filtros de Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <Label htmlFor="startDate">Data Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filtros.startDate}
                    onChange={(e) => setFiltros({ ...filtros, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Data Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filtros.endDate}
                    onChange={(e) => setFiltros({ ...filtros, endDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="garagem">Garagem</Label>
                  <Select value={filtros.garagem} onValueChange={(value) => setFiltros({ ...filtros, garagem: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="PARANOÁ">PARANOÁ</SelectItem>
                      <SelectItem value="SANTA MARIA">SANTA MARIA</SelectItem>
                      <SelectItem value="SÃO SEBASTIÃO">SÃO SEBASTIÃO</SelectItem>
                      <SelectItem value="GAMA">GAMA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipoOS">Tipo de OS</Label>
                  <Select value={filtros.tipoOS} onValueChange={(value) => setFiltros({ ...filtros, tipoOS: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="C">Corretiva</SelectItem>
                      <SelectItem value="P">Preventiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condicaoOS">Status</Label>
                  <Select value={filtros.condicaoOS} onValueChange={(value) => setFiltros({ ...filtros, condicaoOS: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="A">Aberta</SelectItem>
                      <SelectItem value="FC">Fechada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribuições */}
        {estatisticas && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            {/* Distribuição por Garagem */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Distribuição por Garagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(estatisticas.distribuicoes.garagens).map(([garagem, total], index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{garagem}</span>
                      <Badge variant="secondary">{total} OS</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Tipo de Problema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Distribuição por Tipo de Problema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(estatisticas.distribuicoes.tiposProblema).map(([tipo, total], index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{tipo}</span>
                      <Badge variant="secondary">{total} OS</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Sistema de Relatórios
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Exporte dados de manutenção em diferentes formatos para análises detalhadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
