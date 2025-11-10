import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Truck, 
  Calendar, 
  MapPin, 
  Fuel, 
  Gauge,
  User,
  Route,
  Settings,
  History,
  Info,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { operacoesApi } from '@/services/departments/operacoes/api/operacoesApi';

interface VeiculoDetailsModalProps {
  veiculo: any;
  isOpen: boolean;
  onClose: () => void;
}

export function VeiculoDetailsModal({ veiculo, isOpen, onClose }: VeiculoDetailsModalProps) {
  const [historico, setHistorico] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  useEffect(() => {
    if (isOpen && veiculo && activeTab === 'history') {
      carregarHistorico();
    }
  }, [isOpen, veiculo, activeTab]);

  const carregarHistorico = async () => {
    if (!veiculo?.prefixo) return;
    
    try {
      setLoadingHistorico(true);
      // Tentar carregar histórico real do backend
      // Por enquanto, não mostrar dados simulados
      const response = await operacoesApi.getVeiculoHistorico?.(veiculo.prefixo);
      if (response && Array.isArray(response)) {
        setHistorico(response);
      } else {
        setHistorico([]);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      // Em caso de erro, não mostrar dados fictícios
      setHistorico([]);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ATIVO': 'bg-green-100 text-green-800',
      'MANUTENCAO': 'bg-yellow-100 text-yellow-800', 
      'INATIVO': 'bg-red-100 text-red-800',
      'RESERVA': 'bg-blue-100 text-blue-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (!veiculo) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 50 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 rounded-2xl shadow-2xl border border-white/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-blue-100/50 dark:border-blue-800/50 bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/20 dark:to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Veículo {veiculo.prefixo}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {veiculo.placa} • {veiculo.modelo}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { key: 'details', label: 'Detalhes', icon: Info },
                { key: 'history', label: 'Histórico', icon: History }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusBadge(veiculo.status)}>
                      {veiculo.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Última atualização: {formatarData(veiculo.dataSincronizacao || new Date().toISOString())}
                    </span>
                  </div>

                  <Separator />

                  {/* Informações principais em grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-200/50 dark:border-blue-700/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Informações Básicas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Código:</span>
                          <span className="text-sm">{veiculo.codigoVeiculo || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Modelo:</span>
                          <span className="text-sm">{veiculo.modelo || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Ano:</span>
                          <span className="text-sm">{veiculo.ano || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Tipo:</span>
                          <span className="text-sm">{veiculo.tipoVeiculo || 'N/A'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-900/30 dark:to-green-800/20 border-green-200/50 dark:border-green-700/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                          Localização e Operação
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Garagem:</span>
                          <span className="text-sm">{veiculo.garagemNome || veiculo.garagem || 'N/A'}</span>
                        </div>
                         
                        
                      </CardContent>
                    </Card>
                  </div>

                  {/* Observações */}
                  {veiculo.observacoes && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Observações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {veiculo.observacoes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Histórico de Mudanças</h3>
                  {loadingHistorico ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : historico.length > 0 ? (
                    <div className="space-y-3">
                      {historico.map((evento) => (
                        <Card key={evento.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{evento.descricao}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {formatarData(evento.data)} • {evento.responsavel}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {evento.tipo}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Nenhum histórico encontrado
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Este veículo ainda não possui eventos registrados no sistema.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}