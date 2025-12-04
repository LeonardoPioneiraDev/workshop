// src/components/operacoes/acidentes/AcidenteCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { 
  AlertTriangle, 
  MapPin, 
  Truck, 
  Calendar, 
  Clock,
  DollarSign,
  Eye
} from 'lucide-react';
import type { Acidente } from '../../../types/departments/operacoes';

interface AcidenteCardProps {
  acidente: Acidente;
  onVerDetalhes: (acidente: Acidente) => void;
}

export function AcidenteCard({ acidente, onVerDetalhes }: AcidenteCardProps) {
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

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-lg font-bold">{acidente.prefixoVeiculo}</span>
          </div>
          <Badge className={obterCorGrau(acidente.grauAcidente)}>
            {acidente.grauAcidente}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {new Date(acidente.dataAcidente).toLocaleDateString('pt-BR')}
          </span>
          <Clock className="h-3 w-3 text-muted-foreground ml-2" />
          <span className="text-sm">{acidente.horaAcidente}</span>
        </div>

        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{acidente.placaVeiculo}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{acidente.municipio} - {acidente.bairro}</span>
        </div>

        <div>
          <span className="text-muted-foreground text-sm">Garagem:</span>
          <p className="font-medium">{acidente.garagemVeiculoNome}</p>
        </div>

        <div>
          <span className="text-muted-foreground text-sm">Turno:</span>
          <p className="font-medium">{acidente.turno}</p>
        </div>

        {acidente.valorTotalDano > 0 && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-bold text-red-600">
              {formatarMoeda(acidente.valorTotalDano)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Badge className={obterCorStatus(acidente.statusProcesso)}>
            {acidente.statusProcesso}
          </Badge>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onVerDetalhes(acidente)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}