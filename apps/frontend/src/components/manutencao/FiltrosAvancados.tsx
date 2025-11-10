// src/components/manutencao/FiltrosAvancados.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  Calendar,
  Building2,
  Wrench,
  AlertTriangle,
  Clock,
  X,
  RotateCcw,
  Check,
  ChevronDown
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import type { FiltrosManutencao2025 } from '@/hooks/useManutencao2025';
import { GARAGENS } from '@/services/departments/manutencao/types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface FiltrosAvancadosProps {
  filtros: FiltrosManutencao2025;
  onFiltrosChange: (novosFiltros: Partial<FiltrosManutencao2025>) => void;
  onResetarFiltros: () => void;
  loading?: boolean;
  totalRegistros?: number;
}

export function FiltrosAvancados({
  filtros,
  onFiltrosChange,
  onResetarFiltros,
  loading = false,
  totalRegistros = 0
}: FiltrosAvancadosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filtrosLocais, setFiltrosLocais] = useState(filtros);

  const aplicarFiltros = () => {
    onFiltrosChange(filtrosLocais);
    setIsOpen(false);
  };

  const resetarFiltros = () => {
    onResetarFiltros();
    setFiltrosLocais({
      ano: 2025,
      mesAtual: false, // ✅ Não usar mês atual por padrão
      startDate: '2025-01-01',
      endDate: format(new Date(), 'yyyy-MM-dd'),
      limit: 10000,
      compararMesAnterior: true
    });
    setIsOpen(false);
  };

  const updateFiltroLocal = (key: keyof FiltrosManutencao2025, value: any) => {
    setFiltrosLocais(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✅ CORREÇÃO: Aplicar filtro de mês atual
  const aplicarMesAtual = () => {
    const hoje = new Date();
    onFiltrosChange({
      mesAtual: true,
      startDate: format(startOfMonth(hoje), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(hoje), 'yyyy-MM-dd')
    });
  };

  // ✅ CORREÇÃO: Usar statusOS para abertas
  const aplicarAbertas = () => {
    onFiltrosChange({ 
      statusOS: filtros.statusOS === 'A' ? undefined : 'A' 
    });
  };

  // Contar filtros ativos
  const filtrosAtivos = [
    filtros.garagem && 'Garagem',
    filtros.tipoOS && 'Tipo OS',
    (filtros.condicaoOS || filtros.statusOS) && 'Status',
    filtros.tipoProblema && 'Problema',
    filtros.prefixo && 'Prefixo',
    filtros.numeroOS && 'Número OS',
    filtros.placa && 'Placa',
    (!filtros.mesAtual && filtros.startDate && filtros.endDate) && 'Período'
  ].filter(Boolean);

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <Filter className="w-5 h-5" />
            Filtros de Busca
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {filtrosAtivos.length > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                {filtrosAtivos.length} ativo{filtrosAtivos.length > 1 ? 's' : ''}
              </Badge>
            )}
            
            {totalRegistros > 0 && (
              <Badge variant="outline" className="border-orange-300">
                {totalRegistros.toLocaleString('pt-BR')} registros
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <Button
            variant={filtros.mesAtual ? "default" : "outline"}
            size="sm"
            onClick={aplicarMesAtual}
            disabled={loading}
            className="w-full"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Mês Atual
          </Button>

          <Button
            variant={filtros.tipoOS === 'C' ? "default" : "outline"}
            size="sm"
            onClick={() => onFiltrosChange({ tipoOS: filtros.tipoOS === 'C' ? undefined : 'C' })}
            disabled={loading}
            className="w-full"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Corretivas
          </Button>

          <Button
            variant={filtros.tipoOS === 'P' ? "default" : "outline"}
            size="sm"
            onClick={() => onFiltrosChange({ tipoOS: filtros.tipoOS === 'P' ? undefined : 'P' })}
            disabled={loading}
            className="w-full"
          >
            <Wrench className="w-4 h-4 mr-1" />
            Preventivas
          </Button>

          <Button
            variant={(filtros.statusOS === 'A' || filtros.condicaoOS === 'A') ? "default" : "outline"}
            size="sm"
            onClick={aplicarAbertas}
            disabled={loading}
            className="w-full"
          >
            <Clock className="w-4 h-4 mr-1" />
            Abertas
          </Button>

          <Button
            variant={filtros.tipoProblema === 'QUEBRA' ? "destructive" : "outline"}
            size="sm"
            onClick={() => onFiltrosChange({ tipoProblema: filtros.tipoProblema === 'QUEBRA' ? undefined : 'QUEBRA' })}
            disabled={loading}
            className="w-full"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Quebras
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetarFiltros}
            disabled={loading}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>

        {/* Filtros Avançados (Colapsível) */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros Avançados
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Período Personalizado */}
                <div className="space-y-2">
                  <Label htmlFor="periodo" className="text-sm font-medium">
                    Período Personalizado
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!filtrosLocais.mesAtual}
                      onChange={(e) => updateFiltroLocal('mesAtual', !e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-600">Usar período customizado</span>
                  </div>
                  
                  {!filtrosLocais.mesAtual && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Data Início</Label>
                        <Input
                          type="date"
                          value={filtrosLocais.startDate || ''}
                          onChange={(e) => updateFiltroLocal('startDate', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Data Fim</Label>
                        <Input
                          type="date"
                          value={filtrosLocais.endDate || ''}
                          onChange={(e) => updateFiltroLocal('endDate', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Garagem */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Garagem</Label>
                  <Select
                    value={filtrosLocais.garagem || ''}
                    onValueChange={(value) => updateFiltroLocal('garagem', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as garagens" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as garagens</SelectItem>
                      {GARAGENS.map(garagem => (
                        <SelectItem key={garagem.codigo} value={garagem.nome}>
                          {garagem.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status da OS */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status da OS</Label>
                  <Select
                    value={filtrosLocais.statusOS || filtrosLocais.condicaoOS || ''}
                    onValueChange={(value) => {
                      updateFiltroLocal('statusOS', value || undefined);
                      updateFiltroLocal('condicaoOS', value || undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="A">Abertas</SelectItem>
                      <SelectItem value="FC">Fechadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de OS */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de OS</Label>
                  <Select
                    value={filtrosLocais.tipoOS || ''}
                    onValueChange={(value) => updateFiltroLocal('tipoOS', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      <SelectItem value="C">Corretivas</SelectItem>
                      <SelectItem value="P">Preventivas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Problema */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Problema</Label>
                  <Select
                    value={filtrosLocais.tipoProblema || ''}
                    onValueChange={(value) => updateFiltroLocal('tipoProblema', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os problemas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os problemas</SelectItem>
                      <SelectItem value="QUEBRA">Quebra</SelectItem>
                      <SelectItem value="DEFEITO">Defeito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Limite de Registros */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Limite de Registros</Label>
                  <Select
                    value={String(filtrosLocais.limit || 10000)}
                    onValueChange={(value) => updateFiltroLocal('limit', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="1000">1.000</SelectItem>
                      <SelectItem value="5000">5.000</SelectItem>
                      <SelectItem value="10000">10.000</SelectItem>
                      <SelectItem value="20000">20.000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campos de Busca */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prefixo do Veículo</Label>
                  <Input
                    placeholder="Digite o prefixo..."
                    value={filtrosLocais.prefixo || ''}
                    onChange={(e) => updateFiltroLocal('prefixo', e.target.value || undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Número da OS</Label>
                  <Input
                    placeholder="Digite o número..."
                    value={filtrosLocais.numeroOS || ''}
                    onChange={(e) => updateFiltroLocal('numeroOS', e.target.value || undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Placa do Veículo</Label>
                  <Input
                    placeholder="Digite a placa..."
                    value={filtrosLocais.placa || ''}
                    onChange={(e) => updateFiltroLocal('placa', e.target.value || undefined)}
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetarFiltros}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Resetar
                </Button>
                
                <Button
                  size="sm"
                  onClick={aplicarFiltros}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Aplicar Filtros
                </Button>
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        {/* Filtros Ativos */}
        {filtrosAtivos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-600">Filtros ativos:</span>
            {filtrosAtivos.map((filtro, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-orange-100 text-orange-700"
              >
                {filtro}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}