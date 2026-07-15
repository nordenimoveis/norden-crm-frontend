import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { obterPusherClient } from '@/lib/pusher-client';
import { Lead, ListaLeadsResposta } from '@/lib/types';

type LeadAtualizadoPayload = {
  lead: Pick<Lead, 'id' | 'status' | 'atendimentoHumano' | 'corretorId'> & { temperatura?: string };
};

/**
 * Assina o canal compartilhado do board (`private-kanban`) uma vez, pelo
 * tempo de vida do board. Ao receber `lead_atualizado`, faz um patch
 * cirúrgico no card certo em QUALQUER variação de filtro já em cache
 * (`setQueriesData` com chave parcial `['leads']` cobre `['leads', {corretorId: 'x'}]`
 * e `['leads', {corretorId: undefined}]` ao mesmo tempo) — sem refetch da lista inteira.
 *
 * É isso que faz o card virar "Aguardando Resposta" sozinho quando o lead
 * responde no WhatsApp, mesmo com o corretor de olho no board.
 */
export function usePusherKanban() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const pusher = obterPusherClient();
    const canal = pusher.subscribe('private-kanban');

    canal.bind('lead_atualizado', ({ lead }: LeadAtualizadoPayload) => {
      queryClient.setQueriesData<ListaLeadsResposta>({ queryKey: ['leads'] }, (atual) => {
        if (!atual) return atual;
        return {
          ...atual,
          items: atual.items.map((item) =>
            item.id === lead.id
              ? {
                  ...item,
                  status: lead.status,
                  atendimentoHumano: lead.atendimentoHumano,
                  corretorId: lead.corretorId,
                }
              : item
          ),
        };
      });
    });

    return () => {
      pusher.unsubscribe('private-kanban');
    };
  }, [queryClient]);
}
