'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { completeTask, getTasks } from '@/lib/api/tasks';

/** Lista de tarefas pendentes (usada na tela /tarefas e no contador do topo). */
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
    // Rede de segurança caso um evento SSE se perca.
    refetchInterval: 60_000,
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: 'FEITA' | 'SEM_RESPOSTA'; note?: string }) =>
      completeTask(v.id, v.status, v.note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
