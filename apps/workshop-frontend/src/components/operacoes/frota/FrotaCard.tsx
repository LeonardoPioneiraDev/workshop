// src/components/operacoes/frota/FrotaCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  Truck, 
  MapPin, 
  User, 
  Calendar, 
  Fuel,
  History,
  Eye
} from 'lucide-react';
import type { VeiculoOperacional } from '../../../types/departments/operacoes';

interface FrotaCardProps {
  veiculo: VeiculoOperacional;
  onVerDetalhes: (veiculo: VeiculoOperacional) => void;
  onVerHistorico: (prefixo: string) => void;
}

export function FrotaCard({ veiculo, onVerDetalhes, onVerHistorico }: FrotaCardProps) {
  const obterCorStatus = (status: string) => {
    return status === 'ATIVO' ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <span className="text-lg font-bold">{veiculo.prefixo}</span>
          </div>
          <Badge className={obterCorStatus(veiculo.status)}>
            {veiculo.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Placa:</span>
            <p className="font-medium">{veiculo.placa}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Ano:</span>
            <p className="font-medium">{veiculo.ano}</p>
          </div>
        </div>

        <div>
          <span className="text-muted-foreground">Modelo:</span>
          <p className="font-medium">{veiculo.modelo} {veiculo.marca}</p>
        </div>

        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{veiculo.garagemNome}</span>
        </div>

       
        <div className="flex items-center gap-1">
          <Fuel className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{veiculo.combustivel}</span>
        </div>

        {veiculo.quilometragem && (
          <div>
            <span className="text-muted-foreground text-sm">Quilometragem:</span>
            <p className="font-medium">{veiculo.quilometragem.toLocaleString('pt-BR')} km</p>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Atualizado em {new Date(veiculo.dataUltimaAtualizacao).toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onVerDetalhes(veiculo)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onVerHistorico(veiculo.prefixo)}
          >
            <History className="h-3 w-3 mr-1" />
            Histórico
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}