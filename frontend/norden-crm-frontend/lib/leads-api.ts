import { apiFetch } from './api-client';
import { Lead, ListaLeadsResposta, LeadStatus, LeadOrigem, LeadTemperatura, Usuario } from './types';

export type FiltrosLeads = {
  corretorId?: string;
};

export async function buscarLeadsDoBoard(filtros: FiltrosLeads = {}): Promise<ListaLeadsResposta> {
  const params = new URLSearchParams({ pageSize: '100' });
  if (filtros.corretorId) params.set('corretorId', filtros.corretorId);

  return apiFetch<ListaLeadsResposta>(`/api/leads?${params.toString()}`);
}

export async function atualizarStatusLead(id: string, status: LeadStatus): Promise<Lead> {
  return apiFetch<Lead>(`/api/leads/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return apiFetch<Usuario[]>('/api/usuarios');
}

export type FiltrosTabelaLeads = {
  busca?: string;
  status?: LeadStatus;
  origem?: LeadOrigem;
  temperatura?: LeadTemperatura;
  corretorId?: string;
  page?: number;
  pageSize?: number;
};

export async function buscarLeadsTabela(filtros: FiltrosTabelaLeads): Promise<ListaLeadsResposta> {
  const params = new URLSearchParams({
    page: String(filtros.page ?? 1),
    pageSize: String(filtros.pageSize ?? 15),
  });

  if (filtros.busca) params.set('busca', filtros.busca);
  if (filtros.status) params.set('status', filtros.status);
  if (filtros.origem) params.set('origem', filtros.origem);
  if (filtros.temperatura) params.set('temperatura', filtros.temperatura);
  if (filtros.corretorId) params.set('corretorId', filtros.corretorId);

  return apiFetch<ListaLeadsResposta>(`/api/leads?${params.toString()}`);
}

export async function transferirLead(leadId: string, corretorId: string): Promise<Lead> {
  return apiFetch<Lead>(`/api/leads/${leadId}/atribuir`, {
    method: 'PATCH',
    body: { corretorId },
  });
}

export type AtualizarLeadInput = {
  nome?: string;
  telefone?: string;
  email?: string;
};

export async function atualizarLead(leadId: string, input: AtualizarLeadInput): Promise<Lead> {
  return apiFetch<Lead>(`/api/leads/${leadId}`, {
    method: 'PATCH',
    body: input,
  });
}
