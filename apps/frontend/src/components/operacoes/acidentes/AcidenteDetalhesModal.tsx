// src/components/operacoes/acidentes/AcidenteDetalhesModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Truck, 
  DollarSign, 
  AlertTriangle,
  X,
  FileText,
  Users
} from 'lucide-react';
import type { Acidente } from '../../../types/departments/operacoes';

interface AcidenteDetalhesModalProps {
  acidente: Acidente | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AcidenteDetalhesModal({ acidente, isOpen, onClose }: AcidenteDetalhesModalProps) {
  if (!acidente) return null;

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const obterCorGrau = (grau: string) => {
    return grau === 'COM VÍTIMAS' ? 'bg-red-500' : 'bg-yellow-500';
  };

  const obterCorStatus = (status: string) => {
    switch (status) {
      case 'FECHADO': return 'bg-green-500';
      case 'ABERTO': return 'bg-red-500';
      case 'EM_ANDAMENTO': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Acidente</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o acidente registrado
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Data:</span>
                <span>{new Date(acidente.dataAcidente).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Hora:</span>
                <span>{acidente.horaAcidente}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Grau:</span>
                <Badge className={obterCorGrau(acidente.grauAcidente)}>
                  {acidente.grauAcidente}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge className={obterCorStatus(acidente.statusProcesso)}>
                  {acidente.statusProcesso}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Turno:</span>
                <span>{acidente.turno}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Período:</span>
                <span>{acidente.periodoDia}</span>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Veículo Envolvido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Prefixo:</span>
                <span className="text-lg font-bold">{acidente.prefixoVeiculo}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Placa:</span>
                <span>{acidente.placaVeiculo}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Garagem:</span>
                <span>{acidente.garagemVeiculoNome}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Linha:</span>
                <span>{acidente.numeroLinha} - {acidente.descricaoLinha}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Garagem da Linha:</span>
                <span>{acidente.garagemLinhaNome}</span>
              </div>
            </CardContent>
          </Card>

          {/* Local do Acidente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Local do Acidente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Município:</span>
                <span>{acidente.municipio}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Bairro:</span>
                <span>{acidente.bairro}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Condição do Tempo:</span>
                <span>{acidente.condicaoTempo}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Visibilidade:</span>
                <span>{acidente.visibilidade}</span>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Valor Total do Dano:</span>
                <span className="text-lg font-bold text-red-600">
                  {formatarMoeda(acidente.valorTotalDano || 0)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Valor do Acordo:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatarMoeda(acidente.valorAcordo || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do Acidente */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes do Acidente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Tipo Geral:</span>
                <p className="mt-1">{acidente.tipoAcidenteGeral}</p>
              </div>
              
              <div>
                <span className="font-medium">Tipo Detalhado:</span>
                <p className="mt-1">{acidente.tipoAcidenteDetalhe}</p>
              </div>

              <div>
                <span className="font-medium">Tipo de Monta:</span>
                <p className="mt-1">{acidente.tipoMonta}</p>
              </div>

              {acidente.ocorrencia && (
                <div>
                  <span className="font-medium">Ocorrência:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded border">
                    {acidente.ocorrencia}
                  </p>
                </div>
              )}

              {acidente.punicoesAplicadas && (
                <div>
                  <span className="font-medium">Punições Aplicadas:</span>
                  <p className="mt-1 p-3 bg-red-50 rounded border border-red-200">
                    {acidente.punicoesAplicadas}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}