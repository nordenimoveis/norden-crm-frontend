'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { LeadSummary, PipelineStage, Temperature } from '@/lib/types';
import { useLeads, useUpdateLead } from '@/hooks/use-leads';
import { useBrokers } from '@/hooks/use-brokers';
import { useStages } from '@/hooks/use-pipeline';
import { useLossReasons } from '@/hooks/use-loss-reasons';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSession } from '@/components/session-provider';
import { isManager } from '@/lib/types';
import { firstName } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanFilters } from './kanban-filters';
import { KanbanColumn } from './kanban-column';
import { LeadCardView } from './lead-card';
import { LossReasonDialog } from './loss-reason-dialog';
import { LeadPanel } from '@/components/lead-panel/lead-panel';

function groupByStage(leads: LeadSummary[], stages: PipelineStage[]): Record<string, LeadSummary[]> {
  const groups: Record<string, LeadSummary[]> = {};
  for (const s of stages) groups[s.key] = [];
  for (const lead of leads) (groups[lead.stage] ??= []).push(lead);
  return groups;
}

export function KanbanBoard() {
  const user = useSession();
  const manager = isManager(user.role);

  // Painel do lead via ?lead=<id>
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openLeadId = searchParams.get('lead');
  const openLead = useCallback(
    (id: string) => router.push(`${pathname}?lead=${id}`, { scroll: false }),
    [router, pathname],
  );
  const closeLead = useCallback(() => router.push(pathname, { scroll: false }), [router, pathname]);

  // Filtros
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch, 300);
  const [temperature, setTemperature] = useState<Temperature | null>(null);
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [includeOld, setIncludeOld] = useState(false);

  const filters = useMemo(
    () => ({
      q: search || undefined,
      temperature,
      brokerId: manager ? brokerId : null,
      includeOld,
    }),
    [search, temperature, brokerId, includeOld, manager],
  );

  const stagesQuery = useStages();
  const leadsQuery = useLeads(filters);
  const brokersQuery = useBrokers(manager);
  const reasonsQuery = useLossReasons();
  const update = useUpdateLead(filters);

  const stages = stagesQuery.data ?? [];
  const leads = leadsQuery.data ?? [];
  const byStage = useMemo(() => groupByStage(leads, stages), [leads, stages]);
  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const reasonLabel = useMemo(
    () => new Map((reasonsQuery.data ?? []).map((r) => [r.id, r.label])),
    [reasonsQuery.data],
  );
  const lostStageKey = stages.find((s) => s.systemRole === 'LOST')?.key;

  // Drag & drop
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeLead, setActiveLead] = useState<LeadSummary | null>(null);
  const [pendingLost, setPendingLost] = useState<LeadSummary | null>(null);

  function onDragStart(e: DragStartEvent) {
    setActiveLead(leadById.get(String(e.active.id)) ?? null);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = e;
    if (!over) return;
    const targetKey = String(over.id);
    const targetStage = stages.find((s) => s.key === targetKey);
    const lead = leadById.get(String(active.id));
    if (!lead || !targetStage || lead.stage === targetKey) return;

    if (targetStage.systemRole === 'LOST') {
      setPendingLost(lead); // pede o motivo antes de confirmar
    } else {
      update.mutate({ id: lead.id, patch: { stage: targetKey } });
    }
  }

  function confirmLost(reasonId: string) {
    if (pendingLost && lostStageKey) {
      update.mutate({ id: pendingLost.id, patch: { stage: lostStageKey, lossReasonId: reasonId } });
    }
    setPendingLost(null);
  }

  function onTemperature(leadId: string, t: Temperature) {
    update.mutate({ id: leadId, patch: { temperature: t } });
  }

  function reasonLabelOf(leadId: string): string | null {
    const rid = leadById.get(leadId)?.lostReasonId;
    return rid ? (reasonLabel.get(rid) ?? null) : null;
  }

  const loading = leadsQuery.isLoading || stagesQuery.isLoading;
  const activeStage = activeLead ? stages.find((s) => s.key === activeLead.stage) : undefined;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6">
      <header className="mb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-medium tracking-tight">
            Olá, {firstName(user.name)}
          </h1>
          {leadsQuery.isFetching && !loading && (
            <span className="text-xs text-muted-foreground">atualizando…</span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {leads.length} {leads.length === 1 ? 'lead' : 'leads'} no quadro
        </p>
      </header>

      <div className="mb-4">
        <KanbanFilters
          search={rawSearch}
          onSearch={setRawSearch}
          temperature={temperature}
          onTemperature={setTemperature}
          includeOld={includeOld}
          onIncludeOld={setIncludeOld}
          isManager={manager}
          brokerId={brokerId}
          onBroker={setBrokerId}
          brokers={brokersQuery.data ?? []}
        />
      </div>

      {leadsQuery.isError || stagesQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Não foi possível carregar o quadro. Tente recarregar a página.
        </div>
      ) : loading ? (
        <BoardSkeleton />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveLead(null)}
        >
          <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                leads={byStage[stage.key] ?? []}
                onTemperature={onTemperature}
                onOpen={openLead}
                reasonLabelOf={reasonLabelOf}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeLead ? (
              <LeadCardView
                lead={activeLead}
                overlay
                awaiting={activeStage?.systemRole === 'AWAITING'}
                lost={activeStage?.systemRole === 'LOST'}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <LossReasonDialog
        lead={pendingLost}
        onConfirm={confirmLost}
        onCancel={() => setPendingLost(null)}
      />

      <LeadPanel leadId={openLeadId} onClose={closeLead} />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="w-[288px] shrink-0 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
}
