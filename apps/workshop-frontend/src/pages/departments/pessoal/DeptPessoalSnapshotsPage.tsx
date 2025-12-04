import React, { useEffect, useState } from 'react';
import { syncDeptPessoal, getDeptPessoalResumo, getDeptPessoalAtual } from '@/services/departments/pessoal/deptPessoalApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DeptPessoalSnapshotsPage: React.FC = () => {
  const [resumo, setResumo] = useState<any[]>([]);
  const [atual, setAtual] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [r, a] = await Promise.all([getDeptPessoalResumo(), getDeptPessoalAtual()]);
      setResumo(r || []);
      setAtual(a || []);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar dados');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    try {
      await syncDeptPessoal(true);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Falha ao sincronizar');
    } finally {
      setLoading(false);
    }
  };

  // Agrupar resumo por referencia_date
  const resumoPorMes = resumo.reduce((acc: Record<string, any[]>, row: any) => {
    const key = row.referencia_date;
    acc[key] = acc[key] || [];
    acc[key].push(row);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Departamento Pessoal - Snapshots</h1>
        <Button onClick={handleSync} disabled={loading}>
          {loading ? 'Sincronizando...' : 'Sincronizar (4 referências)'}
        </Button>
      </div>

      {error && (
        <div className="text-red-400">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumo por Mês (Departamento/Área/Situação)</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(resumoPorMes).length === 0 ? (
            <div>Nenhum dado.</div>
          ) : (
            Object.entries(resumoPorMes).map(([mes, rows]) => (
              <div key={mes} className="mb-6">
                <h3 className="font-medium mb-2">{mes}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{r.departamento}</TableCell>
                        <TableCell>{r.area}</TableCell>
                        <TableCell>{r.situacao}</TableCell>
                        <TableCell className="text-right">{r.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funcionários - Mês Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cracha</TableHead>
                <TableHead>Chapa</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atual.slice(0, 100).map((r: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{r.nome}</TableCell>
                  <TableCell>{r.cracha || '-'}</TableCell>
                  <TableCell>{r.chapa || '-'}</TableCell>
                  <TableCell>{r.cpf || '-'}</TableCell>
                  <TableCell>{r.funcao || '-'}</TableCell>
                  <TableCell>{r.departamento || '-'}</TableCell>
                  <TableCell>{r.area || '-'}</TableCell>
                  <TableCell>{r.situacao || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {atual.length > 100 && (
            <div className="text-sm text-gray-400 mt-2">Mostrando 100 de {atual.length} registros</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeptPessoalSnapshotsPage;

