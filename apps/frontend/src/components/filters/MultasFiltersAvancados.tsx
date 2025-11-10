// apps/frontend/src/components/departments/legal/filters/MultasFiltersAvancados.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { 
  Filter, 
  X, 
  Search,
  Calendar,
  Clock,
  DollarSign,
  User,
  Building2,
  AlertTriangle,
  Settings,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiltrosAvancados, TipoMulta, ResponsavelMulta, StatusPrazo } from '../../types/multa-completa';
import { MultaClassificador } from '../../utils/multaClassificacao';

interface MultasFiltersAvancadosProps {
  filtros: FiltrosAvancados;
  onFiltrosChange: (filtros: Partial<FiltrosAvancados>) => void;
  onLimparFiltros: () => void;
  isOpen: boolean;
  onToggle: () => void;
  totalResultados?: number;
}

export function MultasFiltersAvancados({
  filtros,
  onFiltrosChange,
  onLimparFiltros,
  isOpen,
  onToggle,
  totalResultados
}: MultasFiltersAvancadosProps) {
  const [filtrosLocais, setFiltrosLocais] = useState<FiltrosAvancados>(filtros);

  const aplicarFiltros = () => {
    onFiltrosChange(filtrosLocais);
    onToggle();
  };

  const limparTudo = () => {
    setFiltrosLocais({});
    onLimparFiltros();
  };

  const atualizarFiltroLocal = (campo: keyof FiltrosAvancados, valor: any) => {
    setFiltrosLocais(prev => ({ ...prev, [campo]: valor }));
  };

  const toggleArrayFilter = <T,>(campo: keyof FiltrosAvancados, valor: T) => {
    const arrayAtual = (filtrosLocais[campo] as T[]) || [];
    const novoArray = arrayAtual.includes(valor)
      ? arrayAtual.filter(item => item !== valor)
      : [...arrayAtual, valor];
    
    atualizarFiltroLocal(campo, novoArray.length > 0 ? novoArray : undefined);
  };

  const contarFiltrosAtivos = () => {
    return Object.values(filtrosLocais).filter(valor => 
      valor !== undefined && valor !== null && valor !== '' && 
      (!Array.isArray(valor) || valor.length > 0)
    ).length;
  };

  const filtrosAtivos = contarFiltrosAtivos();

  return (
    <>
      {/* Botão de Toggle */}
      <Button
        onClick={onToggle}
        variant="outline"
        className="border-gray-600 text-gray-300 hover:bg-gray-700 relative"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtros Avançados
        {filtrosAtivos > 0 && (
          <Badge className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5">
            {filtrosAtivos}
          </Badge>
        )}
      </Button>

      {/* Painel de Filtros */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-gray-800 border-gray-700 mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Settings className="h-5 w-5 text-blue-500" />
                    Filtros Avançados
                    {totalResultados !== undefined && (
                      <Badge className="bg-blue-500 text-white">
                        {totalResultados} resultados
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    onClick={onToggle}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filtros de Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      Data Início
                    </Label>
                    <Input
                      type="date"
                      value={filtrosLocais.dataInicio || ''}
                      onChange={(e) => atualizarFiltroLocal('dataInicio', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      Data Fim
                    </Label>
                    <Input
                      type="date"
                      value={filtrosLocais.dataFim || ''}
                      onChange={(e) => atualizarFiltroLocal('dataFim', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Filtros de Busca */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2 mb-2">
                      <Search className="h-4 w-4" />
                      Prefixo do Veículo
                    </Label>
                    <Input
                      placeholder="Ex: 0235130"
                      value={filtrosLocais.prefixoVeic || ''}
                      onChange={(e) => atualizarFiltroLocal('prefixoVeic', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      Código do Agente
                    </Label>
                    <Input
                      placeholder="Ex: AG001"
                      value={filtrosLocais.agenteCodigo || ''}
                      onChange={(e) => atualizarFiltroLocal('agenteCodigo', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Tipo de Multa */}
                <div>
                  <Label className="text-gray-300 flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4" />
                    Tipo de Multa (por valor)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(['A', 'B', 'C'] as TipoMulta[]).map(tipo => {
                      const isSelected = filtrosLocais.tipoMulta?.includes(tipo);
                      const info = tipo === 'A' ? 'R$ 495' : tipo === 'B' ? 'R$ 990' : 'R$ 1.980 (Grave)';
                      
                      return (
                        <Button
                          key={tipo}
                          onClick={() => toggleArrayFilter('tipoMulta', tipo)}
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={`
                            ${isSelected 
                              ? tipo === 'A' ? 'bg-green-500 hover:bg-green-600' :
                                tipo === 'B' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                'bg-red-500 hover:bg-red-600'
                              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            }
                          `}
                        >
                          Tipo {tipo} ({info})
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Responsável pela Multa */}
                <div>
                  <Label className="text-gray-300 flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4" />
                    Responsável pela Multa
                  </Label>
                  <div className="flex gap-2">
                    {(['F', 'E'] as ResponsavelMulta[]).map(resp => {
                      const isSelected = filtrosLocais.responsavelMulta?.includes(resp);
                      const label = resp === 'F' ? '👤 Funcionário' : '🏢 Empresa';
                      
                      return (
                        <Button
                          key={resp}
                          onClick={() => toggleArrayFilter('responsavelMulta', resp)}
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={`
                            ${isSelected 
                              ? resp === 'F' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'
                              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            }
                          `}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Status do Prazo */}
                <div>
                  <Label className="text-gray-300 flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4" />
                    Status do Prazo de Defesa
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(['OK', 'ATENCAO', 'CRITICO', 'VENCIDO'] as StatusPrazo[]).map(status => {
                      const isSelected = filtrosLocais.statusPrazo?.includes(status);
                      const config = {
                        'OK': { label: '✅ No Prazo', cor: 'bg-green-500 hover:bg-green-600' },
                        'ATENCAO': { label: '⚠️ Atenção', cor: 'bg-yellow-500 hover:bg-yellow-600' },
                        'CRITICO': { label: '🚨 Crítico', cor: 'bg-orange-500 hover:bg-orange-600' },
                        'VENCIDO': { label: '❌ Vencido', cor: 'bg-red-500 hover:bg-red-600' }
                      };
                      
                      return (
                        <Button
                          key={status}
                          onClick={() => toggleArrayFilter('statusPrazo', status)}
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={`
                            ${isSelected 
                              ? config[status].cor
                              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            }
                          `}
                        >
                          {config[status].label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Área de Competência */}
                <div>
                  <Label className="text-gray-300 flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4" />
                    Área de Competência
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(MultaClassificador.AREAS_COMPETENCIA).map(([codigo, nome]) => {
                      const codigoNum = parseInt(codigo);
                      const isSelected = filtrosLocais.codAreaCompetencia?.includes(codigoNum);
                      
                      return (
                        <Button
                          key={codigo}
                          onClick={() => toggleArrayFilter('codAreaCompetencia', codigoNum)}
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={`
                            text-xs
                            ${isSelected 
                              ? 'bg-blue-500 hover:bg-blue-600'
                              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            }
                          `}
                        >
                          {nome}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Responsável pela Notificação */}
                <div>
                  <Label className="text-gray-300 flex items-center gap-2 mb-3">
                    <User className="h-4 w-4" />
                    Responsável pela Notificação
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(MultaClassificador.RESPONSAVEIS_NOTIFICACAO).map(([codigo, nome]) => {
                      const codigoNum = parseInt(codigo);
                      const isSelected = filtrosLocais.codResponsavelNotificacao?.includes(codigoNum);
                      
                      return (
                        <Button
                          key={codigo}
                          onClick={() => toggleArrayFilter('codResponsavelNotificacao', codigoNum)}
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className={`
                            text-xs
                            ${isSelected 
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            }
                          `}
                        >
                          {nome}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtros de Horário */}
                <div>
                  <Label className="text-gray-300 flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4" />
                    Horário da Infração
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400 text-sm mb-1">Hora Início</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="0"
                        value={filtrosLocais.horaInicio || ''}
                        onChange={(e) => atualizarFiltroLocal('horaInicio', parseInt(e.target.value) || undefined)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm mb-1">Hora Fim</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="23"
                        value={filtrosLocais.horaFim || ''}
                        onChange={(e) => atualizarFiltroLocal('horaFim', parseInt(e.target.value) || undefined)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Filtros Especiais */}
                <div>
                  <Label className="text-gray-300 flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4" />
                    Filtros Especiais
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="apenasVencendo"
                        checked={filtrosLocais.apenasVencendo || false}
                        onCheckedChange={(checked) => atualizarFiltroLocal('apenasVencendo', checked)}
                        className="border-gray-600"
                      />
                      <Label htmlFor="apenasVencendo" className="text-gray-300 text-sm">
                        Apenas multas vencendo (próximas ao prazo)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="comMotivoReal"
                        checked={filtrosLocais.comMotivoReal || false}
                        onCheckedChange={(checked) => atualizarFiltroLocal('comMotivoReal', checked)}
                        className="border-gray-600"
                      />
                      <Label htmlFor="comMotivoReal" className="text-gray-300 text-sm">
                        Apenas com motivo real especificado
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="apenasReincidencia"
                        checked={filtrosLocais.apenasReincidencia || false}
                        onCheckedChange={(checked) => atualizarFiltroLocal('apenasReincidencia', checked)}
                        className="border-gray-600"
                      />
                      <Label htmlFor="apenasReincidencia" className="text-gray-300 text-sm">
                        Apenas reincidência (Tipo C - R$ 1.980)
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <Button
                    onClick={limparTudo}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar Tudo
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={onToggle}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={aplicarFiltros}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Aplicar Filtros
                      {filtrosAtivos > 0 && (
                        <Badge className="ml-2 bg-white text-blue-600 text-xs px-1.5 py-0.5">
                          {filtrosAtivos}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}