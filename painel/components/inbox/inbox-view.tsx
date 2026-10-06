'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownUp, ArrowRightCircle, Clock, Inbox, MessageSquare, ThumbsDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeadPanel } from '@/components/lead-panel/lead-panel';
import { TemperatureControl } from '@/components/kanban/temperature-control';
import {
  useLeads,
  useUpdateLead,
  usePromoteLead,
  useMarkRead,
  useRespondedCampaigns,
  useInboxStatusSummary,
  useTriageActions,
} from '@/hooks/use-leads';
import { useLossReasons } from '@/hooks/use-loss-reasons';
import type { InboxStatus } from '@/lib/api/leads';
import {
  SOURCE_LABELS,
  TEMPERATURES,
  TEMPERATURE_LABELS,
  type LeadSummary,
  type Source,
  type Temperature,
} from '@/lib/types';
import { TEMP_DOT } from '@/lib/temperature';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

/** Tempo relativo curto (agora, há X min/h/d). */
function rel(iso?: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - Date.parse(iso);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

const STATUS_ORDER: InboxStatus[] = ['NOVO', 'ACOMPANHANDO', 'SEM_INTERESSE', 'QUALIFICADO'];
const STATUS_LABEL: Record<InboxStatus, string> = {
  NOVO: 'Novos',
  ACOMPANHANDO: 'Acompanhando',
  SEM_INTERESSE: 'Sem interesse',
  QUALIFICADO: 'Qualificados',
};

/** Pílula genérica de filtro (campanha/status) com contagem e badge de não lidos. */
function Pill({
  active,
  onClick,
  label,
  total,
  unread,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  total?: number;
  unread?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors',
        active ? 'border-accent bg-accent/10 font-medium text-foreground' : 'border-border text-muted-foreground hover:bg-muted/60',
      )}
    >
      <span className="max-w-[12rem] truncate">{label}</span>
      {total !== undefined && <span className="text-muted-foreground">{total}</span>}
      {!!unread && unread > 0 && (
        <span className="grid min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

export function InboxView() {
  // Campanha: 'all' (todas), 'none' (sem campanha) ou o id. Status: estado de triagem.
  const [campaign, setCampaign] = useState<string>('all');
  const [status, setStatus] = useState<InboxStatus>('NOVO');
  const [temperature, setTemperature] = useState<Temperature | null>(null);
  const [order, setOrder] = useState<'recent' | 'waiting'>('recent');

  const campaignFilter = useMemo(
    () => ({
      ...(campaign !== 'all' && campaign !== 'none' ? { respondingCampaignId: campaign } : {}),
      ...(campaign === 'none' ? { respondingCampaign: 'none' as const } : {}),
    }),
    [campaign],
  );
  const filters = useMemo(
    () => ({ source: 'BASE_ANTIGA', responded: true, limit: 500, inboxStatus: status, ...campaignFilter }),
    [status, campaignFilter],
  );

  const { data: leads = [], isLoading } = useLeads(filters);
  const { data: campaignTabs = [] } = useRespondedCampaigns();
  const { data: statusCounts } = useInboxStatusSummary(campaignFilter);
  const update = useUpdateLead(filters);
  const promote = usePromoteLead();
  const markRead = useMarkRead();
  const { discard, follow } = useTriageActions();
  const { data: lossReasons = [] } = useLossReasons();
  const [error, setError] = useState<string | null>(null);
  const [discardLeadId, setDiscardLeadId] = useState<string | null>(null);

  const totalAll = useMemo(() => campaignTabs.reduce((s, c) => s + c.total, 0), [campaignTabs]);
  const unreadAll = useMemo(() => campaignTabs.reduce((s, c) => s + c.unread, 0), [campaignTabs]);
  const reasonLabel = (id?: string | null) => lossReasons.find((r) => r.id === id)?.label;

  const isUnread = (l: LeadSummary) =>
    Boolean(l.lastInboundAt) && (!l.lastReadAt || Date.parse(l.lastInboundAt!) > Date.parse(l.lastReadAt));

  const visible = useMemo(() => {
    const base = temperature ? leads.filter((l) => l.temperature === temperature) : leads;
    return [...base].sort((a, b) => {
      // Não lidos sempre primeiro.
      const u = (isUnread(b) ? 1 : 0) - (isUnread(a) ? 1 : 0);
      if (u !== 0) return u;
      const ta = a.lastInboundAt ? Date.parse(a.lastInboundAt) : 0;
      const tb = b.lastInboundAt ? Date.parse(b.lastInboundAt) : 0;
      // 'waiting' = aguardando há mais tempo (mais antigo primeiro); 'recent' = mais novo primeiro.
      return order === 'waiting' ? ta - tb : tb - ta;
    });
  }, [leads, temperature, order]);

  // Painel do lead via ?lead=
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openLeadId = params.get('lead');
  const openLead = useCallback(
    (id: string) => {
      markRead.mutate(id);
      router.push(`${pathname}?lead=${id}`, { scroll: false });
    },
    [router, pathname, markRead],
  );
  const closeLead = useCallback(() => router.push(pathname, { scroll: false }), [router, pathname]);

  const actionable = status === 'NOVO' || status === 'ACOMPANHANDO';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-accent/[0.1] text-accent">
          <Inbox className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Responderam</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Respostas de cada disparo. Triagem: <span className="font-medium text-foreground">Novos</span> → traga para o funil,
            marque <span className="font-medium text-foreground">Sem interesse</span> ou deixe em{' '}
            <span className="font-medium text-foreground">Acompanhando</span>.
          </p>
        </div>
      </div>

      {error && <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {/* Campanha (disparo) */}
      {campaignTabs.length > 0 && (
        <div className="mb-2 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Pill active={campaign === 'all'} onClick={() => setCampaign('all')} label="Todas" total={totalAll} unread={unreadAll} />
          {campaignTabs
            .filter((c) => c.campaignId)
            .map((c) => (
              <Pill
                key={c.campaignId}
                active={campaign === c.campaignId}
                onClick={() => setCampaign(c.campaignId as string)}
                label={c.campaignName ?? 'Campanha'}
                total={c.total}
                unread={c.unread}
              />
            ))}
          {campaignTabs.some((c) => !c.campaignId) && (
            <Pill
              active={campaign === 'none'}
              onClick={() => setCampaign('none')}
              label="Sem campanha"
              total={campaignTabs.find((c) => !c.campaignId)?.total ?? 0}
              unread={campaignTabs.find((c) => !c.campaignId)?.unread ?? 0}
            />
          )}
        </div>
      )}

      {/* Status de triagem */}
      <div className="mb-3 -mx-4 flex gap-1.5 overflow-x-auto border-t border-border px-4 pb-1 pt-3 sm:mx-0 sm:flex-wrap sm:px-0">
        {STATUS_ORDER.map((s) => (
          <Pill key={s} active={status === s} onClick={() => setStatus(s)} label={STATUS_LABEL[s]} total={statusCounts?.[s]} />
        ))}
      </div>

      {/* Temperatura + ordenação */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {TEMPERATURES.map((t) => {
            const active = temperature === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTemperature(active ? null : t)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  active ? 'border-foreground/20 bg-foreground/[0.06] text-foreground' : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                <span className={cn('size-2 rounded-full', TEMP_DOT[t])} />
                {TEMPERATURE_LABELS[t]}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setOrder((o) => (o === 'recent' ? 'waiting' : 'recent'))}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
          title="Alternar ordenação"
        >
          <ArrowDownUp className="size-3.5 text-muted-foreground" />
          {order === 'recent' ? 'Mais recentes' : 'Aguardando há mais tempo'}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {status === 'NOVO' ? 'Nada novo para triar aqui.' : `Nenhum lead em "${STATUS_LABEL[status]}".`}
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((l) => {
            const nova = isUnread(l);
            return (
              <li
                key={l.id}
                className={cn(
                  'rounded-xl border bg-card p-3 shadow-card transition-colors',
                  nova ? 'border-l-[3px] border-l-destructive border-border' : 'border-border',
                )}
              >
                <button type="button" onClick={() => openLead(l.id)} className="flex w-full items-start gap-2.5 text-left">
                  <span className={cn('mt-1 size-2.5 shrink-0 rounded-full', TEMP_DOT[l.temperature])} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={cn('min-w-0 truncate', nova ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>{l.name}</span>
                      {nova && (
                        <span className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-[18px] text-destructive-foreground">nova</span>
                      )}
                      <Badge variant="outline">{l.lastCampaignName ?? l.campaign ?? SOURCE_LABELS[l.source as Source]}</Badge>
                      {l.interest && (
                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">{l.interest}</span>
                      )}
                      {status === 'SEM_INTERESSE' && reasonLabel(l.lostReasonId) && (
                        <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {reasonLabel(l.lostReasonId)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {l.phone ?? '—'}
                      {l.lastInboundAt ? ` · respondeu ${rel(l.lastInboundAt)}` : ''}
                    </span>
                  </span>
                </button>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <TemperatureControl
                    value={l.temperature}
                    suggested={l.aiSuggestedTemperature}
                    onChange={(t: Temperature) => update.mutate({ id: l.id, patch: { temperature: t } })}
                  />
                  <div className="ml-auto flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="size-9" onClick={() => openLead(l.id)} title="Abrir conversa" aria-label="Abrir conversa">
                      <MessageSquare className="size-4" />
                    </Button>
                    {actionable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDiscardLeadId(l.id)}
                        title="Sem interesse — vai para Perdido com motivo"
                      >
                        <ThumbsDown className="size-4" />
                        <span className="hidden sm:inline">Sem interesse</span>
                      </Button>
                    )}
                    {status === 'NOVO' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => follow.mutate(l.id)}
                        disabled={follow.isPending}
                        title="Acompanhando — sai de Novos sem desfecho"
                      >
                        <Clock className="size-4" />
                        <span className="hidden sm:inline">Acompanhar</span>
                      </Button>
                    )}
                    {actionable && (
                      <Button
                        size="sm"
                        disabled={promote.isPending}
                        onClick={() =>
                          promote.mutate(l.id, {
                            onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível trazer para o funil'),
                          })
                        }
                        title="Atribui um corretor (roleta) e move para o funil de vendas"
                      >
                        <ArrowRightCircle className="size-4" />
                        <span className="hidden sm:inline">Trazer para o funil</span>
                        <span className="sm:hidden">Funil</span>
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DiscardDialog
        open={discardLeadId !== null}
        reasons={lossReasons.map((r) => ({ id: r.id, label: r.label }))}
        busy={discard.isPending}
        onCancel={() => setDiscardLeadId(null)}
        onConfirm={(lossReasonId) =>
          discard.mutate(
            { id: discardLeadId as string, lossReasonId },
            {
              onSuccess: () => setDiscardLeadId(null),
              onError: (e) => {
                setDiscardLeadId(null);
                setError(e instanceof ApiError ? e.message : 'Não foi possível marcar como sem interesse');
              },
            },
          )
        }
      />

      <LeadPanel leadId={openLeadId} onClose={closeLead} />
    </div>
  );
}

/** Diálogo para escolher o motivo ao marcar "Sem interesse". */
function DiscardDialog({
  open,
  reasons,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  reasons: { id: string; label: string }[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: (lossReasonId: string) => void;
}) {
  const [reasonId, setReasonId] = useState<string>('');
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsDown className="size-4 text-muted-foreground" /> Sem interesse
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          O lead sai da caixa e vai para <span className="font-medium text-foreground">Perdido</span> com o motivo abaixo.
          Continua na base para campanhas futuras.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReasonId(r.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                reasonId === r.id ? 'border-accent bg-accent/10 font-medium text-foreground' : 'border-border text-muted-foreground hover:bg-muted/60',
              )}
            >
              {r.label}
            </button>
          ))}
          {reasons.length === 0 && (
            <span className="text-xs text-muted-foreground">Cadastre motivos em Configurações → Motivos de perda.</span>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button disabled={!reasonId || busy} onClick={() => reasonId && onConfirm(reasonId)}>
            <ThumbsDown className="size-4" /> Marcar sem interesse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
