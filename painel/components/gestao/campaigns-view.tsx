'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Megaphone, Plus, Send, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCampaigns, useCampaignMutations, useCampaignTemplates, useTemplateMutations } from '@/hooks/use-campaigns';
import { useStages } from '@/hooks/use-pipeline';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { previewAudience } from '@/lib/api/campaigns';
import { ApiError } from '@/lib/api/client';
import {
  CAMPAIGN_STATUS_LABELS,
  SOURCE_LABELS,
  TEMPERATURES,
  TEMPERATURE_LABELS,
  type CampaignFilters,
  type CampaignStatus,
  type CampaignTemplate,
  type Source,
} from '@/lib/types';
import { TEMP_DOT } from '@/lib/temperature';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const SOURCES: Source[] = ['META_ADS', 'INSTAGRAM', 'SITE', 'WHATSAPP_DIRETO', 'MANUAL'];
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Não foi possível concluir');
const statusVariant = (s: CampaignStatus) =>
  s === 'CANCELADA' ? 'alert' : s === 'CONCLUIDA' || s === 'ENVIANDO' ? 'accent' : 'outline';

/** Extrai {{tokens}} do texto, na ordem — vira paramSources do template. */
function tokensFrom(text: string): string[] {
  return Array.from(text.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)).map((m) => `{{${m[1]}}}`);
}

