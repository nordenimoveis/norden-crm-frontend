'use client';

import { apiFetch } from './client';
import type { LeadDetail, LeadSummary, Temperature } from '@/lib/types';

export interface LeadFilters {
  q?: string;
  temperature?: Temperature | null;
  brokerId?: string | null;
  source?: string | null;
  /** Inclui a Base Antiga (fora do Kanban por padrão). */
  includeOld?: boolean;
}

/** Monta a query string dos filtros de /leads (só o que estiver preenchido). */
export function buildLeadQuery(f: LeadFilters): string {
  const p = new URLSearchParams();
  if (f.q?.trim()) p.set('q', f.q.trim());
  if (f.temperature) p.set('temperature', f.temperature);
  if (f.brokerId) p.set('brokerId', f.brokerId);
  if (f.source) p.set('source', f.source);
  if (f.includeOld) p.set('includeOld', 'true');
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
