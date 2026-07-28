import { apiFetch } from './api-client';

export type ResultadoSincronizacaoImobzi = { novos: number; atualizados: number; total: number };

export async function sincronizarImoveisImobzi(): Promise<ResultadoSincronizacaoImobzi> {
  return apiFetch<ResultadoSincronizacaoImobzi>('/api/imobzi/sync/imoveis', { method: 'POST' });
}

export async function sincronizarLeadsImobzi(): Promise<ResultadoSincronizacaoImobzi> {
  return apiFetch<ResultadoSincronizacaoImobzi>('/api/imobzi/sync/leads', { method: 'POST' });
}
