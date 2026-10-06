'use client';

import { apiFetch } from './client';
import type { LeadCampaign, LeadDetail, LeadInterest, LeadSummary, Temperature } from '@/lib/types';

/** Campanhas de origem do Meta Ads, com contagem de leads (listas por campanha). */
export function getLeadCampaigns(): Promise<LeadCampaign[]> {
  return apiFetch<LeadCampaign[]>('lead-campaigns');
}

/** Empreendimentos/produtos distintos (de leads.interest) com contagem, para o filtro. */
export function getLeadInterests(): Promise<LeadInterest[]> {
  return apiFetch<LeadInterest[]>('leads/interests');
}

/** Contador da caixa "Responderam" (base antiga que respondeu, aguardando triagem). */
export function getInboxCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('leads/inbox-count');
}

export interface RespondedCampaign {
  campaignId: string | null;
  campaignName: string | null;
  total: number;
  unread: number;
}

/** Seletor da caixa "Responderam": campanhas com leads que responderam (+ "Sem campanha"). */
export function getRespondedCampaigns(): Promise<RespondedCampaign[]> {
  return apiFetch<RespondedCampaign[]>('leads/responded-campaigns');
}

/** "Trazer para o funil": tira o lead da Base Antiga e atribui corretor (roleta). */
export function promoteLead(id: string): Promise<LeadSummary> {
  return apiFetch<LeadSummary>(`leads/${id}/promote`, { method: 'POST', body: JSON.stringify({}) });
}

/** Marca a conversa como lida (controle persistente de não lido). */
export function markLeadRead(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`leads/${id}/read`, { method: 'POST', body: JSON.stringify({}) });
}

export interface LeadFilters {
  q?: string;
  temperature?: Temperature | null;
  brokerId?: string | null;
  source?: string | null;
  /** Campanha de origem do Meta Ads. */
  campaign?: string | null;
  /** Etiqueta (ex.: "Proprietário", "Base Antiga"). */
  tag?: string | null;
  /** Empreendimento/produto de interesse. */
  interest?: string | null;
  /** Motivo de perda (na etapa Perdido). */
  lossReasonId?: string | null;
  /** Só leads que já responderam. */
  responded?: boolean;
  /** Filtra pela campanha que a resposta está respondendo (caixa por campanha). */
  respondingCampaignId?: string | null;
  /** 'none' = respostas diretas (sem campanha). */
  respondingCampaign?: 'none' | null;
  /** Inclui a Base Antiga (fora do Kanban por padrão). */
  includeOld?: boolean;
  limit?: number;
}

/** Monta a query string dos filtros de /leads (só o que estiver preenchido). */
export function buildLeadQuery(f: LeadFilters): string {
  const p = new URLSearchParams();
  if (f.q?.trim()) p.set('q', f.q.trim());
  if (f.temperature) p.set('temperature', f.temperature);
  if (f.brokerId) p.set('brokerId', f.brokerId);
  if (f.source) p.set('source', f.source);
  if (f.campaign) p.set('campaign', f.campaign);
  if (f.tag) p.set('tag', f.tag);
  if (f.interest) p.set('interest', f.interest);
  if (f.lossReasonId) p.set('lossReasonId', f.lossReasonId);
  if (f.responded) p.set('responded', 'true');
  if (f.respondingCampaignId) p.set('respondingCampaignId', f.respondingCampaignId);
  if (f.respondingCampaign) p.set('respondingCampaign', f.respondingCampaign);
  if (f.includeOld) p.set('includeOld', 'true');
  if (f.limit) p.set('limit', String(f.limit));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function getLeads(f: LeadFilters): Promise<LeadSummary[]> {
  return apiFetch<LeadSummary[]>(`leads${buildLeadQuery(f)}`);
}

/** Campos aceitos na edição rápida do lead (PATCH /leads/:id). */
export interface LeadPatch {
  /** Chave da etapa de destino. */
  stage?: string;
  temperature?: Temperature;
  name?: string;
  email?: string;
  interest?: string;
  notes?: string;
  tags?: string[];
  /** Obrigatório ao mover para a etapa de papel LOST (Perdido). */
  lossReasonId?: string | null;
}

export function patchLead(id: string, patch: LeadPatch): Promise<LeadSummary> {
  return apiFetch<LeadSummary>(`leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** Detalhe do lead: dados + régua (cadence) + linha do tempo (events). */
export function getLeadDetail(id: string): Promise<LeadDetail> {
  return apiFetch<LeadDetail>(`leads/${id}`);
}

/** Transferência para outro corretor (só gestores). */
export function transferLead(id: string, brokerId: string): Promise<LeadSummary> {
  return apiFetch<LeadSummary>(`leads/${id}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ brokerId }),
  });
}

/** Aplica a temperatura sugerida pela IA. */
export function acceptAiTemperature(id: string): Promise<LeadSummary> {
  return apiFetch<LeadSummary>(`leads/${id}/accept-ai-temperature`, { method: 'POST' });
}

/** Campos do cadastro manual de um lead (POST /leads). */
export interface NewLead {
  name: string;
  phone?: string;
  email?: string;
  interest?: string;
  notes?: string;
  /** Só gestores; sem isso o lead entra pela roleta. */
  brokerId?: string;
  /** Inicia a régua de boas-vindas (por padrão, não). */
  startCadence?: boolean;
}

export function createLead(input: NewLead): Promise<{ lead: LeadSummary; duplicate: boolean }> {
  return apiFetch(`leads`, { method: 'POST', body: JSON.stringify(input) });
}

/** Uma linha da importação em massa da base antiga. */
export interface ImportRow {
  name: string;
  phone?: string;
  email?: string;
  interest?: string;
  notes?: string;
}

/** Resumo devolvido por POST /leads/import. */
export interface ImportResult {
  total: number;
  created: number;
  duplicate: number;
  errors: { row: number; name: string; message: string }[];
}

/** Importa a base antiga em massa (grava como "Base Antiga", sem roleta/cadência). */
export function importLeads(rows: ImportRow[]): Promise<ImportResult> {
  return apiFetch<ImportResult>(`leads/import`, {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}
