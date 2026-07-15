'use client';

import { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAuthStore } from '@/store/auth-store';
import { useLeadsDoBoard } from '@/hooks/use-leads';
import { useAtualizarStatusLead } from '@/hooks/use-atualizar-status-lead';
import { usePusherKanban } from '@/hooks/use-pusher-kanban';
import { Lead, LeadStatus } from '@/lib/types';
import { KanbanColumn, ColunaConfig } from './column';
import { FiltroCorretor } from './corretor-filter';

const COLUNAS: ColunaConfig[] = [
  { status: 'novo', titulo: 'Novo Lead' },
  { status: 'respondeu', titulo: 'Aguardando Resposta' },
  { status: 'em_atendimento', titulo: 'Em Atendimento' },
  { status: 'visita_agendada', titulo: 'Visita Agendada' },
  { status: 'proposta', titulo: 'Proposta' },
  { status: 'negocio_fechado', titulo: 'Negócio Fechado' },
  // Standby/Nutrição: cadência terminou sem resposta, mas no alto padrão isso
  // NÃO é "Perdido" — é um ciclo de decisão mais longo. Fica antes de Perdido
  // de propósito, com tom neutro/acinzentado para não competir visualmente
  // com as colunas "quentes" (Em Atendimento/Proposta).
  { status: 'frio_standby', titulo: 'Standby / Nutrição', tom: 'neutro' },
  { status: 'perdido', titulo: 'Perdido' },
];

export function KanbanBoard({ onAbrirLead }: { onAbrirLead: (leadId: string) => void }) {
  const usuario = useAuthStore((state) => state.usuario);
  const ehGestorOuAdmin = usuario?.papel === 'gestor' || usuario?.papel === 'admin';

  const [corretorId, setCorretorId] = useState<string | undefined>(undefined);
  const filtros = { corretorId };

  const { data, isLoading } = useLeadsDoBoard(filtros);
  const { mutate: moverLead } = useAtualizarStatusLead(filtros);
  usePusherKanban();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Distância mínima antes de considerar "arrastar" — abaixo disso, o
      // gesto é tratado como clique normal (abre o lead, não move o card).
      activationConstraint: { distance: 8 },
    })
  );

  const leadsPorColuna = useMemo(() => {
    const mapa = new Map<LeadStatus, Lead[]>(COLUNAS.map((c) => [c.status, []]));

    for (const lead of data?.items ?? []) {
      mapa.get(lead.status)?.push(lead);
    }

    return mapa;
  }, [data]);

  function aoTerminarDrag(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over) return;

    const leadId = active.id as string;
    const novoStatus = over.id as LeadStatus;
    const statusAtual = (active.data.current?.status as LeadStatus) ?? undefined;

    if (novoStatus === statusAtual) return; // soltou na mesma coluna, não faz nada

    moverLead({ leadId, novoStatus });
  }

  return (
    <div className="flex h-full flex-col">
      {ehGestorOuAdmin && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filtrar por corretor:</span>
          <FiltroCorretor valor={corretorId} onMudar={setCorretorId} />
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Carregando leads...
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={aoTerminarDrag}>
          <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
            {COLUNAS.map((coluna) => (
              <KanbanColumn
                key={coluna.status}
                coluna={coluna}
                leads={leadsPorColuna.get(coluna.status) ?? []}
                onAbrirLead={onAbrirLead}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
