import { useMutation, useQueryClient } from '@tanstack/react-query';
import { atualizarLead, AtualizarLeadInput } from '@/lib/leads-api';

export function useAtualizarLead(leadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AtualizarLeadInput) => atualizarLead(leadId, input),
    onSuccess: () => {
      // Afeta tanto a ficha aberta no chat quanto o card no board/tabela
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
