import { Suspense } from 'react';
import { KanbanBoard } from '@/components/kanban/kanban-board';

/** Quadro de leads (Kanban). Dados, filtros, arraste e painel do lead no cliente. */
export default function KanbanPage() {
  return (
    <Suspense>
      <KanbanBoard />
    </Suspense>
  );
}
