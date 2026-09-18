'use client';

import { useDroppable } from '@dnd-kit/core';
import type { LeadSummary, PipelineStage, Temperature } from '@/lib/types';
import { LeadCard } from './lead-card';
import { cn } from '@/lib/utils';

interface Props {
  stage: PipelineStage;
  leads: LeadSummary[];
  onTemperature: (leadId: string, t: Temperature) => void;
  onOpen: (leadId: string) => void;
  /** Rótulo do motivo de perda por lead (só usado na coluna Perdido). */
  reasonLabelOf?: (leadId: string) => string | null;
}

/** Coluna do Kanban, dirigida por uma etapa do funil (dado). */
export function KanbanColumn({ stage, leads, onTemperature, onOpen, reasonLabelOf }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const awaiting = stage.systemRole === 'AWAITING';
  const lost = stage.systemRole === 'LOST';

  return (
    <section className="flex w-[86vw] max-w-[300px] shrink-0 snap-start flex-col sm:w-[288px]">
      <header className="flex items-center justify-between px-1 pb-2">
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
          {stage.label}
          {awaiting && leads.length > 0 && (
            <span className="size-1.5 rounded-full bg-destructive animate-pulse-alert" />
          )}
        </h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {leads.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[64vh] flex-1 space-y-2 rounded-lg border border-border/70 bg-muted/40 p-2 transition-colors',
          lost && 'bg-muted/20',
          isOver && 'border-accent/50 bg-accent/[0.06] ring-1 ring-accent/40',
        )}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onTemperature={(t) => onTemperature(lead.id, t)}
            onOpen={() => onOpen(lead.id)}
            awaiting={awaiting}
            lost={lost}
            lostReasonLabel={lost ? reasonLabelOf?.(lead.id) : null}
          />
        ))}
        {leads.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground/60">Sem leads</p>
        )}
      </div>
    </section>
  );
}
