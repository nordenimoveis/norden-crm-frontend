'use client';

import { useDraggable } from '@dnd-kit/core';
import { MapPin, AlertCircle } from 'lucide-react';
import { Lead } from '@/lib/types';
import { OrigemBadge } from './origem-badge';
import { TemperaturaBadge } from './temperatura-badge';
import { AlertaEstagnadoBadge } from './alerta-estagnado-badge';
import { cn } from '@/lib/utils';

function iniciais(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export function LeadCard({ lead, onAbrir }: { lead: Lead; onAbrir: (leadId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { status: lead.status },
  });

  const nomeExibicao = lead.nome || lead.telefone;
  const respondeuRecentemente = lead.status === 'respondeu' && lead.atendimentoHumano;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAbrir(lead.id)}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn(
        'group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'z-10 opacity-60 shadow-lg'
      )}
    >
      {lead.alerta === 'aguardando_resposta' ? (
        <div className="mb-2">
          <AlertaEstagnadoBadge alerta={lead.alerta} horasParado={lead.horasParado} />
        </div>
      ) : respondeuRecentemente ? (
        <div className="mb-2 flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
          <AlertCircle className="h-3 w-3" />
          Aguardando Resposta
        </div>
      ) : lead.alerta === 'sem_atividade' ? (
        <div className="mb-2">
          <AlertaEstagnadoBadge alerta={lead.alerta} horasParado={lead.horasParado} />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-medium text-accent">
            {iniciais(nomeExibicao)}
          </div>
          <p className="truncate text-sm font-medium text-foreground">{nomeExibicao}</p>
        </div>
      </div>

      {lead.imovel?.bairro && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {lead.imovel.bairro}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <OrigemBadge origem={lead.origem} />
        <TemperaturaBadge temperatura={lead.temperatura} />
      </div>
    </div>
  );
}
