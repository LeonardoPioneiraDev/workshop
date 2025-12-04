import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Moon, Sun, Users } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type User = {
  id: string | number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  position?: string;
  isActive: boolean;
};

type UsersResponse = {
  data: User[];
  pagination: PaginationMeta;
};

const DEFAULT_LIMIT = 10;

export default function UsersPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<string[]>([]);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'USUARIO',
    department: '',
    position: '',
    isActive: true,
    sendWelcomeEmail: true,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      const list = await api.get<string[]>('/users/roles');
      if (Array.isArray(list) && list.length) setRoles(list);
      else setRoles(['ADMIN','DIRETOR','GERENTE','ENCARREGADO','COORDENADOR','SUPERVISOR','ANALISTA','USUARIO']);
    } catch {
      setRoles(['ADMIN','DIRETOR','GERENTE','ENCARREGADO','COORDENADOR','SUPERVISOR','ANALISTA','USUARIO']);
    }
  }, []);

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const resp = await api.get<UsersResponse>('/users', { page: p, limit: DEFAULT_LIMIT, search: search.trim() });
      setItems(resp.data || []);
      setTotalPages(resp.pagination?.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const resetForm = () => {
    setEditing(null);
    setForm({ username: '', email: '', fullName: '', role: 'USUARIO', department: '', position: '', isActive: true, sendWelcomeEmail: true });
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      department: u.department || '',
      position: u.position || '',
      isActive: u.isActive,
      sendWelcomeEmail: false,
    });
    setOpenForm(true);
  };

  const submitForm = async () => {
    if (editing) {
      await api.patch<User>(`/users/${editing.id}`, {
        email: form.email,
        fullName: form.fullName,
        role: form.role,
        department: form.department || undefined,
        position: form.position || undefined,
        isActive: form.isActive,
      });
    } else {
      await api.post<User>('/users', {
        username: form.username,
        email: form.email,
        fullName: form.fullName,
        role: form.role,
        department: form.department || undefined,
        position: form.position || undefined,
        isActive: form.isActive,
        sendWelcomeEmail: form.sendWelcomeEmail,
      });
    }
    setOpenForm(false);
    resetForm();
    fetchUsers(page);
  };

  const toggleActive = async (u: User) => {
    await api.patch<User>(`/users/${u.id}/toggle-active`);
    fetchUsers(page);
  };

  const askRemoveUser = (u: User) => {
    setConfirmUser(u);
    setConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!confirmUser) return;
    await api.delete(`/users/${confirmUser.id}`);
    setConfirmOpen(false);
    setConfirmUser(null);
    if (items.length === 1 && page > 1) setPage(page - 1);
    else fetchUsers(page);
  };

  const canSubmit = useMemo(() => {
    const hasBase = form.username.trim().length >= 3 || !!editing;
    return hasBase && !!form.email.trim() && !!form.fullName.trim() && !!form.role;
  }, [form, editing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffdf5] via-[#fef0d4] to-[#feeccc] dark:from-gray-950 dark:via-gray-900 dark:to-neutral-900 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-10 h-64 w-64 rounded-full bg-[#fbcc2c]/40 blur-3xl dark:bg-yellow-500/20" />
          <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[#fbcc2c]/30 blur-3xl dark:bg-yellow-400/30" />
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(251,204,44,0.35),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <Card className="relative overflow-hidden rounded-3xl border border-white/30 dark:border-yellow-500/30 bg-white/80 dark:bg-gray-900/80 shadow-2xl shadow-yellow-500/10 dark:shadow-black/40 backdrop-blur-xl">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => navigate(-1)} className="hidden sm:inline-flex">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                  </Button>
                  <div className="rounded-2xl p-2 bg-yellow-100/70 dark:bg-yellow-900/30 border border-white/40 dark:border-yellow-500/30">
                    <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl">Gerenciamento de Usuários</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-gray-800 shadow-lg transition hover:bg-white dark:border-yellow-400/60 dark:bg-gray-900/70 dark:text-gray-100 dark:hover:bg-gray-900"
                    aria-label="Alternar tema"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                  <Button onClick={openCreate} className="bg-yellow-500 hover:bg-yellow-600 text-black dark:text-gray-900" aria-label="Novo usuário">
                    Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2 w-full sm:w-1/2">
                    <Input
                      placeholder="Buscar por nome, email ou username"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchUsers(1); } }}
                    />
                    <Button variant="secondary" onClick={() => { setPage(1); fetchUsers(1); }} disabled={loading}>Buscar</Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/30 dark:border-yellow-500/20 bg-white/60 dark:bg-gray-950/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.username}</TableCell>
                          <TableCell>{u.fullName}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.role}</TableCell>
                          <TableCell>
                            <Switch checked={u.isActive} onCheckedChange={() => toggleActive(u)} />
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Editar</Button>
                            <Button size="sm" variant="destructive" onClick={() => askRemoveUser(u)}>Excluir</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                            {loading ? 'Carregando...' : 'Nenhum usuário encontrado'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Anterior</span>
                    </Button>
                    <span className="text-sm">Página {page} de {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      <span className="hidden sm:inline mr-1">Próxima</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          </DialogHeader>

          {!editing && (
            <div className="grid gap-3">
              <label className="text-sm">Username</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
          )}

          <div className="grid gap-3 mt-3">
            <label className="text-sm">Nome completo</label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>

          <div className="grid gap-3 mt-3">
            <label className="text-sm">Email</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div className="grid gap-3 mt-3">
            <label className="text-sm">Role</label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="grid gap-2">
              <label className="text-sm">Departamento (opcional)</label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Cargo (opcional)</label>
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <span className="text-sm">Ativo</span>
            </div>
            {!editing && (
              <div className="flex items-center gap-2">
                <Switch checked={form.sendWelcomeEmail} onCheckedChange={(v) => setForm({ ...form, sendWelcomeEmail: v })} />
                <span className="text-sm">Enviar e-mail de boas-vindas</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={submitForm} disabled={!canSubmit}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remover usuário"
        description={<span>Tem certeza que deseja remover <b>{confirmUser?.username}</b>? Esta ação não pode ser desfeita.</span>}
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={confirmRemove}
        onCancel={() => setConfirmOpen(false)}
        variant="danger"
      />
    </div>
  );
}
