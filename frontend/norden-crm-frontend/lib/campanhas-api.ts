import { apiFetch } from './api-client';
import { CampanhaDisparo, CampanhaDisparoDetalhado, FiltroPublico } from './types';

export type CriarCampanhaInput = {
  nome: string;
  templateMensagemId: string;
  filtroPublico: FiltroPublico;
};

export async function listarCampanhas(): Promise<CampanhaDisparo[]> {
  return apiFetch<CampanhaDisparo[]>('/api/campanhas-disparo');
}

export async function buscarCampanha(id: string): Promise<CampanhaDisparoDetalhado> {
  return apiFetch<CampanhaDisparoDetalhado>(`/api/campanhas-disparo/${id}`);
}

export async function previewPublico(filtro: FiltroPublico): Promise<{ total: number }> {
  const params = new URLSearchParams();
  if (filtro.origem) params.set('origem', filtro.origem);
  if (filtro.status) params.set('status', filtro.status);
  if (filtro.temperatura) params.set('temperatura', filtro.temperatura);
  if (filtro.busca) params.set('busca', filtro.busca);

  return apiFetch<{ total: number }>(`/api/campanhas-disparo/preview-publico?${params.toString()}`);
}

export async function criarCampanha(input: CriarCampanhaInput): Promise<CampanhaDisparo> {
  return apiFetch<CampanhaDisparo>('/api/campanhas-disparo', { method: 'POST', body: input });
}

export async function marcarCampanhaComoPronta(id: string): Promise<CampanhaDisparo> {
  return apiFetch<CampanhaDisparo>(`/api/campanhas-disparo/${id}/marcar-pronta`, { method: 'POST' });
}

export async function iniciarEnvioCampanha(id: string): Promise<CampanhaDisparo> {
  return apiFetch<CampanhaDisparo>(`/api/campanhas-disparo/${id}/iniciar-envio`, { method: 'POST' });
}

export async function deletarCampanha(id: string): Promise<void> {
  return apiFetch<void>(`/api/campanhas-disparo/${id}`, { method: 'DELETE' });
}
