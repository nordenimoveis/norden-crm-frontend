'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMessages,
  getReengageVariants,
  reengage,
  sendAttachments,
  sendMessage,
  sendNote,
  sendTemplate,
} from '@/lib/api/messages';
import type { MessagesPage } from '@/lib/types';

/** Catálogo das variações de retomada (carregado uma vez; muda muito raramente). */
export function useReengageVariants() {
  return useQuery({
    queryKey: ['reengage-variants'],
    queryFn: getReengageVariants,
    staleTime: 60 * 60 * 1000,
  });
}

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
  const attach = useMutation({
    mutationFn: ({ files, caption }: { files: File[]; caption?: string }) => sendAttachments(leadId, files, caption),
    onSuccess: refresh,
  });
  const retomada = useMutation({
    mutationFn: ({ subject, variant }: { subject: string; variant: string }) => reengage(leadId, subject, variant),
    onSuccess: refresh,
  });
  return { text, note, template, attach, retomada };
}
