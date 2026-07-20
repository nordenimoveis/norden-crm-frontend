import { useMutation, useQueryClient } from '@tanstack/react-query';
import { atualizarStatusLead, FiltrosLeads } from '@/lib/leads-api';
import { Lead, LeadStatus, ListaLeadsResposta } from '@/lib/types';

/**
 * Optimistic UI do drag-and-drop: o card muda de coluna NA HORA (antes da
 * resposta do backend chegar), e só reverte se a requisição falhar. É isso
 * que faz o board parecer instantâneo em vez de travar esperando um round-trip.
 */
export function useAtualizarStatusLead(filtros: FiltrosLeads) {
  const queryClient = useQueryClient();
  const queryKey = ['leads', 'board', filtros];

  return useMutation({
    mutationFn: ({ leadId, novoStatus }: { leadId: string; novoStatus: LeadStatus }) =>
      atualizarStatusLead(leadId, novoStatus),

    onMutate: async ({ leadId, novoStatus }) => {
      await queryClient.cancelQueries({ queryKey });

      const dadosAnteriores = queryClient.getQueryData<ListaLeadsResposta>(queryKey);

      queryClient.setQueryData<ListaLeadsResposta>(queryKey, (atual) => {
        if (!atual) return atual;
        return {
          ...atual,
          items: atual.items.map((lead: Lead) =>
            lead.id === leadId ? { ...lead, status: novoStatus } : lead
          ),
        };
      });

      return { dadosAnteriores };
    },

    onError: (_err, _variaveis, contexto) => {
      if (contexto?.dadosAnteriores) {
        queryClient.setQueryData(queryKey, contexto.dadosAnteriores);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
