'use client';

import { apiFetch } from './client';
import type { LeadTask } from '@/lib/types';

/** Tarefas pendentes visíveis ao usuário (corretor vê só as suas; gestor vê todas). */
export const getTasks = () => apiFetch<LeadTask[]>('tasks');

/** Conclui uma tarefa: "Falei com o cliente" (FEITA) ou "Não atendeu" (SEM_RESPOSTA). */
export const completeTask = (id: string, status: 'FEITA' | 'SEM_RESPOSTA', note?: string) =>
  apiFetch<{ id: string; status: string; doneAt: string | null }>(`tasks/${id}/done`, {
    method: 'POST',
    body: JSON.stringify({ status, note }),
  });
