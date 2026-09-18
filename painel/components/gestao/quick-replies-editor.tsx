'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuickReplies, useQuickReplyMutations } from '@/hooks/use-quick-replies';
import { ApiError } from '@/lib/api/client';
import type { QuickReply } from '@/lib/types';
import { cn } from '@/lib/utils';

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Não foi possível concluir');
const VARS = '{{lead_first_name}}, {{lead_name}}, {{broker_first_name}}, {{broker_name}}, {{lead_interest}}';

export function QuickRepliesEditor() {
  const { data: replies = [], isLoading } = useQuickReplies();
  const { remove } = useQuickReplyMutations();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Atalhos digitados com <code className="text-xs">/</code> no chat. Globais valem para toda a equipe.
          Variáveis: <code className="text-xs">{VARS}</code>.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Nova resposta
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {replies.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma resposta rápida ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {replies.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card p-3 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <span className="font-mono text-sm">/{r.shortcut}</span>
                    <span className="text-foreground">{r.title}</span>
                    <Badge variant={r.global ? 'accent' : 'outline'}>{r.global ? 'Global' : 'Pessoal'}</Badge>
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button variant="ghost" size="icon" className="text-muted-foreground" title="Editar" onClick={() => setEditing(r)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" title="Excluir"
                    onClick={() => confirm(`Excluir a resposta "/${r.shortcut}"?`) && remove.mutate(r.id, { onError: (e) => setError(msg(e)) })}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {creating && <ReplyDialog onClose={() => setCreating(false)} onError={setError} />}
      {editing && <ReplyDialog reply={editing} onClose={() => setEditing(null)} onError={setError} />}
    </div>
  );
}

function ReplyDialog({ reply, onClose, onError }: { reply?: QuickReply; onClose: () => void; onError: (m: string | null) => void }) {
  const editMode = Boolean(reply);
  const { create, update } = useQuickReplyMutations();
  const [shortcut, setShortcut] = useState(reply?.shortcut ?? '');
  const [title, setTitle] = useState(reply?.title ?? '');
  const [body, setBody] = useState(reply?.body ?? '');
  const [global, setGlobal] = useState(reply?.global ?? true);
  const pending = create.isPending || update.isPending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    if (editMode && reply) {
      update.mutate({ id: reply.id, patch: { shortcut: shortcut.trim(), title: title.trim(), body } }, { onSuccess: onClose, onError: (er) => onError(msg(er)) });
    } else {
      create.mutate({ shortcut: shortcut.trim(), title: title.trim(), body, global }, { onSuccess: onClose, onError: (er) => onError(msg(er)) });
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Editar resposta rápida' : 'Nova resposta rápida'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="q-sc">Atalho</Label>
              <Input id="q-sc" value={shortcut} onChange={(e) => setShortcut(e.target.value)} placeholder="visita" pattern="[a-z0-9_-]{2,30}" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-title">Título</Label>
              <Input id="q-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Agendar visita" required minLength={2} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="q-body">Mensagem</Label>
            <textarea
              id="q-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              required
              placeholder="{{lead_first_name}}, aqui é {{broker_first_name}} da Norden. Podemos agendar uma visita?"
              className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[0.7rem] text-muted-foreground">Variáveis: {VARS}</p>
          </div>
          {!editMode && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={global} onChange={(e) => setGlobal(e.target.checked)} className="size-4" />
              Global (visível para toda a equipe)
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={pending || !shortcut.trim() || !title.trim() || !body.trim()}>
              {pending ? 'Salvando…' : editMode ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
