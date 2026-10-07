'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarCheck } from 'lucide-react';
import { LeadPanel } from '@/components/lead-panel/lead-panel';
import { useActivityActions, useAgenda, useAgendaCounts } from '@/hooks/use-activities';
import { ACTIVITY_META, ACTIVITY_TYPES, dueInfo } from '@/lib/activity';
import type { AgendaFilter } from '@/lib/api/activities';
import type { Activity, ActivityType } from '@/lib/types';
import { cn } from '@/lib/utils';

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
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-accent/[0.1] text-accent">
          <CalendarCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Atividades</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sua agenda — cada atividade está vinculada a um negócio. Conclua com um clique ou abra o negócio.</p>
        </div>
      </div>

      {/* Filtros de situação */}
      <div className="mb-2 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => {
          const n = countFor(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors',
                filter === f.key ? 'border-accent bg-accent/10 font-medium text-foreground' : 'border-border text-muted-foreground hover:bg-muted/60',
              )}
            >
              {f.label}
              {n !== undefined && n > 0 && (
                <span className={cn('rounded-full px-1.5 text-[10px] font-semibold', f.key === 'vencido' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-foreground')}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtro por tipo */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <TypeChip active={type === null} onClick={() => setType(null)} label="Todos" />
        {ACTIVITY_TYPES.map((t) => (
          <TypeChip key={t.type} active={type === t.type} onClick={() => setType(type === t.type ? null : t.type)} label={t.label} Icon={t.icon} />
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nada por aqui neste filtro.</div>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <Row key={a.id} a={a} onToggle={() => toggle.mutate({ id: a.id, done: !a.done })} onOpen={() => openLead(a.leadId)} />
          ))}
        </ul>
      )}

      <LeadPanel leadId={openLeadId} onClose={closeLead} />
    </div>
  );
}

function TypeChip({ active, onClick, label, Icon }: { active: boolean; onClick: () => void; label: string; Icon?: (typeof ACTIVITY_TYPES)[number]['icon'] }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
        active ? 'border-accent bg-accent/10 font-medium text-foreground' : 'border-border text-muted-foreground hover:bg-muted',
      )}
    >
      {Icon && <Icon className="size-3.5" />} {label}
    </button>
  );
}

function Row({ a, onToggle, onOpen }: { a: Activity; onToggle: () => void; onOpen: () => void }) {
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
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className={cn('block truncate text-sm font-medium', a.done && 'line-through')}>{a.subject}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className={cn(due.overdue && 'font-medium text-destructive')}>{meta.label} · {due.label}</span>
          {a.leadName && <span className="truncate">· {a.leadName}</span>}
          {a.brokerName && <span className="truncate">· {a.brokerName}</span>}
        </span>
      </button>
    </li>
  );
}
