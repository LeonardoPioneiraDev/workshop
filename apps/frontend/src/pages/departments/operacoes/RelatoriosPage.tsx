// src/pages/departments/operacoes/RelatoriosPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { acidentesApi } from '@/services/departments/operacoes/api/acidentesApi';
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Truck,
  AlertTriangle,
  Settings,
  Eye,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  FileBarChart
} from 'lucide-react';

interface Relatorio {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  frequencia: string;
  ultimaGeracao: string;
  status: 'Disponível' | 'Pendente' | 'Atrasado';
}

export function RelatoriosPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAcidentes, setTotalAcidentes] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const { data } = await acidentesApi.buscarAcidentes({ limit: 1, page: 1 });
      // A API retorna todos os dados, vamos pegar o total
      const response = await acidentesApi.buscarAcidentes({ limit: 10000, page: 1 });
      setTotalAcidentes(response.data.length);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUltimaAtualizacao = () => {
    const hoje = new Date();
    return hoje.toLocaleDateString('pt-BR');
  };

  const relatorios: Relatorio[] = [
    {
      id: 'executivo',
      titulo: 'Relatório Executivo de Operações',
      descricao: `Visão geral das operações com KPIs principais, incluindo ${totalAcidentes} acidentes registrados`,
      categoria: 'Gerencial',
      frequencia: 'Mensal',
      ultimaGeracao: getUltimaAtualizacao(),
      status: 'Disponível'
    },
    {
      id: 'frota',
      titulo: 'Relatório de Frota Operacional',
      descricao: 'Análise detalhada dos veículos, garagens e histórico de manutenções',
      categoria: 'Operacional',
      frequencia: 'Semanal',
      ultimaGeracao: getUltimaAtualizacao(),
      status: 'Disponível'
    },
    {
      id: 'acidentes',
      titulo: 'Relatório de Acidentes e Sinistralidade',
      descricao: `Análise completa dos ${totalAcidentes} acidentes, incluindo por turno, gravidade e veículos`,
      categoria: 'Segurança',
      frequencia: 'Mensal',
      ultimaGeracao: getUltimaAtualizacao(),
      status: 'Disponível'
    }
  ];

  const handleGenerateReport = async (relatorioId: string) => {
    setIsGenerating(relatorioId);
    
    try {
      toast.info('Gerando relatório...');
      
      // Buscar dados reais da API
      const { data: acidentes } = await acidentesApi.buscarAcidentes({ 
        limit: 10000, 
        page: 1 
      });

      // Processar dados baseado no tipo de relatório
      let conteudo = '';
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      
      switch (relatorioId) {
        case 'executivo':
          conteudo = gerarRelatorioExecutivo(acidentes, dataAtual);
          break;
        case 'frota':
          conteudo = gerarRelatorioFrota(acidentes, dataAtual);
          break;
        case 'acidentes':
          conteudo = gerarRelatorioAcidentes(acidentes, dataAtual);
          break;
        default:
          throw new Error('Tipo de relatório não implementado');
      }

      // Fazer download do relatório
      downloadRelatorio(conteudo, relatorioId);
      
      toast.success('Relatório gerado e baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(null);
    }
  };

  const gerarRelatorioExecutivo = (acidentes: any[], data: string) => {
    const total = acidentes.length;
    const comVitimas = acidentes.filter(a => 
      a.grauAcidente?.toUpperCase().includes('VÍTIMA') || 
      a.grauAcidente?.toUpperCase().includes('VITIMA')
    ).length;
    const semVitimas = total - comVitimas;
    const taxaSinistralidade = total > 0 ? ((comVitimas / total) * 100).toFixed(2) : '0.00';
    
    // Análise por turno
    const turnoMap = new Map<string, number>();
    acidentes.forEach(a => {
      if (a.turno) {
        turnoMap.set(a.turno, (turnoMap.get(a.turno) || 0) + 1);
      }
    });
    
    const turnosHtml = Array.from(turnoMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([turno, count]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${turno}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${count}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${((count / total) * 100).toFixed(1)}%</td>
        </tr>
      `).join('');
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Executivo de Operações</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
        }
        .card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .card h2 {
            margin-top: 0;
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-box {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .stat-box.danger {
            border-left-color: #ef4444;
        }
        .stat-box.success {
            border-left-color: #10b981;
        }
        .stat-box.warning {
            border-left-color: #f59e0b;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
        }
        .stat-label {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th {
            background-color: #667eea;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
            background-color: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Relatório Executivo de Operações</h1>
        <p>Gerado em: ${data}</p>
    </div>

    <div class="card">
        <h2>Resumo Geral</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-value">${total}</div>
                <div class="stat-label">Total de Acidentes</div>
            </div>
            <div class="stat-box danger">
                <div class="stat-value">${comVitimas}</div>
                <div class="stat-label">Com Vítimas</div>
            </div>
            <div class="stat-box success">
                <div class="stat-value">${semVitimas}</div>
                <div class="stat-label">Sem Vítimas</div>
            </div>
            <div class="stat-box warning">
                <div class="stat-value">${taxaSinistralidade}%</div>
                <div class="stat-label">Taxa de Sinistralidade</div>
            </div>
        </div>
    </div>

    <div class="card">
        <h2>Distribuição por Turno</h2>
        <table>
            <thead>
                <tr>
                    <th>Turno</th>
                    <th style="text-align: right;">Acidentes</th>
                    <th style="text-align: right;">Percentual</th>
                </tr>
            </thead>
            <tbody>
                ${turnosHtml}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema de Gestão de Operações</p>
        <p>© 2025 - Todos os direitos reservados</p>
    </div>
</body>
</html>
    `;
  };

  const gerarRelatorioFrota = (acidentes: any[], data: string) => {
    const veiculosMap = new Map<string, number>();
    acidentes.forEach(a => {
      const prefixo = a.prefixoVeiculo;
      if (prefixo) {
        veiculosMap.set(prefixo, (veiculosMap.get(prefixo) || 0) + 1);
      }
    });
    
    const topVeiculos = Array.from(veiculosMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    const veiculosHtml = topVeiculos.map(([prefixo, total], index) => {
      const maxAcidentes = topVeiculos[0][1];
      const percentage = ((total / maxAcidentes) * 100).toFixed(0);
      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${index + 1}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${prefixo}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${total}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">
            <div style="background: #e5e7eb; border-radius: 4px; height: 20px; position: relative;">
              <div style="background: linear-gradient(90deg, #667eea, #764ba2); width: ${percentage}%; height: 100%; border-radius: 4px;"></div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Frota Operacional</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
        }
        .card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .card h2 {
            margin-top: 0;
            color: #10b981;
            border-bottom: 2px solid #10b981;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-box {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #10b981;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
        }
        .stat-label {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th {
            background-color: #10b981;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 12px 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
            background-color: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚗 Relatório de Frota Operacional</h1>
        <p>Gerado em: ${data}</p>
    </div>

    <div class="card">
        <h2>Resumo da Frota</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-value">${veiculosMap.size}</div>
                <div class="stat-label">Veículos Registrados</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${acidentes.length}</div>
                <div class="stat-label">Total de Acidentes</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${(acidentes.length / veiculosMap.size).toFixed(1)}</div>
                <div class="stat-label">Média por Veículo</div>
            </div>
        </div>
    </div>

    <div class="card">
        <h2>Top 15 Veículos com Mais Acidentes</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 60px;">#</th>
                    <th>Prefixo</th>
                    <th style="text-align: right; width: 100px;">Acidentes</th>
                    <th style="width: 200px;">Indicador</th>
                </tr>
            </thead>
            <tbody>
                ${veiculosHtml}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema de Gestão de Operações</p>
        <p>© 2025 - Todos os direitos reservados</p>
    </div>
</body>
</html>
    `;
  };

  const gerarRelatorioAcidentes = (acidentes: any[], data: string) => {
    const total = acidentes.length;
    
    // Análise por turno
    const turnoMap = new Map<string, number>();
    acidentes.forEach(a => {
      if (a.turno) {
        turnoMap.set(a.turno, (turnoMap.get(a.turno) || 0) + 1);
      }
    });
    
    const turnosHtml = Array.from(turnoMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([turno, count]) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${turno}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${count}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${((count / total) * 100).toFixed(1)}%</td>
        </tr>
      `).join('');
    
    // Análise por gravidade
    const gravidadeMap = new Map<string, number>();
    acidentes.forEach(a => {
      if (a.grauAcidente) {
        gravidadeMap.set(a.grauAcidente, (gravidadeMap.get(a.grauAcidente) || 0) + 1);
      }
    });
    
    const gravidadeHtml = Array.from(gravidadeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([gravidade, count]) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${gravidade}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${count}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${((count / total) * 100).toFixed(1)}%</td>
        </tr>
      `).join('');
    
    // Top veículos com acidentes
    const veiculosMap = new Map<string, number>();
    acidentes.forEach(a => {
      if (a.prefixoVeiculo) {
        veiculosMap.set(a.prefixoVeiculo, (veiculosMap.get(a.prefixoVeiculo) || 0) + 1);
      }
    });
    
    const topVeiculosHtml = Array.from(veiculosMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([prefixo, count], index) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}º</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${prefixo}</td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${count}</td>
        </tr>
      `).join('');
    
    const comVitimas = acidentes.filter(a => 
      a.grauAcidente?.toUpperCase().includes('VÍTIMA') || 
      a.grauAcidente?.toUpperCase().includes('VITIMA')
    ).length;
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Acidentes e Sinistralidade</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
        }
        .card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .card h2 {
            margin-top: 0;
            color: #ef4444;
            border-bottom: 2px solid #ef4444;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-box {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #ef4444;
        }
        .stat-box.danger {
            border-left-color: #dc2626;
            background: #fee2e2;
        }
        .stat-box.warning {
            border-left-color: #f59e0b;
            background: #fef3c7;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
        }
        .stat-label {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th {
            background-color: #ef4444;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 12px 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
            background-color: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        @media (max-width: 768px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚠️ Relatório de Acidentes e Sinistralidade</h1>
        <p>Gerado em: ${data}</p>
    </div>

    <div class="card">
        <h2>Indicadores Principais</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-value">${total}</div>
                <div class="stat-label">Total de Acidentes</div>
            </div>
            <div class="stat-box danger">
                <div class="stat-value">${comVitimas}</div>
                <div class="stat-label">Com Vítimas</div>
            </div>
            <div class="stat-box warning">
                <div class="stat-value">${total - comVitimas}</div>
                <div class="stat-label">Sem Vítimas</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">${turnoMap.size}</div>
                <div class="stat-label">Turnos Registrados</div>
            </div>
        </div>
    </div>

    <div class="grid-2">
        <div class="card">
            <h2>Distribuição por Turno</h2>
            <table>
                <thead>
                    <tr>
                        <th>Turno</th>
                        <th style="text-align: right;">Acidentes</th>
                        <th style="text-align: right;">%</th>
                    </tr>
                </thead>
                <tbody>
                    ${turnosHtml}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Distribuição por Gravidade</h2>
            <table>
                <thead>
                    <tr>
                        <th>Gravidade</th>
                        <th style="text-align: right;">Acidentes</th>
                        <th style="text-align: right;">%</th>
                    </tr>
                </thead>
                <tbody>
                    ${gravidadeHtml}
                </tbody>
            </table>
        </div>
    </div>

    <div class="card">
        <h2>Top 10 Veículos com Mais Acidentes</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 80px;">Posição</th>
                    <th>Prefixo do Veículo</th>
                    <th style="text-align: right; width: 120px;">Acidentes</th>
                </tr>
            </thead>
            <tbody>
                ${topVeiculosHtml}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema de Gestão de Operações</p>
        <p>© 2025 - Todos os direitos reservados</p>
    </div>
</body>
</html>
    `;
  };

  const downloadRelatorio = (conteudo: string, tipo: string) => {
    const blob = new Blob([conteudo], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${tipo}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      'Disponível': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Pendente': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Atrasado': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = configs[status as keyof typeof configs];
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getIcon = (categoria: string) => {
    const icons = {
      'Gerencial': <BarChart3 className="h-5 w-5 text-blue-500" />,
      'Operacional': <Truck className="h-5 w-5 text-green-500" />,
      'Segurança': <AlertTriangle className="h-5 w-5 text-red-500" />,
      'Estratégico': <TrendingUp className="h-5 w-5 text-purple-500" />,
      'Financeiro': <FileText className="h-5 w-5 text-orange-500" />,
      'Auditoria': <Users className="h-5 w-5 text-indigo-500" />
    };
    return icons[categoria as keyof typeof icons] || <FileText className="h-5 w-5 text-gray-500" />;
  };

  // Filtrar relatórios
  const filteredRelatorios = relatorios.filter(relatorio => {
    const matchesSearch = !searchTerm || 
      relatorio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relatorio.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = filtroCategoria === 'TODAS' || relatorio.categoria === filtroCategoria;
    
    return matchesSearch && matchesCategoria;
  });

  // Estatísticas
  const stats = {
    total: relatorios.length,
    disponiveis: relatorios.filter(r => r.status === 'Disponível').length,
    pendentes: relatorios.filter(r => r.status === 'Pendente').length,
    atrasados: relatorios.filter(r => r.status === 'Atrasado').length
  };

  const categorias = [...new Set(relatorios.map(r => r.categoria))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/departments/operacoes')}
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                  Relatórios de Operações
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Gere e baixe relatórios executivos e análises operacionais
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="border-blue-300 hover:bg-blue-50">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
                
                <Button variant="outline" size="sm" className="border-purple-300 hover:bg-purple-50">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Total de Relatórios</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-200/50 dark:bg-blue-700/30 rounded-xl">
                  <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Disponíveis</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.disponiveis}</p>
                </div>
                <div className="p-3 bg-green-200/50 dark:bg-green-700/30 rounded-xl">
                  <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pendentes}</p>
                </div>
                <div className="p-3 bg-yellow-200/50 dark:bg-yellow-700/30 rounded-xl">
                  <Clock className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800 hover:shadow-lg transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Atrasados</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.atrasados}</p>
                </div>
                <div className="p-3 bg-red-200/50 dark:bg-red-700/30 rounded-xl">
                  <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-200 dark:border-gray-700 shadow-md">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar relatórios por título ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-56">
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas as Categorias</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setFiltroCategoria('TODAS');
                    toast.info('Filtros limpos');
                  }}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lista de Relatórios */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredRelatorios.map((relatorio, index) => (
            <motion.div
              key={relatorio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-xl transition-all hover:scale-105 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {getIcon(relatorio.categoria)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{relatorio.titulo}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">{relatorio.categoria}</p>
                      </div>
                    </div>
                    {getStatusBadge(relatorio.status)}
                  </CardTitle>
                </CardHeader>
            
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{relatorio.descricao}</p>
                  
                  <div className="space-y-2 mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Frequência:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{relatorio.frequencia}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Última geração:
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{relatorio.ultimaGeracao}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport(relatorio.id)}
                      disabled={isGenerating === relatorio.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isGenerating === relatorio.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isGenerating === relatorio.id ? 'Gerando...' : 'Baixar'}
                    </Button>
                    
                    {relatorio.status === 'Disponível' && (
                      <Button variant="outline" size="sm" className="border-gray-300">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Estado vazio */}
        {filteredRelatorios.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-12 text-center">
                <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nenhum relatório encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Tente ajustar os filtros de busca ou limpe os filtros aplicados
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setFiltroCategoria('TODAS');
                    toast.info('Filtros limpos');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
