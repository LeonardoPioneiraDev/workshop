import { Card, CardContent } from "../ui/card";

import { Loader2 } from "lucide-react";

interface Props {
  data: any[];
  loading: boolean;
}

export function ManOsTable({ data, loading }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº OS</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Garagem</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Data Abertura</TableHead>
                <TableHead>Data Fechamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Tipo Problema</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" /> Carregando...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item: any) => (
                  <TableRow key={item.codigoInternoOS}>
                    <TableCell>{item.numeroOS}</TableCell>
                    <TableCell>{item.codigoVeiculo}</TableCell>
                    <TableCell>{item.nomeGaragem}</TableCell>
                    <TableCell>{item.codigoSetor}</TableCell>
                    <TableCell>{item.dataAbertura}</TableCell>
                    <TableCell>{item.dataFechamento}</TableCell>
                    <TableCell>{item.tipoOS}</TableCell>
                    <TableCell>{item.condicaoOS}</TableCell>
                    <TableCell>{item.descricaoOrigem}</TableCell>
                    <TableCell>{item.tipoProblema}</TableCell>
                    <TableCell>{item.usuarioAbertura}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}