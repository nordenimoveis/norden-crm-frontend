'use client';

import { useQuery } from '@tanstack/react-query';
import { getStages } from '@/lib/api/pipeline';

/** Etapas do funil (fonte das colunas do Kanban). */
export function useStages() {
  return useQuery({
    queryKey: ['pipeline', 'stages'],
    queryFn: getStages,
    staleTime: 60_000,
  });
}
