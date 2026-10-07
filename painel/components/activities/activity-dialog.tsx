'use client';

import { useState } from 'react';
import { CalendarClock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useActivityActions } from '@/hooks/use-activities';
import { ACTIVITY_TYPES } from '@/lib/activity';
import { ApiError } from '@/lib/api/client';
import type { Activity, ActivityType } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Converte ISO -> valor do input datetime-local (hora local). */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ActivityDialog({
  open,
  onOpenChange,
  leadId,
  activity,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  /** Quando presente, edita; senão, cria. */
  activity?: Activity | null;
}) {
  const editing = Boolean(activity);
  const { create, update, remove } = useActivityActions(leadId);
  const [type, setType] = useState<ActivityType>(activity?.type ?? 'LIGACAO');
  const [subject, setSubject] = useState(activity?.subject ?? '');
  const [due, setDue] = useState(toLocalInput(activity?.dueAt ?? null));
  const [notes, setNotes] = useState(activity?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const pending = create.isPending || update.isPending;

  function submit() {
    const s = subject.trim();
    if (!s) return;
    setError(null);
    const dueAt = due ? new Date(due).toISOString() : null;
    const payload = { type, subject: s, notes: notes.trim() || null, dueAt };
    const onErr = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Não foi possível salvar');
    const done = () => onOpenChange(false);
    if (editing && activity) update.mutate({ id: activity.id, patch: payload }, { onSuccess: done, onError: onErr });
    else create.mutate({ leadId, ...payload }, { onSuccess: done, onError: onErr });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-accent" /> {editing ? 'Editar atividade' : 'Agendar atividade'}
          </DialogTitle>
        </DialogHeader>

        <Input autoFocus value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} placeholder="Assunto (ex.: Ligar para confirmar visita)" />

        {/* Linha de tipos (ícones) */}
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.type;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => setType(t.type)}
                title={t.label}
                className={cn(
                  'inline-flex size-9 items-center justify-center rounded-md border transition-colors',
                  active ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:bg-muted/60',
                )}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
        <p className="-mt-1 text-xs text-muted-foreground">{ACTIVITY_TYPES.find((t) => t.type === type)?.label}</p>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Data e hora (opcional)</span>
          <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Notas (opcional)"
          className="w-full resize-none rounded-md border border-input bg-card p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <DialogFooter className="items-center">
          {editing && activity && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-auto text-muted-foreground hover:text-destructive"
              title="Excluir atividade"
              onClick={() => remove.mutate(activity.id, { onSuccess: () => onOpenChange(false) })}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!subject.trim() || pending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
