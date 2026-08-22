import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { obterPusherClient } from '@/lib/pusher-client';
import {
  listarComentarios,
  responderComentario,
  FiltroComentarios,
} from '@/lib/comentarios-api';

export function useComentarios(filtro: FiltroComentarios) {
  return useQuery({
    queryKey: ['comentarios', filtro],
    queryFn: () => listarComentarios(filtro),
    // Comentários novos chegam por Pusher (canal private-comentarios); um
    // refetch periódico leve garante que nada se perca se um evento falhar.
    refetchInterval: 60_000,
  });
}

/**
 * Assina o canal de comentários (`private-comentarios`) e invalida a lista
 * quando um comentário novo chega — é o que faz a caixa de comentários
 * atualizar em tempo real, sem esperar o refetch periódico.
 */
export function usePusherComentarios() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const pusher = obterPusherClient();
    const canal = pusher.subscribe('private-comentarios');
    canal.bind('novo_comentario', () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios'] });
    });
    return () => {
      pusher.unsubscribe('private-comentarios');
    };
  }, [queryClient]);
}

export function useResponderComentario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comentarioId, texto }: { comentarioId: string; texto: string }) =>
      responderComentario(comentarioId, texto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios'] });
    },
  });
}
