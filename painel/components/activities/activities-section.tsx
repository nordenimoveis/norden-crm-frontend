'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivityActions, useLeadActivities } from '@/hooks/use-activities';
import { ACTIVITY_META, dueInfo } from '@/lib/activity';
import type { Activity } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ActivityDialog } from './activity-dialog';

/** Seção "Atividades" dentro do painel do lead (vinculada ao negócio). */
export function ActivitiesSection({ leadId }: { leadId: string }) {
  const { data: activities = [], isLoading } = useLeadActivities(leadId);
  const { toggle } = useActivityActions(leadId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (a: Activity) => { setEditing(a); setOpen(true); };

  const pendentes = activities.filter((a) => !a.done);
  const feitas = activities.filter((a) => a.done);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm font-medium tracking-tight text-foreground">Atividades</h3>
        <Button size="sm" variant="outline" onClick={openNew}>
          <Plus className="size-4" /> Atividade
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma atividade. Agende a próxima ação com este cliente.</p>
      ) : (
        <ul className="space-y-1.5">
          {pendentes.map((a) => (
            <ActivityRow key={a.id} a={a} onToggle={() => toggle.mutate({ id: a.id, done: true })} onEdit={() => openEdit(a)} />
          ))}
          {feitas.map((a) => (
            <ActivityRow key={a.id} a={a} onToggle={() => toggle.mutate({ id: a.id, done: false })} onEdit={() => openEdit(a)} />
          ))}
        </ul>
      )}

      <ActivityDialog open={open} onOpenChange={setOpen} leadId={leadId} activity={editing} />
    </section>
  );
}

function ActivityRow({ a, onToggle, onEdit }: { a: Activity; onToggle: () => void; onEdit: () => void }) {
  const meta = ACTIVITY_META[a.type];
  const Icon = meta.icon;
  const due = dueInfo(a.dueAt, a.done);
  return (
    <li className={cn('flex items-center gap-2 rounded-md border border-border bg-card p-2', a.done && 'opacity-60')}>
      <button
        type="button"
        onClick={onToggle}
        title={a.done ? 'Reabrir' : 'Concluir'}
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
          a.done ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/40 hover:border-accent',
        )}
      >
        {a.done && <span className="text-[10px] leading-none">✓</span>}
      </button>
      <Icon className={cn('size-4 shrink-0', due.overdue ? 'text-destructive' : 'text-muted-foreground')} />
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className={cn('block truncate text-sm', a.done && 'line-through')}>{a.subject}</span>
        <span className={cn('block text-xs', due.overdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
          {meta.label} · {due.label}
        </span>
      </button>
    </li>
  );
}
