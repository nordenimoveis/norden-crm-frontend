import { useMutation, useQueryClient } from '@tanstack/react-query';
import { arquivarLead, deletarLead } from '@/lib/leads-api';

/**
 * Ações destrutivas/de organização sobre um lead (arquivar e excluir).
 * Invalidam a família de queries 'leads' (board/inbox e tabela) para a lista
 * refletir na hora — o backend já esconde arquivados por padrão.
 */
export function useArquivarLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, arquivada }: { leadId: string; arquivada: boolean }) =>
      arquivarLead(leadId, arquivada),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeletarLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadId: string) => deletarLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
