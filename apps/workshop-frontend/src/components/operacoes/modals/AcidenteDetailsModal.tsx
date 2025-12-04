import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Truck,
  User,
  Clock,
  DollarSign,
  FileText,
  Info,
  Phone,
  Shield
} from 'lucide-react';

interface AcidenteDetailsModalProps {
  acidente: any;
  isOpen: boolean;
  onClose: () => void;
}

export function AcidenteDetailsModal({ acidente, isOpen, onClose }: AcidenteDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'processo' | 'custos'>('details');

  const getGrauBadge = (grau: string) => {
    const variants = {
      'COM VITIMAS': 'bg-red-100 text-red-800',
      'COM VÍTIMAS': 'bg-red-100 text-red-800',
      'SEM VITIMAS': 'bg-green-100 text-green-800',
      'SEM VÍTIMAS': 'bg-green-100 text-green-800'
    };
    return variants[grau as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ABERTO': 'bg-orange-100 text-orange-800',
      'EM ANDAMENTO': 'bg-blue-100 text-blue-800',
      'FECHADO': 'bg-green-100 text-green-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (!acidente) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Acidente - {acidente.prefixoVeiculo || 'N/A'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatarData(acidente.dataAcidente)} • {acidente.municipio}
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
                { key: 'processo', label: 'Processo', icon: FileText },
                { key: 'custos', label: 'Custos', icon: DollarSign }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20'
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
                  {/* Status e Grau */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge className={getGrauBadge(acidente.grauAcidente || '')}>
                      {acidente.grauAcidente || 'NÃO INFORMADO'}
                    </Badge>
                    <Badge className={getStatusBadge(acidente.statusProcesso || '')}>
                      {acidente.statusProcesso || 'NÃO INFORMADO'}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Informações principais em grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Informações do Acidente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Data:</span>
                          <span className="text-sm">{formatarData(acidente.dataAcidente)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Hora:</span>
                          <span className="text-sm">{acidente.horaAcidente || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Local:</span>
                          <span className="text-sm">{acidente.municipio}, {acidente.bairro}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Tipo:</span>
                          <span className="text-sm">{acidente.tipoAcidenteGeral || 'N/A'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Veículo Envolvido
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Prefixo:</span>
                          <span className="text-sm">{acidente.prefixoVeiculo || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Placa:</span>
                          <span className="text-sm">{acidente.placaVeiculo || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Garagem:</span>
                          <span className="text-sm">{acidente.garagemVeiculoNome || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Motorista:</span>
                          <span className="text-sm">{acidente.nomeMotorista || 'N/A'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Valores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Valores Financeiros
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total de Danos:</span>
                          <span className="text-sm font-semibold text-red-600">
                            {acidente.valorTotalDano ? formatarValor(acidente.valorTotalDano) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Valor Acordo:</span>
                          <span className="text-sm font-semibold text-green-600">
                            {acidente.valorAcordo ? formatarValor(acidente.valorAcordo) : 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Informações Adicionais
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Seguradora:</span>
                          <span className="text-sm">{acidente.seguradora || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Protocolo:</span>
                          <span className="text-sm">{acidente.protocoloSeguro || 'N/A'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'processo' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Status do Processo</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Status Atual:</span>
                          <Badge className={getStatusBadge(acidente.statusProcesso || '')}>
                            {acidente.statusProcesso || 'NÃO INFORMADO'}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">Acidente Registrado</p>
                              <p className="text-xs text-gray-500">{formatarData(acidente.dataAcidente)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">Análise em Andamento</p>
                              <p className="text-xs text-gray-500">Em processamento</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-400">Processo Finalizado</p>
                              <p className="text-xs text-gray-400">Pendente</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'custos' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Análise de Custos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Custos Diretos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Danos ao Veículo:</span>
                          <span className="font-semibold">
                            {acidente.valorDanoVeiculo ? formatarValor(acidente.valorDanoVeiculo) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Danos a Terceiros:</span>
                          <span className="font-semibold">
                            {acidente.valorDanoTerceiros ? formatarValor(acidente.valorDanoTerceiros) : 'N/A'}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Total:</span>
                          <span className="text-red-600">
                            {acidente.valorTotalDano ? formatarValor(acidente.valorTotalDano) : 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Cobertura do Seguro</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Valor Coberto:</span>
                          <span className="font-semibold text-green-600">
                            {acidente.valorCobertoSeguro ? formatarValor(acidente.valorCobertoSeguro) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Franquia:</span>
                          <span className="font-semibold">
                            {acidente.franquia ? formatarValor(acidente.franquia) : 'N/A'}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Valor Final:</span>
                          <span className="text-blue-600">
                            {acidente.valorAcordo ? formatarValor(acidente.valorAcordo) : 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Editar Acidente
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}