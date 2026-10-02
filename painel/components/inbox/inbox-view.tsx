'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRightCircle, Inbox, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeadPanel } from '@/components/lead-panel/lead-panel';
import { useLeads, usePromoteLead } from '@/hooks/use-leads';
import { SOURCE_LABELS, TEMPERATURE_LABELS, type Source } from '@/lib/types';
import { TEMP_DOT } from '@/lib/temperature';
import { ApiError } from '@/lib/api/client';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function InboxView() {
  const { data: leads = [], isLoading } = useLeads({ source: 'BASE_ANTIGA', responded: true, limit: 500 });
  const promote = usePromoteLead();
  const [error, setError] = useState<string | null>(null);

  // Painel do lead via ?lead=
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openLeadId = params.get('lead');
  const openLead = useCallback((id: string) => router.push(`${pathname}?lead=${id}`, { scroll: false }), [router, pathname]);
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
            Leads de campanha (base antiga) que responderam e ainda não estão no funil. Abra a conversa, entenda o cliente e, quando quiser, traga para o funil.
          </p>
        </div>
      </div>

      {error && <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Ninguém da campanha respondeu ainda. Quando um lead responder, ele aparece aqui.
        </div>
      ) : (
        <ul className="space-y-2">
          {leads.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
            >
              <button
                type="button"
                onClick={() => openLead(l.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className={cn('size-2.5 shrink-0 rounded-full', TEMP_DOT[l.temperature])} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">{l.name}</span>
                    <Badge variant="outline">{l.campaign ?? SOURCE_LABELS[l.source as Source]}</Badge>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {l.phone ?? '—'}
                    {l.lastInboundAt ? ` · respondeu ${formatDateTime(l.lastInboundAt)}` : ''}
                    {` · ${TEMPERATURE_LABELS[l.temperature]}`}
                  </span>
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => openLead(l.id)}>
                  <MessageSquare className="size-4" /> Conversa
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
                  <ArrowRightCircle className="size-4" /> Trazer para o funil
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <LeadPanel leadId={openLeadId} onClose={closeLead} />
    </div>
  );
}
