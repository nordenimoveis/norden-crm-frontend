'use client';

import { apiFetch } from './client';
import type { Activity, ActivityType } from '@/lib/types';

export interface NewActivity {
  leadId: string;
  type: ActivityType;
  subject: string;
  notes?: string | null;
  dueAt?: string | null;
  durationMin?: number | null;
  brokerId?: string | null;
}

export type ActivityPatch = Partial<Omit<NewActivity, 'leadId'>>;
export type AgendaFilter = 'todas' | 'para_fazer' | 'vencido' | 'hoje' | 'concluido';

/** Atividades de um negócio (lead). */
export const getLeadActivities = (leadId: string) => apiFetch<Activity[]>(`leads/${leadId}/activities`);

/** Agenda global (tela Atividades). */
export function getAgenda(f: { filter: AgendaFilter; type?: ActivityType | null; brokerId?: string | null }): Promise<Activity[]> {
  const p = new URLSearchParams({ filter: f.filter });
  if (f.type) p.set('type', f.type);
  if (f.brokerId) p.set('brokerId', f.brokerId);
  return apiFetch<Activity[]>(`activities?${p.toString()}`);
}

export const getAgendaCounts = () => apiFetch<{ para_fazer: number; vencido: number; hoje: number }>('activities/counts');

export const createActivity = (input: NewActivity) =>
  apiFetch<Activity>('activities', { method: 'POST', body: JSON.stringify(input) });

export const updateActivity = (id: string, patch: ActivityPatch) =>
  apiFetch<Activity>(`activities/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const setActivityDone = (id: string, done: boolean) =>
  apiFetch<Activity>(`activities/${id}/done`, { method: 'POST', body: JSON.stringify({ done }) });

export const deleteActivity = (id: string) => apiFetch<void>(`activities/${id}`, { method: 'DELETE' });
