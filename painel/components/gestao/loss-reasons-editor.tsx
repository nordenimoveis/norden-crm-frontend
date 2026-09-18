'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLossReasons } from '@/hooks/use-loss-reasons';
import { ApiError } from '@/lib/api/client';
import { createLossReason, deleteLossReason, updateLossReason } from '@/lib/api/loss-reasons';
import type { LossReason } from '@/lib/types';
import { cn } from '@/lib/utils';

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Não foi possível concluir');

export function LossReasonsEditor() {
  const qc = useQueryClient();
  const { data: reasons = [], isLoading } = useLossReasons();
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['loss-reasons'] });
  const onErr = (e: unknown) => setError(msg(e));

  const createM = useMutation({ mutationFn: (label: string) => createLossReason(label), onSuccess: () => { setNewLabel(''); setError(null); invalidate(); }, onError: onErr });
  const updateM = useMutation({ mutationFn: (v: { id: string; patch: { label?: string; active?: boolean } }) => updateLossReason(v.id, v.patch), onSuccess: () => { setError(null); invalidate(); }, onError: onErr });
  const deleteM = useMutation({ mutationFn: (id: string) => deleteLossReason(id), onSuccess: () => { setError(null); invalidate(); }, onError: onErr });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Motivos oferecidos ao marcar um lead como <span className="font-medium text-foreground">Perdido</span>.
        Desative um motivo para escondê-lo sem perder o histórico.
      </p>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {reasons.map((r) => (
          <ReasonRow
            key={r.id}
            reason={r}
            onRename={(label) => updateM.mutate({ id: r.id, patch: { label } })}
            onToggle={() => updateM.mutate({ id: r.id, patch: { active: !r.active } })}
            onDelete={() => {
              if (confirm(`Excluir o motivo "${r.label}"?`)) deleteM.mutate(r.id);
            }}
            busy={updateM.isPending || deleteM.isPending}
          />
        ))}
      </ul>

      <form
        className="flex gap-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (newLabel.trim()) createM.mutate(newLabel.trim());
        }}
      >
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Novo motivo (ex.: Comprou na planta)"
          maxLength={60}
        />
        <Button type="submit" disabled={!newLabel.trim() || createM.isPending}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </form>
    </div>
  );
}

function ReasonRow({
  reason,
  onRename,
  onToggle,
  onDelete,
  busy,
}: {
  reason: LossReason;
  onRename: (label: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [draft, setDraft] = useState(reason.label);
  const dirty = draft.trim() !== reason.label && draft.trim().length > 0;

  return (
    <li className={cn('flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-card', !reason.active && 'opacity-60')}>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => dirty && onRename(draft.trim())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        maxLength={60}
        className="h-9"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        disabled={busy}
        title={reason.active ? 'Desativar' : 'Ativar'}
        className="shrink-0 text-muted-foreground"
      >
        {reason.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={busy}
        title="Excluir motivo"
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
