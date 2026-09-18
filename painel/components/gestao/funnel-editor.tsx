'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Lock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStages } from '@/hooks/use-pipeline';
import { ApiError } from '@/lib/api/client';
import { createStage, deleteStage, renameStage, reorderStages } from '@/lib/api/pipeline';
import type { PipelineStage } from '@/lib/types';

const ROLE_LABEL: Record<string, string> = {
  NEW: 'Entrada / régua',
  AWAITING: 'Aguardando',
  ACTIVE: 'Atendimento',
  WON: 'Ganho',
  COLD: 'Frio',
  LOST: 'Perdido',
};

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Não foi possível concluir');

export function FunnelEditor() {
  const qc = useQueryClient();
  const { data: stages = [], isLoading } = useStages();
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['pipeline', 'stages'] });
  const onErr = (e: unknown) => setError(msg(e));

  const createM = useMutation({ mutationFn: (label: string) => createStage(label), onSuccess: () => { setNewLabel(''); setError(null); invalidate(); }, onError: onErr });
  const renameM = useMutation({ mutationFn: (v: { id: string; label: string }) => renameStage(v.id, v.label), onSuccess: () => { setError(null); invalidate(); }, onError: onErr });
  const reorderM = useMutation({ mutationFn: (ids: string[]) => reorderStages(ids), onSuccess: () => { setError(null); invalidate(); }, onError: onErr });
  const deleteM = useMutation({ mutationFn: (id: string) => deleteStage(id), onSuccess: () => { setError(null); invalidate(); }, onError: onErr });

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= stages.length) return;
    const ids = stages.map((s) => s.id);
    [ids[index], ids[next]] = [ids[next]!, ids[index]!];
    reorderM.mutate(ids);
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        As etapas de <span className="font-medium text-foreground">sistema</span> podem ser renomeadas
        e reordenadas, mas não excluídas — elas fazem a régua e a perda funcionarem.
      </p>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {stages.map((stage, i) => (
          <StageRow
            key={stage.id}
            stage={stage}
            first={i === 0}
            last={i === stages.length - 1}
            onRename={(label) => renameM.mutate({ id: stage.id, label })}
            onUp={() => move(i, -1)}
            onDown={() => move(i, 1)}
            onDelete={() => {
              if (confirm(`Excluir a etapa "${stage.label}"?`)) deleteM.mutate(stage.id);
            }}
            busy={reorderM.isPending || deleteM.isPending}
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
          placeholder="Nova etapa (ex.: Reserva)"
          maxLength={40}
        />
        <Button type="submit" disabled={!newLabel.trim() || createM.isPending}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </form>
    </div>
  );
}

function StageRow({
  stage,
  first,
  last,
  onRename,
  onUp,
  onDown,
  onDelete,
  busy,
}: {
  stage: PipelineStage;
  first: boolean;
  last: boolean;
  onRename: (label: string) => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [draft, setDraft] = useState(stage.label);
  const dirty = draft.trim() !== stage.label && draft.trim().length > 0;

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-card">
      <div className="flex flex-col">
        <button type="button" onClick={onUp} disabled={first || busy} className="text-muted-foreground disabled:opacity-30" aria-label="Subir">
          <ChevronUp className="size-4" />
        </button>
        <button type="button" onClick={onDown} disabled={last || busy} className="text-muted-foreground disabled:opacity-30" aria-label="Descer">
          <ChevronDown className="size-4" />
        </button>
      </div>

      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => dirty && onRename(draft.trim())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        maxLength={40}
        className="h-9"
      />

      {stage.isSystem ? (
        <Badge variant="outline" className="shrink-0 gap-1">
          <Lock className="size-3" />
          {stage.systemRole ? ROLE_LABEL[stage.systemRole] ?? 'Sistema' : 'Sistema'}
        </Badge>
      ) : (
        <span className="w-16" />
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={stage.isSystem || busy}
        title={stage.isSystem ? 'Etapa de sistema não pode ser excluída' : 'Excluir etapa'}
        className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
