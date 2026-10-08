'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarCheck, ListChecks, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadPanel } from '@/components/lead-panel/lead-panel';
import { useActivityActions, useAgenda, useAgendaCounts } from '@/hooks/use-activities';
import { useCompleteTask } from '@/hooks/use-tasks';
import { ACTIVITY_META, ACTIVITY_TYPES, dueInfo } from '@/lib/activity';
import type { AgendaFilter, AgendaSource } from '@/lib/api/activities';
import type { AgendaItem, ActivityType } from '@/lib/types';
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
  const [source, setSource] = useState<AgendaSource | null>(null);
  const { data: items = [], isLoading } = useAgenda(filter, source === 'regua' ? null : type, source);
  const { data: counts } = useAgendaCounts();
  const { toggle } = useActivityActions();
  const completeTask = useCompleteTask();
  const [create, setCreate] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openLeadId = params.get('lead');
  const openLead = useCallback((id: string) => router.push(`${pathname}?lead=${id}`, { scroll: false }), [router, pathname]);
  const closeLead = useCallback(() => router.push(pathname, { scroll: false }), [router, pathname]);

  const countFor = (k: AgendaFilter) =>
    k === 'para_fazer' ? counts?.para_fazer : k === 'vencido' ? counts?.vencido : k === 'hoje' ? counts?.hoje : undefined;

  function complete(item: AgendaItem, outcome: 'FEITA' | 'SEM_RESPOSTA' = 'FEITA') {
    if (item.source === 'task') completeTask.mutate({ id: item.id, status: outcome });
    else toggle.mutate({ id: item.id, done: !item.done });
  }

  const pickType = (t: ActivityType) => { setSource(null); setType(type === t ? null : t); };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-accent/[0.1] text-accent">
            <CalendarCheck className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-tight">Atividades</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sua agenda — atividades e ligações da régua, cada uma vinculada a um negócio.</p>
          </div>
        </div>
        <Button onClick={() => setCreate(true)} className="shrink-0">
          <Plus className="size-4" /> <span className="hidden sm:inline">Atividade</span>
        </Button>
      </div>

      {/* Barra de filtros: tipos/fonte à esquerda, situação à direita */}
      <div className="mb-4 flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={type === null && source === null} onClick={() => { setType(null); setSource(null); }} label="Tudo" text />
          {ACTIVITY_TYPES.map((t) => (
            <Chip key={t.type} active={source === null && type === t.type} onClick={() => pickType(t.type)} label={t.label} Icon={t.icon} />
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
          <Chip active={source === 'regua'} onClick={() => { setType(null); setSource(source === 'regua' ? null : 'regua'); }} label="Régua" Icon={ListChecks} textWithIcon />
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
                className={cn('relative shrink-0 whitespace-nowrap pb-2 pt-1 transition-colors', active ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')}
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
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nada por aqui neste filtro. <button type="button" onClick={() => setCreate(true)} className="font-medium text-accent hover:underline">Agendar atividade</button>.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <Row key={`${a.source}-${a.id}`} a={a} onComplete={(o) => complete(a, o)} onOpen={() => openLead(a.leadId)} />
          ))}
        </ul>
      )}

      <ActivityDialog key={create ? 'create-open' : 'create-closed'} open={create} onOpenChange={setCreate} />
      <LeadPanel leadId={openLeadId} onClose={closeLead} />
    </div>
  );
}

function Chip({ active, onClick, label, Icon, text, textWithIcon }: { active: boolean; onClick: () => void; label: string; Icon?: (typeof ACTIVITY_TYPES)[number]['icon']; text?: boolean; textWithIcon?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 text-xs transition-colors',
        text ? 'min-w-[48px]' : textWithIcon ? '' : 'w-9',
        active ? 'border-accent bg-accent/10 text-accent' : 'border-transparent text-muted-foreground hover:bg-muted/60',
      )}
    >
      {Icon && <Icon className="size-4" />} {(text || textWithIcon) && label}
    </button>
  );
}

function Row({ a, onComplete, onOpen }: { a: AgendaItem; onComplete: (o?: 'FEITA' | 'SEM_RESPOSTA') => void; onOpen: () => void }) {
  const meta = ACTIVITY_META[a.type];
  const Icon = meta.icon;
  const due = dueInfo(a.dueAt, a.done);
  const outcomeLabel = a.outcome === 'SEM_RESPOSTA' ? 'Não atendeu' : a.outcome === 'FEITA' ? 'Falou' : null;
  return (
    <li className={cn('flex items-center gap-2.5 rounded-xl border bg-card p-3 shadow-card', a.done ? 'border-border opacity-60' : due.overdue ? 'border-l-[3px] border-l-destructive border-border' : 'border-border')}>
      <button
        type="button"
        onClick={() => onComplete('FEITA')}
        disabled={a.done}
        title={a.done ? 'Concluída' : 'Concluir'}
        className={cn('grid size-6 shrink-0 place-items-center rounded-full border transition-colors', a.done ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/40 hover:border-accent')}
      >
        {a.done && <span className="text-xs leading-none">✓</span>}
      </button>
      <Icon className={cn('size-4 shrink-0', due.overdue ? 'text-destructive' : 'text-muted-foreground')} />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className={cn('flex items-center gap-1.5 text-sm font-medium', a.done && 'line-through')}>
          <span className="truncate">{a.subject}</span>
          {a.automatic && <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">régua</span>}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className={cn(due.overdue && 'font-medium text-destructive')}>{meta.label} · {due.label}</span>
          {outcomeLabel && <span>· {outcomeLabel}</span>}
          {a.brokerName && <span className="truncate">· {a.brokerName}</span>}
        </span>
      </button>
      {/* Ligação da régua pendente: opção "Não atendeu" */}
      {a.source === 'task' && !a.done && (
        <button type="button" onClick={() => onComplete('SEM_RESPOSTA')} className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60" title="Não atendeu">
          Não atendeu
        </button>
      )}
      {a.leadName && (
        <button type="button" onClick={onOpen} title="Abrir negócio" className="hidden max-w-[10rem] shrink-0 truncate rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 sm:block">
          {a.leadName}
        </button>
      )}
    </li>
  );
}
