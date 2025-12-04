import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Eye, User, Calendar, MapPin, Phone, Building } from 'lucide-react';
import { FuncionarioCompleto } from '../../../services/departments/pessoal/funcionariosCompletosService';

interface FuncionariosCompletosTableProps {
  funcionarios: FuncionarioCompleto[];
  loading?: boolean;
}

export const FuncionariosCompletosTable: React.FC<FuncionariosCompletosTableProps> = ({
  funcionarios,
  loading = false
}) => {
  const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioCompleto | null>(null);

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'D': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'L': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'F': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value: string): string => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Carregando funcionários...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!funcionarios || funcionarios.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Nenhum funcionário encontrado com os filtros aplicados.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Funcionários Completos ({funcionarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crachá</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((funcionario) => (
                  <TableRow key={funcionario.id}>
                    <TableCell className="font-medium">{funcionario.cracha}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={funcionario.nome}>
                      {funcionario.nome}
                    </TableCell>
                    <TableCell>{funcionario.cpf}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={funcionario.funcao}>
                      {funcionario.funcao}
                    </TableCell>
                    <TableCell>{funcionario.departamento}</TableCell>
                    <TableCell>
                      <Badge className={getSituacaoColor(funcionario.situacao)}>
                        {funcionario.situacaoDescricao}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(funcionario.dataAdmissao)}</TableCell>
                    <TableCell>{funcionario.idade} anos</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFuncionario(funcionario)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <Dialog open={!!selectedFuncionario} onOpenChange={() => setSelectedFuncionario(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Funcionário</DialogTitle>
          </DialogHeader>
          {selectedFuncionario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{selectedFuncionario.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Crachá: {selectedFuncionario.cracha} | Chapa: {selectedFuncionario.chapa}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedFuncionario.funcao}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFuncionario.departamento} - {selectedFuncionario.area}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Admissão: {formatDate(selectedFuncionario.dataAdmissao)}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFuncionario.tempoEmpresaAnos} anos na empresa
                    </p>
                  </div>
                </div>

                {selectedFuncionario.cidade && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p>{selectedFuncionario.cidade}</p>
                  </div>
                )}

                {(selectedFuncionario.foneFunc || selectedFuncionario.fone2Func) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      {selectedFuncionario.foneFunc && <p>{selectedFuncionario.foneFunc}</p>}
                      {selectedFuncionario.fone2Func && <p>{selectedFuncionario.fone2Func}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-medium">Situação</p>
                  <Badge className={getSituacaoColor(selectedFuncionario.situacao)}>
                    {selectedFuncionario.situacaoDescricao}
                  </Badge>
                </div>

                <div>
                  <p className="font-medium">Informações Salariais</p>
                  <div className="text-sm space-y-1">
                    <p>Salário Base: {formatCurrency(selectedFuncionario.salBase)}</p>
                    <p>Salário Total: {formatCurrency(selectedFuncionario.salarioTotal)}</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium">Dados Pessoais</p>
                  <div className="text-sm space-y-1">
                    <p>CPF: {selectedFuncionario.cpf}</p>
                    <p>Idade: {selectedFuncionario.idade} anos</p>
                    {selectedFuncionario.mae && <p>Mãe: {selectedFuncionario.mae}</p>}
                  </div>
                </div>

                {selectedFuncionario.dtDesligQuita && (
                  <div>
                    <p className="font-medium">Data de Desligamento</p>
                    <p className="text-sm">{formatDate(selectedFuncionario.dtDesligQuita)}</p>
                  </div>
                )}

                <div>
                  <p className="font-medium">Informações Adicionais</p>
                  <div className="text-sm space-y-1">
                    <p>Vale Refeição: {selectedFuncionario.valeRefeicao === 'S' ? 'Sim' : 'Não'}</p>
                    <p>Empresa: {selectedFuncionario.empresa}</p>
                    <p>Ativo: {selectedFuncionario.ativo ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};