'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface DraftState {
  drafts: Record<string, string>;
  clear: (leadId: string) => void;
}

const DraftContext = createContext<DraftState>({ drafts: {}, clear: () => {} });

/**
 * Tempo real via SSE. Escuta /api/events (proxy) e invalida as consultas do
 * React Query quando algo muda no servidor, deixando Kanban, painel e chat
 * "ao vivo". Também guarda o rascunho sugerido pela IA por lead.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const es = new EventSource('/api/events');
    const parse = (e: MessageEvent): Record<string, unknown> => {
      try {
        return JSON.parse(e.data);
      } catch {
        return {};
      }
    };
    const invalidate = (leadId?: unknown) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      if (typeof leadId === 'string') qc.invalidateQueries({ queryKey: ['lead', leadId] });
    };

    for (const type of ['lead.created', 'lead.updated', 'lead.assigned', 'message.created']) {
      es.addEventListener(type, (e) => invalidate(parse(e as MessageEvent).leadId));
    }
    es.addEventListener('ai.suggestion', (e) => {
      const d = parse(e as MessageEvent);
      if (typeof d.leadId === 'string') {
        if (typeof d.draftReply === 'string') {
          setDrafts((m) => ({ ...m, [d.leadId as string]: d.draftReply as string }));
        }
        invalidate(d.leadId);
      }
    });
    // O EventSource reconecta sozinho quando o fluxo cai.
    return () => es.close();
  }, [qc]);

  const clear = (leadId: string) =>
    setDrafts((m) => {
      if (!(leadId in m)) return m;
      const next = { ...m };
      delete next[leadId];
      return next;
    });

  return <DraftContext.Provider value={{ drafts, clear }}>{children}</DraftContext.Provider>;
}

/** Rascunho sugerido pela IA para um lead (chega por SSE). */
export function useDraft(leadId: string) {
  const { drafts, clear } = useContext(DraftContext);
  return { draft: drafts[leadId] ?? null, clearDraft: () => clear(leadId) };
}
