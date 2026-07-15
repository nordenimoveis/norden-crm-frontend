'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban/board';
import { ChatPanel } from '@/components/chat/chat-panel';

function KanbanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');

  function abrirLead(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('leadId', id);
    router.push(`/kanban?${params.toString()}`, { scroll: false });
  }

  function fecharPainel() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('leadId');
    router.push(`/kanban?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex h-full gap-4">
      <div className="min-w-0 flex-1">
        <KanbanBoard onAbrirLead={abrirLead} />
      </div>

      {leadId && <ChatPanel leadId={leadId} onFechar={fecharPainel} />}
    </div>
  );
}

export default function KanbanPage() {
  return (
    <Suspense fallback={null}>
      <KanbanContent />
    </Suspense>
  );
}
