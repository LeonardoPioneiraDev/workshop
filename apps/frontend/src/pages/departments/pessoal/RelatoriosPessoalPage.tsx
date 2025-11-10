// src/pages/departments/pessoal/RelatoriosPessoalPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { 
  ArrowLeft,
  FileText,
  Download,
  Printer,
  Mail,
  Calendar,
  Filter,
  Users,
  BarChart3,
  FileSpreadsheet,
  
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { usePessoalData } from '../../../services/departments/pessoal/hooks/usePessoalData';
import type { FiltrosPessoal } from '../../../types/departments/pessoal';
import { formatDate, formatNumber } from '../../../lib/formatters';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

interface RelatorioConfig {
  tipo: 'funcionarios' | 'dashboard' | 'comparativo' | 'agrupamentos';
  formato: 'pdf' | 'excel' | 'csv';
  filtros: FiltrosPessoal;
  campos: string[];
  agrupamento?: 'departamento' | 'area' | 'cidade' | 'situacao';
  incluirGraficos: boolean;
  incluirEstatisticas: boolean;
}

const RelatoriosPessoalPage: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<RelatorioConfig>({
    tipo: 'funcionarios',
    formato: 'pdf',
    filtros: {
      page: 1,
      limit: 1000 // Para relatórios, buscar mais registros
    },
    campos: ['nome', 'cracha', 'funcao', 'departamento', 'situacao'],
    incluirGraficos: true,
    incluirEstatisticas: true
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [relatoriosGerados, setRelatoriosGerados] = useState<Array<{
    id: string;
    nome: string;
    tipo: string;
    formato: string;
    dataGeracao: string;
    tamanho: string;
    status: 'processando' | 'concluido' | 'erro';
  }>>([]);

  const { useFuncionariosCompletos, useDashboard, useDashboardComparativo, useAgrupamentos } = usePessoalData();

  // Campos disponíveis para seleção
  const camposDisponiveis = [
    { id: 'nome', label: 'Nome' },
    { id: 'cracha', label: 'Crachá' },
    { id: 'cpf', label: 'CPF' },
    { id: 'funcao', label: 'Função' },
    { id: 'departamento', label: 'Departamento' },
    { id: 'area', label: 'Área' },
    { id: 'cidade', label: 'Cidade' },
    { id: 'dataAdmissao', label: 'Data de Admissão' },
    { id: 'situacao', label: 'Situação' },
    { id: 'salarioTotal', label: 'Salário Total' },
    { id: 'idade', label: 'Idade' },
    { id: 'tempoEmpresaAnos', label: 'Tempo de Empresa' },
    { id: 'temQuitacao', label: 'Tem Quitação' },
    { id: 'valeRefeicao', label: 'Vale Refeição' }
  ];

  const updateConfig = (key: keyof RelatorioConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateFiltros = (filtros: FiltrosPessoal) => {
    setConfig(prev => ({ ...prev, filtros }));
  };

  const toggleCampo = (campo: string) => {
    setConfig(prev => ({
      ...prev,
      campos: prev.campos.includes(campo)
        ? prev.campos.filter(c => c !== campo)
        : [...prev.campos, campo]
    }));
  };

  const gerarRelatorio = async () => {
    setIsGenerating(true);
    
    try {
      // Simular geração de relatório
      const novoRelatorio = {
        id: Date.now().toString(),
        nome: `Relatório ${config.tipo} - ${formatDate(new Date().toISOString())}`,
        tipo: config.tipo,
        formato: config.formato,
        dataGeracao: new Date().toISOString(),
        tamanho: '2.5 MB',
        status: 'processando' as const
      };
      
      setRelatoriosGerados(prev => [novoRelatorio, ...prev]);
      
      // Simular processamento
      setTimeout(() => {
        setRelatoriosGerados(prev => 
          prev.map(r => 
            r.id === novoRelatorio.id 
              ? { ...r, status: 'concluido' as const }
              : r
          )
        );
        toast.success('Relatório gerado com sucesso!');
      }, 3000);
      
      toast.info('Gerando relatório... Aguarde.');
      
    } catch (error) {
      toast.error('Erro ao gerar relatório');
      setRelatoriosGerados(prev => 
        prev.map(r => 
          r.id === prev[0]?.id 
            ? { ...r, status: 'erro' as const }
            : r
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadRelatorio = (relatorio: any) => {
    // Implementar download real
    toast.success(`Download iniciado: ${relatorio.nome}`);
  };

  const enviarPorEmail = (relatorio: any) => {
    // Implementar envio por email
    toast.success(`Relatório enviado por email: ${relatorio.nome}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/departments/pessoal/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-8 w-8 text-purple-600" />
              Relatórios
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gere relatórios personalizados do departamento pessoal
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuração do Relatório */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="filters">Filtros</TabsTrigger>
                  <TabsTrigger value="fields">Campos</TabsTrigger>
                </TabsList>

                {/* Tab: Configurações Básicas */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Relatório</Label>
                      <Select value={config.tipo} onValueChange={(value) => updateConfig('tipo', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="funcionarios">Lista de Funcionários</SelectItem>
                          <SelectItem value="dashboard">Dashboard Resumido</SelectItem>
                          <SelectItem value="comparativo">Análise Comparativa</SelectItem>
                          <SelectItem value="agrupamentos">Agrupamentos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="formato">Formato</Label>
                      <Select value={config.formato} onValueChange={(value) => updateConfig('formato', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">
                            <div className="flex items-center gap-2">
                              
                              PDF
                            </div>
                          </SelectItem>
                          <SelectItem value="excel">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              Excel
                            </div>
                          </SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {config.tipo === 'agrupamentos' && (
                    <div className="space-y-2">
                      <Label htmlFor="agrupamento">Agrupar Por</Label>
                      <Select 
                        value={config.agrupamento} 
                        onValueChange={(value) => updateConfig('agrupamento', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o agrupamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="departamento">Departamento</SelectItem>
                          <SelectItem value="area">Área</SelectItem>
                          <SelectItem value="cidade">Cidade</SelectItem>
                          <SelectItem value="situacao">Situação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incluirGraficos"
                        checked={config.incluirGraficos}
                        onCheckedChange={(checked) => updateConfig('incluirGraficos', checked)}
                      />
                      <Label htmlFor="incluirGraficos">Incluir Gráficos</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incluirEstatisticas"
                        checked={config.incluirEstatisticas}
                        onCheckedChange={(checked) => updateConfig('incluirEstatisticas', checked)}
                      />
                      <Label htmlFor="incluirEstatisticas">Incluir Estatísticas</Label>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Filtros */}
                <TabsContent value="filters" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="situacao">Situação</Label>
                      <Select 
                        value={config.filtros.situacao || ''} 
                        onValueChange={(value) => updateFiltros({
                          ...config.filtros, 
                          situacao: value || undefined
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as situações" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas</SelectItem>
                          <SelectItem value="A">Ativo</SelectItem>
                          <SelectItem value="F">Afastado</SelectItem>
                          <SelectItem value="D">Demitido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="departamento">Departamento</Label>
                      <Input
                        placeholder="Ex: OPERACAO"
                        value={config.filtros.departamento || ''}
                        onChange={(e) => updateFiltros({
                          ...config.filtros,
                          departamento: e.target.value || undefined
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataAdmissaoInicio">Data Admissão (Início)</Label>
                      <Input
                        type="date"
                        value={config.filtros.dataAdmissaoInicio || ''}
                        onChange={(e) => updateFiltros({
                          ...config.filtros,
                          dataAdmissaoInicio: e.target.value || undefined
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataAdmissaoFim">Data Admissão (Fim)</Label>
                      <Input
                        type="date"
                        value={config.filtros.dataAdmissaoFim || ''}
                        onChange={(e) => updateFiltros({
                          ...config.filtros,
                          dataAdmissaoFim: e.target.value || undefined
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="apenasAtivos"
                      checked={config.filtros.ativo || false}
                      onCheckedChange={(checked) => updateFiltros({
                        ...config.filtros,
                        ativo: checked || undefined
                      })}
                    />
                    <Label htmlFor="apenasAtivos">Apenas Funcionários Ativos</Label>
                  </div>
                </TabsContent>

                {/* Tab: Campos */}
                <TabsContent value="fields" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Campos a Incluir no Relatório</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {camposDisponiveis.map((campo) => (
                        <div key={campo.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={campo.id}
                            checked={config.campos.includes(campo.id)}
                            onCheckedChange={() => toggleCampo(campo.id)}
                          />
                          <Label htmlFor={campo.id} className="text-sm">
                            {campo.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Selecione pelo menos um campo para gerar o relatório.
                      Campos selecionados: {config.campos.length}
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>

              {/* Botão Gerar */}
              <div className="pt-4 border-t">
                <Button
                  onClick={gerarRelatorio}
                  disabled={isGenerating || config.campos.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando Relatório...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relatórios Gerados */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Relatórios Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatoriosGerados.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum relatório gerado ainda</p>
                    <p className="text-sm">Configure e gere seu primeiro relatório</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relatoriosGerados.map((relatorio) => (
                      <div
                        key={relatorio.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            relatorio.status === 'concluido' ? 'bg-green-100 dark:bg-green-900' :
                            relatorio.status === 'processando' ? 'bg-yellow-100 dark:bg-yellow-900' :
                            'bg-red-100 dark:bg-red-900'
                          )}>
                            {relatorio.status === 'concluido' ? (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : relatorio.status === 'processando' ? (
                              <RefreshCw className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm">{relatorio.nome}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{relatorio.formato.toUpperCase()}</span>
                              <span>•</span>
                              <span>{relatorio.tamanho}</span>
                              <span>•</span>
                              <span>{formatDate(relatorio.dataGeracao, 'dd/MM HH:mm')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {relatorio.status === 'concluido' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadRelatorio(relatorio)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => enviarPorEmail(relatorio)}
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </Button>
                            </>
                          )}
                          
                          {relatorio.status === 'processando' && (
                            <Badge variant="secondary">
                              Processando...
                            </Badge>
                          )}
                          
                          {relatorio.status === 'erro' && (
                            <Badge variant="destructive">
                              Erro
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
  
            {/* Templates de Relatórios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Templates Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => {
                      setConfig({
                        tipo: 'funcionarios',
                        formato: 'excel',
                        filtros: { situacao: 'A', ativo: true, limit: 1000 },
                        campos: ['nome', 'cracha', 'funcao', 'departamento', 'dataAdmissao', 'salarioTotal'],
                        incluirGraficos: false,
                        incluirEstatisticas: true
                      });
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">Funcionários Ativos</div>
                      <div className="text-sm text-muted-foreground">
                        Lista completa de funcionários ativos com dados básicos
                      </div>
                    </div>
                  </Button>
  
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => {
                      setConfig({
                        tipo: 'dashboard',
                        formato: 'pdf',
                        filtros: { limit: 1000 },
                        campos: [],
                        incluirGraficos: true,
                        incluirEstatisticas: true
                      });
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">Dashboard Executivo</div>
                      <div className="text-sm text-muted-foreground">
                        Relatório executivo com gráficos e estatísticas
                      </div>
                    </div>
                  </Button>
  
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => {
                      setConfig({
                        tipo: 'agrupamentos',
                        formato: 'excel',
                        filtros: { limit: 1000 },
                        campos: [],
                        agrupamento: 'departamento',
                        incluirGraficos: true,
                        incluirEstatisticas: true
                      });
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">Análise por Departamento</div>
                      <div className="text-sm text-muted-foreground">
                        Agrupamento de funcionários por departamento
                      </div>
                    </div>
                  </Button>
  
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => {
                      const dataInicio = new Date();
                      dataInicio.setFullYear(dataInicio.getFullYear() - 1);
                      
                      setConfig({
                        tipo: 'funcionarios',
                        formato: 'pdf',
                        filtros: { 
                          dataAdmissaoInicio: dataInicio.toISOString().slice(0, 10),
                          dataAdmissaoFim: new Date().toISOString().slice(0, 10),
                          limit: 1000 
                        },
                        campos: ['nome', 'cracha', 'funcao', 'departamento', 'dataAdmissao', 'tempoEmpresaAnos'],
                        incluirGraficos: true,
                        incluirEstatisticas: true
                      });
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">Admissões do Último Ano</div>
                      <div className="text-sm text-muted-foreground">
                        Funcionários admitidos nos últimos 12 meses
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };
  
  export default RelatoriosPessoalPage;