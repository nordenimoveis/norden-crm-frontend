'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadPanel } from '@/components/lead-panel/lead-panel';
import { useActivityActions, useAgenda, useAgendaCounts } from '@/hooks/use-activities';
import { ACTIVITY_META, ACTIVITY_TYPES, dueInfo } from '@/lib/activity';
import type { AgendaFilter } from '@/lib/api/activities';
import type { Activity, ActivityType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ActivityDialog } from './activity-dialog';

const FILTERS: { key: AgendaFilter; label: string }[] = [
  { key: 'para_fazer', label: 'Para fazer' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'vencido', label: 'Vencido' },
  { key: 'concluido', label: 'Concluído' },
  { key: 'todas', label: 'Todas' },
];

export function ActivitiesView() {
  const [filter, setFilter] = useState<AgendaFilter>('para_fazer');
  const [type, setType] = useState<ActivityType | null>(null);
  const { data: activities = [], isLoading } = useAgenda(filter, type);
  const { data: counts } = useAgendaCounts();
  const { toggle } = useActivityActions();
  const [create, setCreate] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openLeadId = params.get('lead');
  const openLead = useCallback((id: string) => router.push(`${pathname}?lead=${id}`, { scroll: false }), [router, pathname]);
  const closeLead = useCallback(() => router.push(pathname, { scroll: false }), [router, pathname]);

  const countFor = (k: AgendaFilter) =>
    k === 'para_fazer' ? counts?.para_fazer : k === 'vencido' ? counts?.vencido : k === 'hoje' ? counts?.hoje : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      {/* Cabeçalho + ação principal */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-accent/[0.1] text-accent">
            <CalendarCheck className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Atividades</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sua agenda — cada atividade vinculada a um negócio.</p>
          </div>
        </div>
        <Button onClick={() => setCreate(true)} className="shrink-0">
          <Plus className="size-4" /> <span className="hidden sm:inline">Atividade</span>
        </Button>
      </div>

      {/* Barra de filtros estilo Pipedrive: tipos (ícones) à esquerda, situação à direita */}
      <div className="mb-4 flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TypeIcon active={type === null} onClick={() => setType(null)} label="Tudo" text />
          {ACTIVITY_TYPES.map((t) => (
            <TypeIcon key={t.type} active={type === t.type} onClick={() => setType(type === t.type ? null : t.type)} label={t.label} Icon={t.icon} />
          ))}
        </div>
        <div className="-mx-4 flex items-center gap-4 overflow-x-auto px-4 text-sm sm:mx-0 sm:px-0">
          {FILTERS.map((f) => {
            const n = countFor(f.key);
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'relative shrink-0 whitespace-nowrap pb-2 pt-1 transition-colors',
                  active ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
                {n !== undefined && n > 0 && (
                  <span className={cn('ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', f.key === 'vencido' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-foreground')}>{n}</span>
                )}
                {active && <span className="absolute inset-x-0 -bottom-[13px] h-[2px] rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nada por aqui neste filtro. <button type="button" onClick={() => setCreate(true)} className="font-medium text-accent hover:underline">Agendar atividade</button>.
        </div>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <Row key={a.id} a={a} onToggle={() => toggle.mutate({ id: a.id, done: !a.done })} onOpen={() => openLead(a.leadId)} onEdit={() => setEditing(a)} />
          ))}
        </ul>
      )}

      {/* Criar (com seletor de negócio) e editar */}
      <ActivityDialog key={create ? 'create-open' : 'create-closed'} open={create} onOpenChange={setCreate} />
      <ActivityDialog key={editing?.id ?? 'edit-closed'} open={editing !== null} onOpenChange={(v) => !v && setEditing(null)} activity={editing} />

      <LeadPanel leadId={openLeadId} onClose={closeLead} />
    </div>
  );
}

function TypeIcon({ active, onClick, label, Icon, text }: { active: boolean; onClick: () => void; label: string; Icon?: (typeof ACTIVITY_TYPES)[number]['icon']; text?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 text-xs transition-colors',
        text ? 'min-w-[48px]' : 'w-9',
        active ? 'border-accent bg-accent/10 text-accent' : 'border-transparent text-muted-foreground hover:bg-muted/60',
      )}
    >
      {Icon ? <Icon className="size-4" /> : label}
    </button>
  );
}

function Row({ a, onToggle, onOpen, onEdit }: { a: Activity; onToggle: () => void; onOpen: () => void; onEdit: () => void }) {
  const meta = ACTIVITY_META[a.type];
  const Icon = meta.icon;
  const due = dueInfo(a.dueAt, a.done);
  return (
    <li className={cn('flex items-center gap-2.5 rounded-xl border bg-card p-3 shadow-card', a.done ? 'border-border opacity-60' : due.overdue ? 'border-l-[3px] border-l-destructive border-border' : 'border-border')}>
      <button
        type="button"
        onClick={onToggle}
        title={a.done ? 'Reabrir' : 'Concluir'}
        className={cn('grid size-6 shrink-0 place-items-center rounded-full border transition-colors', a.done ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/40 hover:border-accent')}
      >
        {a.done && <span className="text-xs leading-none">✓</span>}
      </button>
      <Icon className={cn('size-4 shrink-0', due.overdue ? 'text-destructive' : 'text-muted-foreground')} />
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <span className={cn('block truncate text-sm font-medium', a.done && 'line-through')}>{a.subject}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className={cn(due.overdue && 'font-medium text-destructive')}>{meta.label} · {due.label}</span>
          {a.brokerName && <span className="truncate">· {a.brokerName}</span>}
        </span>
      </button>
      {a.leadName && (
        <button type="button" onClick={onOpen} title="Abrir negócio" className="shrink-0 truncate rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 max-w-[10rem]">
          {a.leadName}
        </button>
      )}
    </li>
  );
}
