'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRightCircle, Inbox, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeadPanel } from '@/components/lead-panel/lead-panel';
import { TemperatureControl } from '@/components/kanban/temperature-control';
import { useLeads, useUpdateLead, usePromoteLead, useMarkRead, useRespondedCampaigns } from '@/hooks/use-leads';
import { SOURCE_LABELS, type LeadSummary, type Source, type Temperature } from '@/lib/types';
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

/** Aba de campanha no topo da caixa "Responderam". */
function CampaignTab({
  active,
  onClick,
  label,
  total,
  unread,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  total: number;
  unread: number;
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
      <span className="text-muted-foreground">{total}</span>
      {unread > 0 && (
        <span className="grid min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

export function InboxView() {
  // Seletor de campanha: 'all' (todas), 'none' (sem campanha) ou o id da campanha.
  const [campaign, setCampaign] = useState<string>('all');
  const filters = useMemo(
    () => ({
      source: 'BASE_ANTIGA',
      responded: true,
      limit: 500,
      ...(campaign !== 'all' && campaign !== 'none' ? { respondingCampaignId: campaign } : {}),
      ...(campaign === 'none' ? { respondingCampaign: 'none' as const } : {}),
    }),
    [campaign],
  );
  const { data: leads = [], isLoading } = useLeads(filters);
  const { data: campaignTabs = [] } = useRespondedCampaigns();
  const update = useUpdateLead(filters);
  const promote = usePromoteLead();
  const markRead = useMarkRead();
  const [error, setError] = useState<string | null>(null);

  const totalAll = useMemo(() => campaignTabs.reduce((s, c) => s + c.total, 0), [campaignTabs]);
  const unreadAll = useMemo(() => campaignTabs.reduce((s, c) => s + c.unread, 0), [campaignTabs]);

  // "Não lido" vem do servidor (persistente): o cliente respondeu depois da
  // última vez que a conversa foi aberta (ou nunca foi aberta).
  const isUnread = (l: LeadSummary) =>
    Boolean(l.lastInboundAt) && (!l.lastReadAt || Date.parse(l.lastInboundAt!) > Date.parse(l.lastReadAt));

  // Ordena: não lidos primeiro; depois pela última resposta do CLIENTE
  // (responder não sobe o lead — só uma nova resposta do cliente sobe).
  const sorted = useMemo(() => {
    return [...leads].sort((a, b) => {
      const diff = (isUnread(b) ? 1 : 0) - (isUnread(a) ? 1 : 0);
      if (diff !== 0) return diff;
      return (b.lastInboundAt ? Date.parse(b.lastInboundAt) : 0) - (a.lastInboundAt ? Date.parse(a.lastInboundAt) : 0);
    });
  }, [leads]);

  const novas = useMemo(() => leads.filter(isUnread).length, [leads]);

  // Painel do lead via ?lead=
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openLeadId = params.get('lead');
  const openLead = useCallback(
    (id: string) => {
      markRead.mutate(id); // marca como lida no servidor (persistente)
      router.push(`${pathname}?lead=${id}`, { scroll: false });
    },
    [router, pathname, markRead],
  );
  const closeLead = useCallback(() => router.push(pathname, { scroll: false }), [router, pathname]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-accent/[0.1] text-accent">
          <Inbox className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Responderam</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leads de campanha que responderam e ainda não estão no funil. Em <span className="font-medium text-foreground">negrito</span> = resposta nova. Defina a temperatura como status e, quando quiser, traga para o funil.
          </p>
        </div>
      </div>

      {error && <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {/* Seletor por campanha: separa as respostas de cada disparo que você enviou. */}
      {campaignTabs.length > 0 && (
        <div className="mb-3 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <CampaignTab active={campaign === 'all'} onClick={() => setCampaign('all')} label="Todas" total={totalAll} unread={unreadAll} />
          {campaignTabs
            .filter((c) => c.campaignId)
            .map((c) => (
              <CampaignTab
                key={c.campaignId}
                active={campaign === c.campaignId}
                onClick={() => setCampaign(c.campaignId as string)}
                label={c.campaignName ?? 'Campanha'}
                total={c.total}
                unread={c.unread}
              />
            ))}
          {campaignTabs.some((c) => !c.campaignId) && (
            <CampaignTab
              active={campaign === 'none'}
              onClick={() => setCampaign('none')}
              label="Sem campanha"
              total={campaignTabs.find((c) => !c.campaignId)?.total ?? 0}
              unread={campaignTabs.find((c) => !c.campaignId)?.unread ?? 0}
            />
          )}
        </div>
      )}

      <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
        <span><span className="font-medium text-foreground">{leads.length}</span> na caixa</span>
        {novas > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
            {novas} com resposta nova
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Ninguém da campanha respondeu ainda. Quando um lead responder, ele aparece aqui.
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((l) => {
            const nova = isUnread(l);
            return (
              <li
                key={l.id}
                className={cn(
                  'rounded-xl border bg-card p-3 shadow-card transition-colors',
                  nova ? 'border-l-[3px] border-l-destructive border-border' : 'border-border',
                )}
              >
                {/* Topo: toca para abrir a conversa */}
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
                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                          {l.interest}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {l.phone ?? '—'}
                      {l.lastInboundAt ? ` · respondeu ${rel(l.lastInboundAt)}` : ''}
                    </span>
                  </span>
                </button>

                {/* Ações: temperatura (status) à esquerda; conversa + trazer à direita */}
                <div className="mt-2.5 flex items-center gap-2">
                  <TemperatureControl
                    value={l.temperature}
                    suggested={l.aiSuggestedTemperature}
                    onChange={(t: Temperature) => update.mutate({ id: l.id, patch: { temperature: t } })}
                  />
                  <div className="ml-auto flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="size-9" onClick={() => openLead(l.id)} title="Abrir conversa" aria-label="Abrir conversa">
                      <MessageSquare className="size-4" />
                    </Button>
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
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <LeadPanel leadId={openLeadId} onClose={closeLead} />
    </div>
  );
}
