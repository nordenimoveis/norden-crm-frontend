'use client';

import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SOURCE_LABELS, type LeadSummary, type Temperature } from '@/lib/types';
import { useUnread } from '@/components/realtime-provider';
import { TemperatureControl, TemperatureDot } from './temperature-control';
import { cn } from '@/lib/utils';

interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  lead: LeadSummary;
  onTemperature?: (t: Temperature) => void;
  dragging?: boolean;
  overlay?: boolean;
  /** Etapa de papel AWAITING → alerta de "aguardando resposta". */
  awaiting?: boolean;
  /** Etapa de papel LOST → cartão discreto com o motivo. */
  lost?: boolean;
  lostReasonLabel?: string | null;
  /** Mensagens do cliente ainda não lidas neste lead. */
  unread?: number;
}

/** Card do lead (apresentação pura). O arraste é adicionado por <LeadCard>. */
export const LeadCardView = React.forwardRef<HTMLDivElement, ViewProps>(function LeadCardView(
  { lead, onTemperature, dragging, overlay, awaiting, lost, lostReasonLabel, unread, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'select-none rounded-lg border border-border bg-card p-3 shadow-card transition-shadow',
        'cursor-grab active:cursor-grabbing',
        awaiting && 'border-l-[3px] border-l-destructive',
        lost && 'opacity-75',
        dragging && 'opacity-40',
        overlay && 'rotate-[1.5deg] cursor-grabbing shadow-panel',
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium leading-tight text-foreground">
          {!!unread && unread > 0 && (
            <span
              className="grid min-w-[18px] shrink-0 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-[18px] text-destructive-foreground"
              aria-label={`${unread} não lida(s)`}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
          <span className="truncate">{lead.name}</span>
        </p>
        {onTemperature ? (
          <TemperatureControl
            value={lead.temperature}
            suggested={lead.aiSuggestedTemperature}
            onChange={onTemperature}
          />
        ) : (
          <TemperatureDot value={lead.temperature} />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge variant="outline">{SOURCE_LABELS[lead.source]}</Badge>
        {lead.brokerName && (
          <span className="truncate text-xs text-muted-foreground">{lead.brokerName}</span>
        )}
        {lead.hasConversation && (
          <MessageSquare className="size-3.5 text-muted-foreground/70" aria-label="Tem conversa" />
        )}
      </div>

      {awaiting && (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
          <span className="size-1.5 rounded-full bg-destructive animate-pulse-alert" aria-hidden />
          Aguardando resposta
        </div>
      )}

      {lost && lostReasonLabel && (
        <div className="mt-2 text-xs text-muted-foreground">Motivo: {lostReasonLabel}</div>
      )}
    </div>
  );
});

/** Card arrastável no board. */
export function LeadCard({
  lead,
  onTemperature,
  onOpen,
  awaiting,
  lost,
  lostReasonLabel,
}: {
  lead: LeadSummary;
  onTemperature: (t: Temperature) => void;
  onOpen?: () => void;
  awaiting?: boolean;
  lost?: boolean;
  lostReasonLabel?: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { stage: lead.stage },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const down = React.useRef<{ x: number; y: number } | null>(null);
  const { unread } = useUnread();

  return (
    <LeadCardView
      ref={setNodeRef}
      lead={lead}
      onTemperature={onTemperature}
      awaiting={awaiting}
      lost={lost}
      lostReasonLabel={lostReasonLabel}
      unread={unread[lead.id] ?? 0}
      dragging={isDragging}
      style={style}
      {...attributes}
      {...listeners}
      // Abrir o painel só num clique de verdade: ignora arraste (movimento) e
      // cliques em controles internos (ex.: o seletor de temperatura).
      onPointerDownCapture={(e) => {
        down.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if (!onOpen) return;
        if ((e.target as HTMLElement).closest('button,[role="menuitem"]')) return;
        const d = down.current;
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
        onOpen();
      }}
    />
  );
}
