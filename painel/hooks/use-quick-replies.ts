'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createQuickReply, deleteQuickReply, getQuickReplies, updateQuickReply } from '@/lib/api/quick-replies';

export function useQuickReplies(enabled = true) {
  return useQuery({
    queryKey: ['quick-replies'],
    queryFn: getQuickReplies,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuickReplyMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['quick-replies'] });
  return {
    create: useMutation({ mutationFn: (i: { shortcut: string; title: string; body: string; global: boolean }) => createQuickReply(i), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (v: { id: string; patch: Record<string, unknown> }) => updateQuickReply(v.id, v.patch), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => deleteQuickReply(id), onSuccess: invalidate }),
  };
}
