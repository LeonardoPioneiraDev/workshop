// src/components/operacoes/frota/HistoricoVeiculoModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Calendar, ArrowRight, X } from 'lucide-react';
import { useFrotaData } from '../../../services/departments/operacoes/hooks/useFrotaData';
import { Loading } from '../../ui/loading';
import type { HistoricoMudanca } from '../../../types/departments/operacoes';

interface HistoricoVeiculoModalProps {
  prefixo: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HistoricoVeiculoModal({ prefixo, isOpen, onClose }: HistoricoVeiculoModalProps) {
  const { obterHistoricoVeiculo } = useFrotaData();
  const [historico, setHistorico] = useState<HistoricoMudanca[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && prefixo) {
      carregarHistorico();
    }
  }, [isOpen, prefixo]);

  const carregarHistorico = async () => {
    if (!prefixo) return;

    try {
      setLoading(true);
      const dados = await obterHistoricoVeiculo(prefixo, 50);
      setHistorico(dados);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const obterCorTipoMudanca = (tipo: string) => {
    switch (tipo) {
      case 'STATUS': return 'bg-blue-500';
      case 'GARAGEM': return 'bg-green-500';
      case 'MOTORISTA': return 'bg-purple-500';
      case 'ROTA': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Histórico do Veículo {prefixo}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Histórico completo de mudanças e alterações do veículo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <Loading />
          ) : historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum histórico encontrado para este veículo
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Mudança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.dataMudanca).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={obterCorTipoMudanca(item.tipoMudanca)}>
                        {item.tipoMudanca}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.campoAlterado}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 line-through">
                          {item.valorAnterior || 'N/A'}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-green-600 font-medium">
                          {item.valorNovo}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}