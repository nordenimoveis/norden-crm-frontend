'use client';

import { apiFetch } from './client';
import type { Campaign, CampaignFilters, CampaignRecipient, CampaignTemplate } from '@/lib/types';

/* Templates */
export const getCampaignTemplates = () => apiFetch<CampaignTemplate[]>('campaign-templates');

export const createCampaignTemplate = (input: { name: string; preview: string; paramSources: string[] }) =>
  apiFetch<CampaignTemplate>('campaign-templates', { method: 'POST', body: JSON.stringify(input) });

export const updateCampaignTemplate = (id: string, patch: Partial<{ name: string; preview: string; paramSources: string[]; active: boolean }>) =>
  apiFetch<CampaignTemplate>(`campaign-templates/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const deleteCampaignTemplate = (id: string) =>
  apiFetch<void>(`campaign-templates/${id}`, { method: 'DELETE' });

/** Sincroniza o catálogo com os templates aprovados na Meta. */
export const syncCampaignTemplates = () =>
  apiFetch<{ imported: number; updated: number; total: number }>('campaign-templates/sync', { method: 'POST', body: JSON.stringify({}) });

/* Campanhas */
export const getCampaigns = () => apiFetch<Campaign[]>('campaigns');

export const getCampaign = (id: string) => apiFetch<Campaign>(`campaigns/${id}`);

export const getCampaignRecipients = (id: string) =>
  apiFetch<CampaignRecipient[]>(`campaigns/${id}/recipients`);

export const previewAudience = (filters: CampaignFilters) =>
  apiFetch<{ count: number }>('campaigns/preview-audience', { method: 'POST', body: JSON.stringify(filters) });

export const createCampaign = (input: { name: string; templateId: string; filters: CampaignFilters }) =>
  apiFetch<Campaign>('campaigns', { method: 'POST', body: JSON.stringify(input) });

export const launchCampaign = (id: string, scheduledFor?: string | null) =>
  apiFetch<Campaign>(`campaigns/${id}/launch`, { method: 'POST', body: JSON.stringify({ scheduledFor: scheduledFor ?? null }) });

export const cancelCampaign = (id: string) =>
  apiFetch<Campaign>(`campaigns/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) });

export const deleteCampaign = (id: string) =>
  apiFetch<void>(`campaigns/${id}`, { method: 'DELETE' });