export function CampaignsView() {
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const campaigns = useCampaigns();
  const { cancel, remove } = useCampaignMutations();

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* Campanhas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-medium tracking-tight">Campanhas</h3>
            <p className="text-sm text-muted-foreground">Disparo em massa de um template aprovado para um público de leads.</p>
          </div>
          <Button onClick={() => setComposing(true)}>
            <Plus className="size-4" /> Nova campanha
          </Button>
        </div>

        {campaigns.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (campaigns.data ?? []).length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma campanha ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {campaigns.data!.map((c) => {
              const pct = c.total ? Math.round((c.sent / c.total) * 100) : 0;
              return (
                <li key={c.id} className="rounded-lg border border-border bg-card p-3 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        <Megaphone className="size-4 text-muted-foreground" />
                        {c.name}
                        <Badge variant={statusVariant(c.status)}>{CAMPAIGN_STATUS_LABELS[c.status]}</Badge>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.templateName} · {c.sent}/{c.total} enviados{c.failed ? ` · ${c.failed} falhas` : ''}
                        {c.scheduledFor ? ` · agendada p/ ${formatDateTime(c.scheduledFor)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(c.status === 'ENVIANDO' || c.status === 'AGENDADA') && (
                        <Button variant="ghost" size="sm" onClick={() => cancel.mutate(c.id, { onError: (e) => setError(msg(e)) })}>
                          Cancelar
                        </Button>
                      )}
                      {(c.status === 'CONCLUIDA' || c.status === 'CANCELADA' || c.status === 'RASCUNHO') && (
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" title="Excluir"
                          onClick={() => confirm(`Excluir a campanha "${c.name}"?`) && remove.mutate(c.id, { onError: (e) => setError(msg(e)) })}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {c.total > 0 && (
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-accent/50" style={{ width: `${pct}%` }} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <TemplatesManager onError={setError} />

      {composing && <CampaignComposer onClose={() => setComposing(false)} onError={setError} />}
    </div>
  );
}

/* --------------------------- Templates --------------------------- */

function TemplatesManager({ onError }: { onError: (m: string | null) => void }) {
  const { data: templates = [], isLoading } = useCampaignTemplates();
  const { create, update, remove } = useTemplateMutations();
  const [name, setName] = useState('');
  const [preview, setPreview] = useState('');

  function add(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    create.mutate(
      { name: name.trim(), preview: preview.trim(), paramSources: tokensFrom(preview) },
      { onSuccess: () => { setName(''); setPreview(''); }, onError: (er) => onError(msg(er)) },
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-display text-lg font-medium tracking-tight">Templates aprovados</h3>
        <p className="text-sm text-muted-foreground">
          O nome deve bater com o template aprovado na Meta. Use variáveis no texto: <code className="text-xs">{'{{lead_first_name}}'}</code>, <code className="text-xs">{'{{broker_first_name}}'}</code>, <code className="text-xs">{'{{lead_interest}}'}</code>.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id} className={cn('rounded-lg border border-border bg-card p-3 shadow-card', !t.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-sm">{t.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.preview}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => update.mutate({ id: t.id, patch: { active: !t.active } }, { onError: (e) => onError(msg(e)) })}>
                    {t.active ? 'Ativo' : 'Inativo'}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" title="Excluir"
                    onClick={() => confirm(`Excluir o template "${t.name}"?`) && remove.mutate(t.id, { onError: (e) => onError(msg(e)) })}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do template (ex.: norden_lancamento)" maxLength={80} />
        <textarea
          value={preview}
          onChange={(e) => setPreview(e.target.value)}
          rows={2}
          placeholder="Texto do template, ex.: Olá {{lead_first_name}}, temos um lançamento em Jurerê…"
          className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!name.trim() || !preview.trim() || create.isPending}>
            <Plus className="size-4" /> Adicionar template
          </Button>
        </div>
      </form>
    </section>
  );
}

/* --------------------------- Composer --------------------------- */

function CampaignComposer({ onClose, onError }: { onClose: () => void; onError: (m: string | null) => void }) {
  const { data: templates = [] } = useCampaignTemplates();
  const activeTemplates = templates.filter((t) => t.active);
  const stages = useStages().data ?? [];
  const { create, launch } = useCampaignMutations();

  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [temps, setTemps] = useState<string[]>([]);
  const [stageKeys, setStageKeys] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [includeOld, setIncludeOld] = useState(false);
  const [when, setWhen] = useState<'agora' | 'agendar'>('agora');
  const [scheduledFor, setScheduledFor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filters: CampaignFilters = useMemo(
    () => ({ temperatures: temps, stages: stageKeys, sources, includeOld }),
    [temps, stageKeys, sources, includeOld],
  );
  const debFilters = useDebouncedValue(filters, 400);
  const audience = useQuery({ queryKey: ['audience', debFilters], queryFn: () => previewAudience(debFilters) });
  const template = activeTemplates.find((t) => t.id === templateId);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function submit() {
    onError(null);
    if (!name.trim() || !templateId) return;
    setSubmitting(true);
    try {
      const campaign = await create.mutateAsync({ name: name.trim(), templateId, filters });
      const iso = when === 'agendar' && scheduledFor ? new Date(scheduledFor).toISOString() : null;
      await launch.mutateAsync({ id: campaign.id, scheduledFor: iso });
      onClose();
    } catch (e) {
      onError(msg(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Nome da campanha</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex.: Lançamento Praia do Forte" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-tpl">Template</Label>
            <select
              id="c-tpl"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Escolha um template…</option>
              {activeTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {activeTemplates.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum template ativo — cadastre um em “Templates aprovados”.</p>
            )}
            {template && <p className="rounded-md bg-muted/50 p-2.5 text-sm">{template.preview}</p>}
          </div>

          {/* Público */}
          <div className="space-y-2">
            <Label>Público</Label>
            <FilterChips label="Temperatura" values={TEMPERATURES} selected={temps} onToggle={(v) => toggle(temps, v, setTemps)} labelOf={(v) => TEMPERATURE_LABELS[v as keyof typeof TEMPERATURE_LABELS]} dotOf={(v) => TEMP_DOT[v as keyof typeof TEMP_DOT]} />
            <FilterChips label="Etapa" values={stages.map((s) => s.key)} selected={stageKeys} onToggle={(v) => toggle(stageKeys, v, setStageKeys)} labelOf={(v) => stages.find((s) => s.key === v)?.label ?? v} />
            <FilterChips label="Origem" values={SOURCES} selected={sources} onToggle={(v) => toggle(sources, v, setSources)} labelOf={(v) => SOURCE_LABELS[v as Source]} />
            <label className="flex items-center gap-2 pt-1 text-sm">
              <input type="checkbox" checked={includeOld} onChange={(e) => setIncludeOld(e.target.checked)} className="size-4" />
              Incluir Base Antiga
            </label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <Users className="size-4 text-muted-foreground" />
              <span className="font-medium">{audience.data?.count ?? '—'}</span> leads com telefone neste público
              {audience.isFetching && <span className="text-xs text-muted-foreground">atualizando…</span>}
            </div>
          </div>

          {/* Quando */}
          <div className="space-y-2">
            <Label>Envio</Label>
            <div className="flex gap-2 text-sm">
              <button type="button" onClick={() => setWhen('agora')} className={cn('flex-1 rounded-md border px-3 py-2', when === 'agora' ? 'border-accent/50 bg-accent/[0.08]' : 'border-border')}>
                <Send className="mr-1 inline size-4" /> Enviar agora
              </button>
              <button type="button" onClick={() => setWhen('agendar')} className={cn('flex-1 rounded-md border px-3 py-2', when === 'agendar' ? 'border-accent/50 bg-accent/[0.08]' : 'border-border')}>
                <Clock className="mr-1 inline size-4" /> Agendar
              </button>
            </div>
            {when === 'agendar' && (
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Só templates aprovados; o público é congelado agora. O envio respeita o horário comercial.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting || !name.trim() || !templateId || (audience.data?.count ?? 0) === 0}>
            {submitting ? 'Criando…' : when === 'agendar' ? 'Agendar campanha' : 'Enviar campanha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilterChips({
  label,
  values,
  selected,
  onToggle,
  labelOf,
  dotOf,
}: {
  label: string;
  values: string[];
  selected: string[];
  onToggle: (v: string) => void;
  labelOf: (v: string) => string;
  dotOf?: (v: string) => string;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => {
          const active = selected.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onToggle(v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active ? 'border-foreground/20 bg-foreground/[0.06] text-foreground' : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {dotOf && <span className={cn('size-2 rounded-full', dotOf(v))} />}
              {labelOf(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
