'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage, sendNote, sendTemplate } from '@/lib/api/messages';
import type { MessagesPage } from '@/lib/types';

/** Histórico paginado do chat (página 0 = mais recentes; próximas = mais antigas). */
export function useMessages(leadId: string | null) {
  return useInfiniteQuery({
    queryKey: ['lead', leadId, 'messages'],
    queryFn: ({ pageParam }) => getMessages(leadId as string, pageParam),
    enabled: Boolean(leadId),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: MessagesPage) =>
      lastPage.messages.length ? Math.min(...lastPage.messages.map((m) => m.id)) : undefined,
    refetchOnWindowFocus: false,
  });
}

/** Envio de texto, nota interna e template, com atualização das listas. */
export function useSendActions(leadId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['lead', leadId] });
    qc.invalidateQueries({ queryKey: ['leads'] });
  };
  const text = useMutation({ mutationFn: (c: string) => sendMessage(leadId, c), onSuccess: refresh });
  const note = useMutation({ mutationFn: (c: string) => sendNote(leadId, c), onSuccess: refresh });
  const template = useMutation({ mutationFn: (step: number) => sendTemplate(leadId, step), onSuccess: refresh });
  return { text, note, template };
}
