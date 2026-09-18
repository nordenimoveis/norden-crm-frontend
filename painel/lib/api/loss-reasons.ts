'use client';

import { apiFetch } from './client';
import type { LossReason } from '@/lib/types';

export const getLossReasons = () => apiFetch<LossReason[]>('loss-reasons');

export const createLossReason = (label: string) =>
  apiFetch<LossReason>('loss-reasons', { method: 'POST', body: JSON.stringify({ label }) });

export const updateLossReason = (id: string, patch: { label?: string; active?: boolean }) =>
  apiFetch<LossReason>(`loss-reasons/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const deleteLossReason = (id: string) =>
  apiFetch<void>(`loss-reasons/${id}`, { method: 'DELETE' });
