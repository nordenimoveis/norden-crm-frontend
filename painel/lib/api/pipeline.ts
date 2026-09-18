'use client';

import { apiFetch } from './client';
import type { PipelineStage } from '@/lib/types';

export const getStages = () => apiFetch<PipelineStage[]>('pipeline/stages');

export const createStage = (label: string) =>
  apiFetch<PipelineStage>('pipeline/stages', { method: 'POST', body: JSON.stringify({ label }) });

export const renameStage = (id: string, label: string) =>
  apiFetch<PipelineStage>(`pipeline/stages/${id}`, { method: 'PATCH', body: JSON.stringify({ label }) });

export const reorderStages = (ids: string[]) =>
  apiFetch<PipelineStage[]>('pipeline/stages/reorder', { method: 'POST', body: JSON.stringify({ ids }) });

export const deleteStage = (id: string) =>
  apiFetch<void>(`pipeline/stages/${id}`, { method: 'DELETE' });
