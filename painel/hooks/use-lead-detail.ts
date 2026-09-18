'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptAiTemperature,
  getLeadDetail,
  patchLead,
  transferLead,
  type LeadPatch,
} from '@/lib/api/leads';

/** Detalhe do lead aberto no painel lateral. */
export function useLeadDetail(id: string | null) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => getLeadDetail(id as string),
    enabled: Boolean(id),
  });
}

/**
 * Ações do painel (editar, transferir, aceitar IA). Invalida o detalhe do lead
 * e as listas do Kanban para tudo refletir na hora.
 */
export function useLeadActions(id: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['lead', id] });
    qc.invalidateQueries({ queryKey: ['leads'] });
  };

  const patch = useMutation({ mutationFn: (p: LeadPatch) => patchLead(id, p), onSuccess: invalidate });
  const transfer = useMutation({ mutationFn: (brokerId: string) => transferLead(id, brokerId), onSuccess: invalidate });
  const acceptAi = useMutation({ mutationFn: () => acceptAiTemperature(id), onSuccess: invalidate });

  return { patch, transfer, acceptAi };
}
