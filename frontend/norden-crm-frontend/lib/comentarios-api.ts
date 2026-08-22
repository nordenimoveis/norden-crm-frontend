import { apiFetch } from './api-client';
import { Canal, ComentarioSocial } from './types';

export type FiltroComentarios = {
  canal?: Canal;
  respondido?: boolean;
  busca?: string;
};

export async function listarComentarios(filtro: FiltroComentarios = {}): Promise<ComentarioSocial[]> {
  const params = new URLSearchParams();
  if (filtro.canal) params.set('canal', filtro.canal);
  if (filtro.respondido !== undefined) params.set('respondido', String(filtro.respondido));
  if (filtro.busca) params.set('busca', filtro.busca);
  const query = params.toString();
  return apiFetch<ComentarioSocial[]>(`/api/mensageria/comentarios${query ? `?${query}` : ''}`);
}

export async function responderComentario(
  comentarioId: string,
  texto: string
): Promise<{ comentario: ComentarioSocial; resposta: ComentarioSocial | null }> {
  return apiFetch(`/api/mensageria/comentarios/${comentarioId}/responder`, {
    method: 'POST',
    body: { texto },
  });
}
