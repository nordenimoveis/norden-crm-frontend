'use client';

import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUsers, useUserMutations } from '@/hooks/use-users';
import { ApiError } from '@/lib/api/client';
import type { Role, User } from '@/lib/types';
import { cn } from '@/lib/utils';

const ROLES: { value: Role; label: string }[] = [
  { value: 'CORRETOR', label: 'Corretor' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DONO', label: 'Dono' },
];
const roleLabel = (r: Role) => ROLES.find((x) => x.value === r)?.label ?? r;
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Não foi possível concluir');

export function UsersEditor() {
  const { data: users = [], isLoading } = useUsers();
  const { update } = useUserMutations();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Corretores e gestores. A <span className="font-medium text-foreground">roleta</span> distribui
          novos leads entre os ativos que participam dela.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Novo usuário
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className={cn(
              'flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card',
              !u.active && 'opacity-60',
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                {u.name}
                <Badge variant="outline">{roleLabel(u.role)}</Badge>
                {!u.active && <Badge variant="alert">inativo</Badge>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>

            <div className="flex items-center gap-1.5">
              <Badge variant={u.chatwootConfigured ? 'accent' : 'outline'}>
                {u.chatwootConfigured ? 'Chatwoot ok' : 'sem Chatwoot'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update.mutate({ id: u.id, patch: { inRotation: !u.inRotation } }, { onError: (e) => setError(msg(e)) })}
                title="Participa da roleta"
                className={cn('gap-1', u.inRotation ? 'text-foreground' : 'text-muted-foreground')}
              >
                <RefreshCw className="size-4" />
                {u.inRotation ? 'Na roleta' : 'Fora'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => update.mutate({ id: u.id, patch: { active: !u.active } }, { onError: (e) => setError(msg(e)) })}
                title={u.active ? 'Desativar' : 'Ativar'}
                className="text-muted-foreground"
              >
                {u.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setEditing(u)} title="Editar" className="text-muted-foreground">
                <Pencil className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {creating && <UserDialog onClose={() => setCreating(false)} onError={setError} />}
      {editing && <UserDialog user={editing} onClose={() => setEditing(null)} onError={setError} />}
    </div>
  );
}

function UserDialog({
  user,
  onClose,
  onError,
}: {
  user?: User;
  onClose: () => void;
  onError: (m: string | null) => void;
}) {
  const editMode = Boolean(user);
  const { create, update } = useUserMutations();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(user?.role ?? 'CORRETOR');
  const [inRotation, setInRotation] = useState(user?.inRotation ?? true);
  const [agentId, setAgentId] = useState(user?.chatwootAgentId ? String(user.chatwootAgentId) : '');
  const [token, setToken] = useState('');
  const pending = create.isPending || update.isPending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    const chatwootAgentId = agentId.trim() ? Number(agentId.trim()) : null;
    if (editMode && user) {
      const patch: Record<string, unknown> = { name, role, inRotation };
      if (password.trim()) patch.password = password.trim();
      if (chatwootAgentId !== (user.chatwootAgentId ?? null)) patch.chatwootAgentId = chatwootAgentId;
      if (token.trim()) patch.chatwootToken = token.trim();
      update.mutate({ id: user.id, patch }, { onSuccess: onClose, onError: (er) => onError(msg(er)) });
    } else {
      create.mutate(
        {
          name,
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
          inRotation,
          chatwootAgentId,
          chatwootToken: token.trim() || null,
        },
        { onSuccess: onClose, onError: (er) => onError(msg(er)) },
      );
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Nome</Label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </div>
          {!editMode && (
            <div className="space-y-1.5">
              <Label htmlFor="u-email">E-mail</Label>
              <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="u-pass">{editMode ? 'Nova senha (opcional)' : 'Senha'}</Label>
            <Input
              id="u-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editMode}
              minLength={editMode ? 0 : 10}
              placeholder={editMode ? 'deixe em branco para manter' : 'mínimo 10 caracteres'}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-role">Papel</Label>
              <select
                id="u-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-end gap-2 pb-2.5 text-sm">
              <input type="checkbox" checked={inRotation} onChange={(e) => setInRotation(e.target.checked)} className="size-4" />
              Participa da roleta
            </label>
          </div>

          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Integração Chatwoot</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-agent">ID do agente</Label>
                <Input id="u-agent" inputMode="numeric" value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="ex.: 3" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-token">Token do agente</Label>
                <Input
                  id="u-token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={editMode ? 'manter' : 'token do Chatwoot'}
                />
              </div>
            </div>
            <p className="mt-2 text-[0.7rem] text-muted-foreground">
              Guardado criptografado. É o que faz a mensagem sair no nome do corretor.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Salvando…' : editMode ? 'Salvar' : 'Criar usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
