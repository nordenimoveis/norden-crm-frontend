'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useActivityActions } from '@/hooks/use-activities';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ACTIVITY_TYPES } from '@/lib/activity';
import { getLeads } from '@/lib/api/leads';
import { ApiError } from '@/lib/api/client';
import type { Activity, ActivityType } from '@/lib/types';
import { cn } from '@/lib/utils';

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ActivityDialog({
  open,
  onOpenChange,
  leadId: fixedLeadId,
  leadName,
  activity,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Negócio fixo (quando aberto de dentro do lead). Sem ele, mostra o seletor. */
  leadId?: string;
  leadName?: string;
  activity?: Activity | null;
}) {
  const editing = Boolean(activity);
  const { create, update, remove } = useActivityActions(fixedLeadId ?? activity?.leadId);
  const [type, setType] = useState<ActivityType>(activity?.type ?? 'LIGACAO');
  const [subject, setSubject] = useState(activity?.subject ?? '');
  const [due, setDue] = useState(toLocalInput(activity?.dueAt ?? null));
  const [notes, setNotes] = useState(activity?.notes ?? '');
  const [lead, setLead] = useState<{ id: string; name: string } | null>(
    fixedLeadId ? { id: fixedLeadId, name: leadName ?? '' } : activity ? { id: activity.leadId, name: activity.leadName ?? '' } : null,
  );
  const [error, setError] = useState<string | null>(null);

  const pending = create.isPending || update.isPending;
  const needsLead = !fixedLeadId && !editing;

  function submit() {
    const s = subject.trim();
    if (!s) return;
    if (needsLead && !lead) { setError('Escolha o negócio.'); return; }
    setError(null);
    const dueAt = due ? new Date(due).toISOString() : null;
    const payload = { type, subject: s, notes: notes.trim() || null, dueAt };
    const onErr = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Não foi possível salvar');
    const done = () => onOpenChange(false);
    if (editing && activity) update.mutate({ id: activity.id, patch: payload }, { onSuccess: done, onError: onErr });
    else create.mutate({ leadId: lead!.id, ...payload }, { onSuccess: done, onError: onErr });
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

        {/* Negócio vinculado */}
        {needsLead ? (
          <LeadPicker value={lead} onChange={setLead} />
        ) : (
          lead?.name && (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              Negócio: <span className="font-medium text-foreground">{lead.name}</span>
            </div>
          )
        )}

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

/** Busca e seleciona o negócio (lead) a vincular. */
function LeadPicker({ value, onChange }: { value: { id: string; name: string } | null; onChange: (v: { id: string; name: string } | null) => void }) {
  const [q, setQ] = useState('');
  const query = useDebouncedValue(q, 300);
  const { data: results = [] } = useQuery({
    queryKey: ['lead-search', query],
    queryFn: () => getLeads({ q: query, limit: 8, includeOld: true }),
    enabled: query.trim().length >= 2,
  });

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-accent/40 bg-accent/[0.06] px-3 py-2 text-sm">
        <span className="truncate">Negócio: <span className="font-medium text-foreground">{value.name || value.id}</span></span>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onChange(null)}>trocar</button>
      </div>
    );
  }
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar negócio por nome ou telefone…" className="pl-9" />
      </div>
      {query.trim().length >= 2 && (
        <ul className="mt-1 max-h-44 overflow-y-auto rounded-md border border-border">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum negócio encontrado.</li>
          ) : (
            results.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onChange({ id: l.id, name: l.name })}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
                >
                  <span className="min-w-0 truncate">{l.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{l.phone ?? ''}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
