import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Database,
  RefreshCw,
  Beaker,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Calendar,
  Truck
} from 'lucide-react';
import operacoesService from '@/services/departments/operacoes/operacoesService';
import type { 
  OracleVerificationResult, 
  CreateTestDataResult 
} from '@/services/departments/operacoes/operacoesService';

export function OperacoesConfigPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [oracleData, setOracleData] = useState<OracleVerificationResult | null>(null);
  const [testDataResult, setTestDataResult] = useState<CreateTestDataResult | null>(null);
  const [quantidade, setQuantidade] = useState<number>(50);
  const [syncLoading, setSyncLoading] = useState({ acidentes: false, frota: false });
  const [syncResults, setSyncResults] = useState<any>({ acidentes: null, frota: null });

  const handleVerificarOracle = async () => {
    setLoading(true);
    setOracleData(null);
    try {
      const result = await operacoesService.verificarDadosOracle();
      setOracleData(result);
    } catch (error: any) {
      console.error('Erro ao verificar Oracle:', error);
      setOracleData({
        oracle: {
          total: 0,
          conexao: 'ERRO',
          erro: error.message
        },
        postgresql: {
          total: 0,
          conexao: 'OK'
        },
        status: '❌ Erro ao conectar',
        recomendacao: 'Verifique o backend e as credenciais do Oracle'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCriarDadosTeste = async () => {
    if (quantidade < 1 || quantidade > 1000) {
      alert('Quantidade deve estar entre 1 e 1000');
      return;
    }

    setLoading(true);
    setTestDataResult(null);
    try {
      const result = await operacoesService.criarDadosTeste(quantidade);
      setTestDataResult(result);
    } catch (error: any) {
      console.error('Erro ao criar dados de teste:', error);
      alert(`Erro ao criar dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSincronizar = async (tipo: 'acidentes' | 'frota') => {
    setSyncLoading(prev => ({ ...prev, [tipo]: true }));
    try {
      const result = tipo === 'acidentes' 
        ? await operacoesService.sincronizarAcidentes()
        : await operacoesService.sincronizarFrota();
      
      setSyncResults(prev => ({ ...prev, [tipo]: result }));
    } catch (error: any) {
      console.error(`Erro ao sincronizar ${tipo}:`, error);
      setSyncResults(prev => ({ 
        ...prev, 
        [tipo]: { 
          sucesso: false, 
          mensagem: error.message 
        } 
      }));
    } finally {
      setSyncLoading(prev => ({ ...prev, [tipo]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Button
            onClick={() => navigate('/departments/operacoes/dashboard')}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                Configurações de Operações
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerenciar dados, sincronizar com Oracle e criar dados de teste
              </p>
            </div>
          </div>
        </motion.div>

        {/* Verificar Oracle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-800 dark:text-blue-200">
                <Database className="w-6 h-6 text-blue-600" />
                Verificar Dados no Oracle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verifique a conexão com o banco Oracle e quantos registros existem
              </p>
              
              <Button
                onClick={handleVerificarOracle}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Verificar Oracle
                  </>
                )}
              </Button>

              {oracleData && (
                <div className="space-y-3 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    {oracleData.oracle.conexao === 'OK' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold text-lg">{oracleData.status}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {oracleData.recomendacao}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Oracle */}
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Oracle Database
                      </h4>
                      <div className="space-y-1 text-xs">
                        <p>Total: <span className="font-bold">{oracleData.oracle.total}</span> registros</p>
                        {oracleData.oracle.dataMinima && (
                          <p>Data Mínima: {new Date(oracleData.oracle.dataMinima).toLocaleDateString('pt-BR')}</p>
                        )}
                        {oracleData.oracle.dataMaxima && (
                          <p>Data Máxima: {new Date(oracleData.oracle.dataMaxima).toLocaleDateString('pt-BR')}</p>
                        )}
                        <Badge variant={oracleData.oracle.conexao === 'OK' ? 'default' : 'destructive'}>
                          {oracleData.oracle.conexao}
                        </Badge>
                      </div>
                    </div>

                    {/* PostgreSQL */}
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        PostgreSQL Local
                      </h4>
                      <div className="space-y-1 text-xs">
                        <p>Total: <span className="font-bold">{oracleData.postgresql.total}</span> registros</p>
                        <Badge variant="default">
                          {oracleData.postgresql.conexao}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {oracleData.oracle.exemplos && oracleData.oracle.exemplos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">Exemplos de Registros:</h4>
                      <div className="max-h-40 overflow-auto">
                        <pre className="text-xs bg-black/5 dark:bg-black/20 p-2 rounded">
                          {JSON.stringify(oracleData.oracle.exemplos, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Criar Dados de Teste */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-purple-800 dark:text-purple-200">
                <Beaker className="w-6 h-6 text-purple-600" />
                Criar Dados de Teste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crie dados fictícios de acidentes para testes locais (sem afetar o Oracle)
              </p>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Quantidade de acidentes:
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleCriarDadosTeste}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Beaker className="w-4 h-4 mr-2" />
                      Criar Dados
                    </>
                  )}
                </Button>
              </div>

              {testDataResult && (
                <div className="space-y-3 mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <p className="font-semibold text-lg">{testDataResult.mensagem}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Quantidade</p>
                      <p className="text-2xl font-bold">{testDataResult.quantidade}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Com Vítimas</p>
                      <p className="text-2xl font-bold text-red-600">{testDataResult.estatisticas.comVitimas}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Sem Vítimas</p>
                      <p className="text-2xl font-bold text-green-600">{testDataResult.estatisticas.semVitimas}</p>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <p><span className="font-semibold">Período:</span> {testDataResult.periodo.inicio} até {testDataResult.periodo.fim}</p>
                    <p><span className="font-semibold">Garagens:</span> {testDataResult.estatisticas.garagens.join(', ')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sincronização */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-800 dark:text-green-200">
                <RefreshCw className="w-6 h-6 text-green-600" />
                Sincronizar Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sincronize dados do Oracle para o PostgreSQL local
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sincronizar Acidentes */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold">Acidentes</h3>
                  </div>
                  <Button
                    onClick={() => handleSincronizar('acidentes')}
                    disabled={syncLoading.acidentes}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {syncLoading.acidentes ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sincronizar Acidentes
                      </>
                    )}
                  </Button>
                  
                  {syncResults.acidentes && (
                    <div className="text-xs space-y-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className={syncResults.acidentes.sucesso ? 'text-green-600' : 'text-red-600'}>
                        {syncResults.acidentes.mensagem}
                      </p>
                      {syncResults.acidentes.sucesso && (
                        <>
                          <p>Novos: {syncResults.acidentes.novosRegistros}</p>
                          <p>Atualizados: {syncResults.acidentes.registrosAtualizados}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Sincronizar Frota */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold">Frota</h3>
                  </div>
                  <Button
                    onClick={() => handleSincronizar('frota')}
                    disabled={syncLoading.frota}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {syncLoading.frota ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sincronizar Frota
                      </>
                    )}
                  </Button>
                  
                  {syncResults.frota && (
                    <div className="text-xs space-y-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className={syncResults.frota.sucesso ? 'text-green-600' : 'text-red-600'}>
                        {syncResults.frota.mensagem}
                      </p>
                      {syncResults.frota.sucesso && (
                        <>
                          <p>Novos: {syncResults.frota.novosRegistros}</p>
                          <p>Atualizados: {syncResults.frota.registrosAtualizados}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
