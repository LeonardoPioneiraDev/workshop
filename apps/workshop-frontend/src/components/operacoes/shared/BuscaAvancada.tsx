// src/components/operacoes/shared/BuscaAvancada.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Search, X, Filter, Save, History } from 'lucide-react';

interface FiltroAtivo {
  campo: string;
  operador: string;
  valor: any;
  label: string;
}

interface BuscaAvancadaProps {
  campos: CampoBusca[];
  filtrosAtivos: FiltroAtivo[];
  onFiltroAdd: (filtro: FiltroAtivo) => void;
  onFiltroRemove: (index: number) => void;
  onLimpar: () => void;
  onBuscar: () => void;
  onSalvarBusca?: (nome: string) => void;
  buscasSalvas?: BuscaSalva[];
  onCarregarBusca?: (busca: BuscaSalva) => void;
}

interface CampoBusca {
  campo: string;
  label: string;
  tipo: 'texto' | 'numero' | 'data' | 'select' | 'boolean';
  opcoes?: { valor: any; label: string }[];
  operadores?: string[];
}

interface BuscaSalva {
  id: string;
  nome: string;
  filtros: FiltroAtivo[];
  dataCreacao: string;
}

export function BuscaAvancada({
  campos,
  filtrosAtivos,
  onFiltroAdd,
  onFiltroRemove,
  onLimpar,
  onBuscar,
  onSalvarBusca,
  buscasSalvas,
  onCarregarBusca
}: BuscaAvancadaProps) {
  const [campoSelecionado, setCampoSelecionado] = useState('');
  const [operadorSelecionado, setOperadorSelecionado] = useState('');
  const [valorFiltro, setValorFiltro] = useState('');
  const [nomeBusca, setNomeBusca] = useState('');
  const [mostrarSalvar, setMostrarSalvar] = useState(false);

  const operadoresPadrao = {
    texto: ['contém', 'igual a', 'diferente de', 'inicia com', 'termina com'],
    numero: ['igual a', 'diferente de', 'maior que', 'menor que', 'entre'],
    data: ['igual a', 'diferente de', 'depois de', 'antes de', 'entre'],
    select: ['igual a', 'diferente de', 'em', 'não em'],
    boolean: ['é verdadeiro', 'é falso']
  };

  const adicionarFiltro = () => {
    if (!campoSelecionado || !operadorSelecionado || !valorFiltro) return;

    const campo = campos.find(c => c.campo === campoSelecionado);
    if (!campo) return;

    const filtro: FiltroAtivo = {
      campo: campoSelecionado,
      operador: operadorSelecionado,
      valor: valorFiltro,
      label: `${campo.label} ${operadorSelecionado} ${valorFiltro}`
    };

    onFiltroAdd(filtro);
    
    // Limpar formulário
    setCampoSelecionado('');
    setOperadorSelecionado('');
    setValorFiltro('');
  };

  const salvarBusca = () => {
    if (onSalvarBusca && nomeBusca && filtrosAtivos.length > 0) {
      onSalvarBusca(nomeBusca);
      setNomeBusca('');
      setMostrarSalvar(false);
    }
  };

  const campoAtual = campos.find(c => c.campo === campoSelecionado);
  const operadores = campoAtual?.operadores || operadoresPadrao[campoAtual?.tipo || 'texto'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Busca Avançada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Construtor de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Select value={campoSelecionado} onValueChange={setCampoSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o campo" />
            </SelectTrigger>
            <SelectContent>
              {campos.map(campo => (
                <SelectItem key={campo.campo} value={campo.campo}>
                  {campo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={operadorSelecionado} 
            onValueChange={setOperadorSelecionado}
            disabled={!campoSelecionado}
          >
            <SelectTrigger>
              <SelectValue placeholder="Operador" />
            </SelectTrigger>
            <SelectContent>
              {operadores.map(op => (
                <SelectItem key={op} value={op}>{op}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {campoAtual?.tipo === 'select' ? (
            <Select value={valorFiltro} onValueChange={setValorFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Valor" />
              </SelectTrigger>
              <SelectContent>
                {campoAtual.opcoes?.map(opcao => (
                  <SelectItem key={opcao.valor} value={opcao.valor}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Valor"
              value={valorFiltro}
              onChange={(e) => setValorFiltro(e.target.value)}
              type={campoAtual?.tipo === 'numero' ? 'number' : 
                    campoAtual?.tipo === 'data' ? 'date' : 'text'}
              disabled={!operadorSelecionado}
            />
          )}

          <Button onClick={adicionarFiltro} disabled={!valorFiltro}>
            <Filter className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Filtros Ativos */}
        {filtrosAtivos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Filtros Ativos:</h4>
            <div className="flex flex-wrap gap-2">
              {filtrosAtivos.map((filtro, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {filtro.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onFiltroRemove(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Buscas Salvas */}
        {buscasSalvas && buscasSalvas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Buscas Salvas:</h4>
            <div className="flex flex-wrap gap-2">
              {buscasSalvas.map(busca => (
                <Button
                  key={busca.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onCarregarBusca?.(busca)}
                  className="flex items-center gap-1"
                >
                  <History className="h-3 w-3" />
                  {busca.nome}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={onBuscar} disabled={filtrosAtivos.length === 0}>
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          
          <Button variant="outline" onClick={onLimpar}>
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>

          {onSalvarBusca && (
            <Button 
              variant="outline" 
              onClick={() => setMostrarSalvar(!mostrarSalvar)}
              disabled={filtrosAtivos.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Busca
            </Button>
          )}
        </div>

        {/* Formulário para Salvar Busca */}
        {mostrarSalvar && (
          <div className="flex gap-2">
            <Input
              placeholder="Nome da busca"
              value={nomeBusca}
              onChange={(e) => setNomeBusca(e.target.value)}
            />
            <Button onClick={salvarBusca} disabled={!nomeBusca}>
              Salvar
            </Button>
            <Button variant="outline" onClick={() => setMostrarSalvar(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}