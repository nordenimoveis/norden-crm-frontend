import { useMutation, useQueryClient } from '@tanstack/react-query';
import { enviarMensagemTexto } from '@/lib/chat-api';
import { Canal, LeadDetalhado, Mensagem } from '@/lib/types';

/**
 * Envio otimista: o balão aparece na hora (status 'pendente', id temporário),
 * antes mesmo da resposta do backend chegar. Quando a resposta chega, o
 * balão temporário é substituído pelo registro real (com o id de verdade) —
 * isso evita duplicar a mensagem quando o evento `nova_mensagem` do Pusher
 * chegar depois (o listener do Pusher ignora mensagens cujo id já existe).
 */
export function useEnviarMensagem(
  leadId: string,
  telefone: string | null,
  canal: Canal = 'whatsapp'
) {
  const queryClient = useQueryClient();
  const queryKey = ['lead', leadId];

  return useMutation({
    mutationFn: (texto: string) => enviarMensagemTexto(leadId, telefone, texto, canal),

    onMutate: async (texto: string) => {
      await queryClient.cancelQueries({ queryKey });

      const idTemporario = `temp-${Date.now()}`;
      const mensagemOtimista: Mensagem = {
        id: idTemporario,
        leadId,
        direcao: 'enviada',
        conteudo: texto,
        canal,
        status: 'pendente',
        enviadaPorUsuarioId: null,
        enviadaPorUsuario: null,
        criadoEm: new Date().toISOString(),
      };

      queryClient.setQueryData<LeadDetalhado>(queryKey, (atual) =>
        atual ? { ...atual, mensagens: [...atual.mensagens, mensagemOtimista] } : atual
      );

      return { idTemporario };
    },

    onSuccess: (mensagemReal, _texto, contexto) => {
      queryClient.setQueryData<LeadDetalhado>(queryKey, (atual) => {
        if (!atual) return atual;
        return {
          ...atual,
          mensagens: atual.mensagens.map((m) =>
            m.id === contexto?.idTemporario ? mensagemReal : m
          ),
        };
      });
    },

    onError: (_err, _texto, contexto) => {
      // Falhou — remove o balão otimista (o corretor precisa tentar de novo)
      queryClient.setQueryData<LeadDetalhado>(queryKey, (atual) => {
        if (!atual) return atual;
        return {
          ...atual,
          mensagens: atual.mensagens.filter((m) => m.id !== contexto?.idTemporario),
        };
      });
    },
  });
}
