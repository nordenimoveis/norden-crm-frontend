'use client';

import { useEffect, useState } from 'react';
import { ArrowRightLeft, Ban, Check, ChevronDown, PanelRightClose, PanelRightOpen, Sparkles } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TemperatureControl } from '@/components/kanban/temperature-control';
import { LossReasonDialog } from '@/components/kanban/loss-reason-dialog';
import { ChatView } from '@/components/lead-panel/chat/chat-view';
import { useDraft, useUnread } from '@/components/realtime-provider';
import { useLeadDetail, useLeadActions } from '@/hooks/use-lead-detail';
import { useStages } from '@/hooks/use-pipeline';
import { useBrokers } from '@/hooks/use-brokers';
import { useLossReasons } from '@/hooks/use-loss-reasons';
import { useSession } from '@/components/session-provider';
import {
  SOURCE_LABELS,
  TEMPERATURE_LABELS,
  isManager,
  type LeadSummary,
  type Temperature,
} from '@/lib/types';
import { cn, formatDate, formatDateTime, initials } from '@/lib/utils';

const CAD_STATUS: Record<string, string> = {
  PENDENTE: 'Agendado',
  PROCESSANDO: 'Processando',
  ENVIADO: 'Enviado',
  CANCELADO: 'Cancelado',
  FALHOU: 'Falhou',
};

const EVENT_LABEL: Record<string, string> = {
  'lead.created': 'Lead criado',
  'lead.reentry': 'Lead reentrou',
  'lead.updated': 'Lead atualizado',
  'lead.assigned': 'Lead atribuído',
  'lead.transferred': 'Transferência de corretor',
  'cadence.scheduled': 'Cadência agendada',
  'cadence.sent': 'Cadência enviada',
  'cadence.simulated': 'Cadência (simulada)',
  'cadence.cancelled': 'Cadência cancelada',
  'cadence.failed': 'Falha na cadência',
  'cadence.finished': 'Cadência concluída',
  'template.sent': 'Template enviado',
  'template.simulated': 'Template (simulado)',
  'campaign.sent': 'Campanha enviada',
  'campaign.simulated': 'Campanha (simulada)',
  'message.outbound': 'Mensagem enviada',
  'message.inbound': 'Mensagem recebida',
  'note.created': 'Nota interna',
  'ai.suggestion': 'Sugestão da IA',
  entrada: 'Mensagem do cliente',
};

