'use client';

import { apiFetch } from './client';
import type { ChatMessage, LeadTemplate, MessagesPage } from '@/lib/types';

/** Histórico do chat. `before` = id da mensagem mais antiga já carregada. */
export function getMessages(leadId: string, before?: number): Promise<MessagesPage> {
  const qs = before ? `?before=${before}` : '';
  return apiFetch<MessagesPage>(`leads/${leadId}/messages${qs}`);
}

/** Texto livre (só dentro da janela de 24h; fora disso a API responde 409). */
export function sendMessage(leadId: string, content: string): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`leads/${leadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

/** Nota interna (o cliente não vê). */
export function sendNote(leadId: string, content: string): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`leads/${leadId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

/** Templates aprovados, já preenchidos para o lead. */
export function getTemplates(leadId: string): Promise<LeadTemplate[]> {
  return apiFetch<LeadTemplate[]>(`leads/${leadId}/templates`);
}

/** Envia um template aprovado (funciona fora da janela de 24h). */
export function sendTemplate(leadId: string, step: number): Promise<unknown> {
  return apiFetch(`leads/${leadId}/template`, {
    method: 'POST',
    body: JSON.stringify({ step }),
  });
}
