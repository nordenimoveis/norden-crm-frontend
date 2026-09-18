'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLeads, patchLead, type LeadFilters, type LeadPatch } from '@/lib/api/leads';
import type { LeadSummary } from '@/lib/types';

/** Lista de leads para o Kanban, reagindo aos filtros. */
export function useLeads(filters: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => getLeads(filters),
    placeholderData: (prev) => prev, // mantém o board enquanto refaz a busca
  });
}

/**
 * Edição rápida do lead (arrastar entre colunas, mudar temperatura) com
 * atualização otimista: o card se move na hora e reverte se a API recusar.
 */
export function useUpdateLead(filters: LeadFilters) {
  const qc = useQueryClient();
  const key = ['leads', filters] as const;

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: LeadPatch }) => patchLead(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<LeadSummary[]>(key);
      if (previous) {
        qc.setQueryData<LeadSummary[]>(
          key,
          previous.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      // Revalida todas as visões de leads (filtros diferentes inclusive).
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