export function LeadPanel({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  return (
    <Sheet open={Boolean(leadId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent title="Detalhes do lead" size="wide" className="p-0">
        {leadId ? <PanelBody leadId={leadId} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function PanelBody({ leadId }: { leadId: string }) {
  const user = useSession();
  const manager = isManager(user.role);
  const { data, isLoading, isError } = useLeadDetail(leadId);
  const { patch, transfer, acceptAi } = useLeadActions(leadId);
  const stagesQuery = useStages();
  const brokersQuery = useBrokers(manager);
  const reasonsQuery = useLossReasons();
  const [lostPending, setLostPending] = useState<LeadSummary | null>(null);
  // No celular, alterna entre Conversa e Resumo; no desktop as duas colunas aparecem juntas.
  const [tab, setTab] = useState<'resumo' | 'conversa'>('conversa');
  // No desktop, permite recolher a coluna de contexto para a conversa ocupar tudo.
  const [contextOpen, setContextOpen] = useState(true);
  const { draft, clearDraft } = useDraft(leadId);
  const { markRead } = useUnread();
  // Abrir o lead zera o contador de não lidas dele.
  useEffect(() => markRead(leadId), [leadId, markRead]);

  if (isLoading) return <PanelSkeleton />;
  if (isError || !data) {
    return <div className="p-6 text-sm text-destructive">Não foi possível carregar o lead.</div>;
  }

  const lead = data.lead;
  const stages = stagesQuery.data ?? [];
  const stage = stages.find((s) => s.key === lead.stage);
  const lostStageKey = stages.find((s) => s.systemRole === 'LOST')?.key;
  const isLost = stage?.systemRole === 'LOST';
  const reasonLabel = lead.lostReasonId
    ? (reasonsQuery.data ?? []).find((r) => r.id === lead.lostReasonId)?.label
    : null;

  function changeStage(key: string) {
    const target = stages.find((s) => s.key === key);
    if (!target || target.key === lead.stage) return;
    if (target.systemRole === 'LOST') setLostPending(lead);
    else patch.mutate({ stage: key });
  }

  const canAcceptAi = lead.aiSuggestedTemperature && lead.aiSuggestedTemperature !== lead.temperature;

  return (
    <div className="flex h-full flex-col">
      {/* Cabeçalho compacto (uma linha; enrola no celular). pr-12 reserva o espaço do X de fechar. */}
      <div className="border-b border-border py-2.5 pl-3 pr-12 sm:pl-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          {/* Avatar com as iniciais do contato */}
          <div
            className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent/85 to-accent text-sm font-semibold text-accent-foreground"
            aria-hidden
          >
            {initials(lead.name)}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-base font-medium leading-tight tracking-tight">{lead.name}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {SOURCE_LABELS[lead.source]}
              {lead.brokerName ? ` · ${lead.brokerName}` : ''}
            </p>
          </div>

          {/* Etapa (pill dropdown) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted"
              >
                {stage?.label ?? lead.stage}
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
              <DropdownMenuLabel>Mover para etapa</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={lead.stage} onValueChange={changeStage}>
                {stages.map((s) => (
                  <DropdownMenuRadioItem key={s.key} value={s.key}>
                    {s.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <TemperatureControl
            value={lead.temperature}
            suggested={lead.aiSuggestedTemperature}
            onChange={(t: Temperature) => patch.mutate({ temperature: t })}
          />

          {/* Recolher/expandir a coluna de detalhes (só no desktop). */}
          <button
            type="button"
            onClick={() => setContextOpen((v) => !v)}
            className="hidden size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:grid"
            title={contextOpen ? 'Ocultar detalhes' : 'Mostrar detalhes'}
            aria-label={contextOpen ? 'Ocultar detalhes' : 'Mostrar detalhes'}
          >
            {contextOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          </button>
        </div>

        {isLost && (
          <div className="mt-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
            <span className="font-medium">Perdido</span>
            {reasonLabel ? ` · ${reasonLabel}` : ''}
            {lead.lostAt ? <span className="text-muted-foreground"> · {formatDate(lead.lostAt)}</span> : null}
          </div>
        )}
      </div>

      {/* Abas — só no celular (no desktop as duas colunas aparecem juntas) */}
      <div className="flex gap-1 border-b border-border px-4 md:hidden">
        <TabButton active={tab === 'conversa'} onClick={() => setTab('conversa')}>
          Conversa
        </TabButton>
        <TabButton active={tab === 'resumo'} onClick={() => setTab('resumo')}>
          Resumo
        </TabButton>
      </div>

      {/* Corpo: duas colunas no desktop; uma aba por vez no celular */}
      <div className="flex min-h-0 flex-1">
        {/* Conversa */}
        <div className={cn('min-h-0 min-w-0 flex-1 flex-col', tab === 'conversa' ? 'flex' : 'hidden', 'md:flex')}>
          <ChatView leadId={leadId} draft={draft} onUsedDraft={clearDraft} />
        </div>

        {/* Contexto do lead (recolhível no desktop) */}
        <aside
          className={cn(
            'min-h-0 flex-1 flex-col',
            tab === 'resumo' ? 'flex' : 'hidden',
            contextOpen ? 'md:flex' : 'md:hidden',
            'md:w-[350px] md:flex-none md:shrink-0 md:border-l md:border-border',
          )}
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        {/* Sugestão da IA */}
        <Section title="Sugestão da IA" icon={<Sparkles className="size-4 text-accent" />}>
          {lead.aiSummary || lead.aiSuggestedTemperature ? (
            <div className="space-y-3">
              {lead.aiSummary && <p className="text-sm leading-relaxed">{lead.aiSummary}</p>}
              {lead.aiSuggestedTemperature && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2.5">
                  <span className="text-sm">
                    Temperatura sugerida:{' '}
                    <span className="font-medium">{TEMPERATURE_LABELS[lead.aiSuggestedTemperature]}</span>
                  </span>
                  {canAcceptAi ? (
                    <Button size="sm" variant="accent" onClick={() => acceptAi.mutate()} disabled={acceptAi.isPending}>
                      <Check className="size-4" /> Aceitar
                    </Button>
                  ) : (
                    <Badge variant="outline">aplicada</Badge>
                  )}
                </div>
              )}
              {lead.aiUpdatedAt && (
                <p className="text-xs text-muted-foreground">Atualizada em {formatDateTime(lead.aiUpdatedAt)}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem sugestão da IA ainda.</p>
          )}
        </Section>

        {/* Dados */}
        <Section title="Dados">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            <Field label="Telefone" value={lead.phone} />
            <Field label="E-mail" value={lead.email} />
            <Field label="Interesse" value={lead.interest} />
            <Field label="Campanha" value={lead.campaign} />
            <Field label="Criado" value={formatDate(lead.createdAt)} />
            <Field label="Atualizado" value={formatDateTime(lead.updatedAt)} />
          </dl>
          {lead.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {lead.tags.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          {lead.notes && (
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/50 p-2.5 text-sm">{lead.notes}</p>
          )}
        </Section>

        {/* Régua */}
        <Section title="Régua de cadência">
          {data.cadence.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem régua para este lead.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.cadence.map((c) => (
                <li key={c.step} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    Passo {c.step}
                    <span className="ml-2 text-muted-foreground">{CAD_STATUS[c.status] ?? c.status}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.sentAt ? `enviado ${formatDateTime(c.sentAt)}` : c.scheduledFor ? formatDateTime(c.scheduledFor) : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Linha do tempo */}
        <Section title="Linha do tempo">
          {data.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
          ) : (
            <ol className="space-y-3">
              {data.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />
                  <div className="min-w-0">
                    <p className="text-sm">{EVENT_LABEL[e.type] ?? e.type}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Section>
          </div>

          {/* Ações — barra clean no rodapé do contexto */}
          <div className="flex items-center gap-1 border-t border-border p-3">
            {manager && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowRightLeft className="size-4" /> Transferir
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                  <DropdownMenuLabel>Transferir para</DropdownMenuLabel>
                  {(brokersQuery.data ?? [])
                    .filter((b) => b.id !== lead.brokerId)
                    .map((b) => (
                      <DropdownMenuItem key={b.id} onSelect={() => transfer.mutate(b.id)}>
                        {b.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!isLost && (
              <button
                type="button"
                onClick={() => setLostPending(lead)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Ban className="size-4" /> Marcar perdido
              </button>
            )}
          </div>
        </aside>
      </div>

      <LossReasonDialog
        lead={lostPending}
        onConfirm={(reasonId) => {
          if (lostStageKey) patch.mutate({ stage: lostStageKey, lossReasonId: reasonId });
          setLostPending(null);
        }}
        onCancel={() => setLostPending(null)}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ' +
        (active ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')
      }
    >
      {children}
    </button>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate">{value || '—'}</dd>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
