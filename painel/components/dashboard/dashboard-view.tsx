'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, KanbanSquare, ListChecks, Megaphone, TrendingUp, Upload, Users } from 'lucide-react';
import { useReport } from '@/hooks/use-report';
import { useStages } from '@/hooks/use-pipeline';
import { useTasks } from '@/hooks/use-tasks';
import { useSession } from '@/components/session-provider';
import { SOURCE_LABELS, TEMPERATURE_LABELS, type Source, type Temperature } from '@/lib/types';
import { TEMP_DOT } from '@/lib/temperature';
import { cn, firstName } from '@/lib/utils';

const PERIODS = [7, 30, 90];

export function DashboardView() {
  const user = useSession();
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useReport(days);
  const stages = useStages().data ?? [];
  const { data: tasks = [] } = useTasks();

  const stageLabel = (key: string) => stages.find((s) => s.key === key)?.label ?? key;
  const roleKey = (role: string) => stages.find((s) => s.systemRole === role)?.key;

  const total = data ? data.byStage.reduce((a, b) => a + b.total, 0) : 0;
  const responded = data ? data.byBroker.reduce((a, b) => a + b.responded, 0) : 0;
  const won = data ? data.byStage.find((s) => s.stage === roleKey('WON'))?.total ?? 0 : 0;
  const quente = data ? data.byTemperature.find((t) => t.temperature === 'QUENTE')?.total ?? 0 : 0;
  const respRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Olá, {firstName(user.name)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral do seu funil e do atendimento.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Período:</span>
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDays(p)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                days === p ? 'border-foreground/20 bg-foreground/[0.06] text-foreground' : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {p} dias
            </button>
          ))}
        </div>
      </div>

      {/* Atalhos rápidos */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <QuickLink href="/kanban" icon={KanbanSquare} label="Funil de vendas" />
        <QuickLink href="/tarefas" icon={ListChecks} label="Tarefas" badge={tasks.length} />
        <QuickLink href="/configuracoes/campanhas" icon={Megaphone} label="Campanhas" />
        <QuickLink href="/configuracoes/importar" icon={Upload} label="Importar base" />
      </div>

      {isError && <p className="mt-6 text-sm text-destructive">Não foi possível carregar os indicadores.</p>}
      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando indicadores…</p>}

      {data && (
        <>
          {/* KPIs */}
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Leads no período" value={total} icon={Users} />
            <Kpi label="Responderam" value={responded} hint={`${respRate}% do total`} icon={TrendingUp} />
            <Kpi label="Negócios fechados" value={won} icon={KanbanSquare} accent />
            <Kpi label="Leads quentes" value={quente} icon={Flame} />
          </div>

          {/* Funil + colunas */}
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <Card title="Funil" className="lg:col-span-2">
              <BarList
                rows={data.byStage.map((s) => ({ label: stageLabel(s.stage), value: s.total }))}
                orderKeys={stages.map((s) => stageLabel(s.key))}
              />
            </Card>
            <Card title="Temperatura">
              <BarList
                rows={data.byTemperature.map((t) => ({
                  label: TEMPERATURE_LABELS[t.temperature as Temperature] ?? t.temperature,
                  value: t.total,
                  dot: TEMP_DOT[t.temperature as Temperature],
                }))}
              />
            </Card>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <Card title="Origens">
              <BarList rows={data.bySource.map((s) => ({ label: SOURCE_LABELS[s.source as Source] ?? s.source, value: s.total }))} />
            </Card>

            <Card title="Desempenho por corretor" className="lg:col-span-2">
              {data.byBroker.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Corretor</th>
                        <th className="py-2 pr-3 text-right font-medium">Leads</th>
                        <th className="py-2 pr-3 text-right font-medium">Responderam</th>
                        <th className="py-2 text-right font-medium">Fechados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byBroker.map((b) => (
                        <tr key={b.brokerId} className="border-b border-border/60">
                          <td className="py-2 pr-3">{b.broker}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{b.total}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{b.responded}</td>
                          <td className="py-2 text-right tabular-nums">{b.closed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          <div className="mt-5">
            <Card title="Relatório completo" compact>
              <Link href="/configuracoes/relatorio" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
                Ver relatório detalhado <ArrowRight className="size-4" />
              </Link>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, badge }: { href: string; icon: typeof KanbanSquare; label: string; badge?: number }) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 shadow-card transition-colors hover:border-accent/40"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/[0.1] text-accent">
        <Icon className="size-[18px]" />
      </span>
      <span className="truncate text-sm font-medium">{label}</span>
      {!!badge && badge > 0 && (
        <span className="ml-auto grid min-w-[20px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-5 text-destructive-foreground">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

function Kpi({ label, value, hint, icon: Icon, accent }: { label: string; value: number; hint?: string; icon: typeof Users; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={cn('size-4', accent ? 'text-accent' : 'text-muted-foreground/60')} />
      </div>
      <p className={cn('mt-2 font-display text-3xl font-medium tabular-nums', accent && 'text-accent')}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Card({ title, children, className, compact }: { title: string; children: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-4 shadow-card', className)}>
      <h3 className={cn('text-xs font-semibold uppercase tracking-wide text-muted-foreground', !compact && 'mb-3')}>{title}</h3>
      {children}
    </section>
  );
}

function BarList({ rows, orderKeys }: { rows: { label: string; value: number; dot?: string }[]; orderKeys?: string[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  const ordered = orderKeys
    ? [...rows].sort((a, b) => orderKeys.indexOf(a.label) - orderKeys.indexOf(b.label))
    : [...rows].sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-1.5">
      {ordered.map((r) => (
        <li key={r.label} className="flex items-center gap-3">
          <span className="flex w-36 shrink-0 items-center gap-1.5 truncate text-sm">
            {r.dot && <span className={cn('size-2 rounded-full', r.dot)} />}
            {r.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-accent/35" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
