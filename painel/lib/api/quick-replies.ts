'use client';

import { apiFetch } from './client';
import type { QuickReply } from '@/lib/types';

/** Respostas rápidas globais + pessoais do usuário. */
export function getQuickReplies(): Promise<QuickReply[]> {
  return apiFetch<QuickReply[]>('quick-replies');
}

/** Texto da resposta rápida com as variáveis preenchidas para o lead. */
export function renderQuickReply(id: string, leadId: string): Promise<{ text: string }> {
  return apiFetch<{ text: string }>(`quick-replies/${id}/render`, {
    method: 'POST',
    body: JSON.stringify({ leadId }),
  });
}

export function createQuickReply(input: { shortcut: string; title: string; body: string; global: boolean }): Promise<QuickReply> {
  return apiFetch<QuickReply>('quick-replies', { method: 'POST', body: JSON.stringify(input) });
}

export function updateQuickReply(id: string, patch: Partial<{ shortcut: string; title: string; body: string }>): Promise<QuickReply> {
  return apiFetch<QuickReply>(`quick-replies/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function deleteQuickReply(id: string): Promise<void> {
  return apiFetch<void>(`quick-replies/${id}`, { method: 'DELETE' });
}
