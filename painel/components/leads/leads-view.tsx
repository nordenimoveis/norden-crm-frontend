'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Users as UsersIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LeadPanel } from '@/components/lead-panel/lead-panel';
import { useLeads } from '@/hooks/use-leads';
import { useBrokers } from '@/hooks/use-brokers';
import { useStages } from '@/hooks/use-pipeline';
import { useSession } from '@/components/session-provider';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getLeadCampaigns } from '@/lib/api/leads';
import {
  SOURCE_LABELS,
  TEMPERATURES,
  TEMPERATURE_LABELS,
  isManager,
  type Source,
  type Temperature,
} from '@/lib/types';
import { TEMP_DOT } from '@/lib/temperature';
import { cn } from '@/lib/utils';

const SOURCES: Source[] = ['META_ADS', 'INSTAGRAM', 'SITE', 'WHATSAPP_DIRETO', 'MANUAL', 'BASE_ANTIGA'];
const TAGS = ['Proprietário', 'Base Antiga', 'Atendimento Humano', 'Lead Frio / Standby'];
const LIMIT = 500;

export function LeadsView() {
  const user = useSession();
  const manager = isManager(user.role);

  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch, 300);
  const [source, setSource] = useState('');
  const [campaign, setCampaign] = useState('');
  const [tag, setTag] = useState('');
  const [temperature, setTemperature] = useState<Temperature | null>(null);
  const [brokerId, setBrokerId] = useState('');

  const filters = useMemo(
    () => ({
      q: search || undefined,
      source: source || undefined,
      campaign: campaign || undefined,
      tag: tag || undefined,
      temperature,
      brokerId: manager ? brokerId || undefined : undefined,
      includeOld: true, // a tela de Leads mostra tudo, inclusive a Base Antiga
      limit: LIMIT,
    }),
    [search, source, campaign, tag, temperature, brokerId, manager],
  );

  const { data: leads = [], isLoading } = useLeads(filters);
  const brokers = useBrokers(manager).data ?? [];
  const stages = useStages().data ?? [];
  const stageLabel = (key: string) => stages.find((s) => s.key === key)?.label ?? key;
  const { data: campaigns = [] } = useQuery({ queryKey: ['lead-campaigns'], queryFn: getLeadCampaigns });

  // Painel do lead via ?lead=<id>
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openLeadId = params.get('lead');
  const openLead = useCallback((id: string) => router.push(`${pathname}?lead=${id}`, { scroll: false }), [router, pathname]);
  const closeLead = useCallback(() => router.push(pathname, { scroll: false }), [router, pathname]);

  const hasFilters = Boolean(search || source || campaign || tag || temperature || brokerId);
  function clearAll() {
    setRawSearch('');
    setSource('');
    setCampaign('');
    setTag('');
    setTemperature(null);
    setBrokerId('');
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-medium tracking-tight">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toda a base, incluindo os contatos importados do Imobzi. Filtre para separar as informações.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={rawSearch} onChange={(e) => setRawSearch(e.target.value)} placeholder="Buscar por nome, telefone, e-mail…" className="pl-9" />
        </div>

        <Select value={source} onChange={setSource} label="Todas as origens">
          {SOURCES.map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </Select>

        <Select value={tag} onChange={setTag} label="Todas as etiquetas">
          {TAGS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        {campaigns.length > 0 && (
          <Select value={campaign} onChange={setCampaign} label="Campanha / origem (todas)">
            {campaigns.map((c) => (
              <option key={c.campaign} value={c.campaign}>{c.campaign} ({c.total})</option>
            ))}
          </Select>
        )}

        {manager && brokers.length > 0 && (
          <Select value={brokerId} onChange={setBrokerId} label="Todos os corretores">
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        )}
      </div>

      {/* Temperatura (chips) */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
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
        {hasFilters && (
          <button type="button" onClick={clearAll} className="ml-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Contagem */}
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <UsersIcon className="size-4" />
        {isLoading ? 'Carregando…' : <span><span className="font-medium text-foreground">{leads.length}</span> {leads.length === 1 ? 'lead' : 'leads'}{leads.length >= LIMIT ? '+ (refine os filtros para ver mais)' : ''}</span>}
      </div>

      {/* Tabela */}
      <div className="mt-2 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Telefone</th>
              <th className="px-3 py-2 font-medium">Origem</th>
              <th className="px-3 py-2 font-medium">Campanha</th>
              <th className="px-3 py-2 font-medium">Etapa</th>
              <th className="px-3 py-2 font-medium">Temp.</th>
              <th className="px-3 py-2 font-medium">Corretor</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && leads.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Nenhum lead com esses filtros.</td></tr>
            )}
            {leads.map((l) => (
              <tr
                key={l.id}
                onClick={() => openLead(l.id)}
                className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="px-3 py-2 font-medium text-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className={cn('size-2 shrink-0 rounded-full', TEMP_DOT[l.temperature])} />
                    <span className="max-w-[16rem] truncate">{l.name}</span>
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">{l.phone ?? '—'}</td>
                <td className="px-3 py-2"><Badge variant="outline">{SOURCE_LABELS[l.source]}</Badge></td>
                <td className="px-3 py-2 text-muted-foreground"><span className="block max-w-[12rem] truncate">{l.campaign ?? '—'}</span></td>
                <td className="px-3 py-2 text-muted-foreground">{stageLabel(l.stage)}</td>
                <td className="px-3 py-2 text-muted-foreground">{TEMPERATURE_LABELS[l.temperature]}</td>
                <td className="px-3 py-2 text-muted-foreground">{l.brokerName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LeadPanel leadId={openLeadId} onClose={closeLead} />
    </div>
  );
}

/** Select simples e estiloso (origem, etiqueta, campanha, corretor). */
function Select({ value, onChange, label, children }: { value: string; onChange: (v: string) => void; label: string; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 rounded-md border bg-card px-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        value ? 'border-accent/40' : 'border-input',
      )}
    >
      <option value="">{label}</option>
      {children}
    </select>
  );
}
