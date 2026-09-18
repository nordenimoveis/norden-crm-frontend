'use client';

import { useState } from 'react';
import { useReport } from '@/hooks/use-report';
import { useStages } from '@/hooks/use-pipeline';
import { SOURCE_LABELS, TEMPERATURE_LABELS, type Source, type Temperature } from '@/lib/types';
import { TEMP_DOT } from '@/lib/temperature';
import { cn } from '@/lib/utils';

const PERIODS = [7, 30, 90];
const CAD_STATUS: Record<string, string> = {
  PENDENTE: 'Agendados',
  PROCESSANDO: 'Processando',
  ENVIADO: 'Enviados',
  CANCELADO: 'Cancelados',
  FALHOU: 'Falharam',
};

export function ReportView() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useReport(days);
  const stages = useStages().data ?? [];
  const stageLabel = (key: string) => stages.find((s) => s.key === key)?.label ?? key;
  const roleKey = (role: string) => stages.find((s) => s.systemRole === role)?.key;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Período:</span>
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

      {isError && <p className="text-sm text-destructive">Não foi possível carregar o relatório.</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {data && (
        <>
          {(() => {
            const total = data.byStage.reduce((a, b) => a + b.total, 0);
            const wonKey = roleKey('WON');
            const lostKey = roleKey('LOST');
            const won = data.byStage.find((s) => s.stage === wonKey)?.total ?? 0;
            const lost = data.byStage.find((s) => s.stage === lostKey)?.total ?? 0;
            const responded = data.byBroker.reduce((a, b) => a + b.responded, 0);
            return (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Leads no período" value={total} />
                <Stat label="Responderam" value={responded} />
                <Stat label="Negócios fechados" value={won} accent />
                <Stat label="Perdidos" value={lost} />
              </div>
            );
          })()}

          <Section title="Funil">
            <BarList
              rows={data.byStage.map((s) => ({ label: stageLabel(s.stage), value: s.total }))}
              orderKeys={stages.map((s) => stageLabel(s.key))}
            />
          </Section>

          <div className="grid gap-6 sm:grid-cols-2">
            <Section title="Origens">
              <BarList rows={data.bySource.map((s) => ({ label: SOURCE_LABELS[s.source as Source] ?? s.source, value: s.total }))} />
            </Section>
            <Section title="Temperatura">
              <BarList
                rows={data.byTemperature.map((t) => ({
                  label: TEMPERATURE_LABELS[t.temperature as Temperature] ?? t.temperature,
                  value: t.total,
                  dot: TEMP_DOT[t.temperature as Temperature],
                }))}
              />
            </Section>
          </div>

          <Section title="Desempenho por corretor">
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
          </Section>

          <Section title="Saúde da régua">
            <BarList rows={data.cadence.map((c) => ({ label: CAD_STATUS[c.status] ?? c.status, value: c.total }))} />
          </Section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-card">
      <p className={cn('font-display text-2xl font-medium tabular-nums', accent && 'text-accent')}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function BarList({
  rows,
  orderKeys,
}: {
  rows: { label: string; value: number; dot?: string }[];
  orderKeys?: string[];
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  const ordered = orderKeys
    ? [...rows].sort((a, b) => orderKeys.indexOf(a.label) - orderKeys.indexOf(b.label))
    : [...rows].sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ul className="space-y-1.5">
      {ordered.map((r) => (
        <li key={r.label} className="flex items-center gap-3">
          <span className="flex w-40 shrink-0 items-center gap-1.5 truncate text-sm">
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
