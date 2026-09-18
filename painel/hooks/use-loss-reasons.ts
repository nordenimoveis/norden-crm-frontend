'use client';

import { useQuery } from '@tanstack/react-query';
import { getLossReasons } from '@/lib/api/loss-reasons';

/** Motivos de perda (para o seletor ao marcar Perdido e para a gestão). */
export function useLossReasons(enabled = true) {
  return useQuery({
    queryKey: ['loss-reasons'],
    queryFn: getLossReasons,
    enabled,
    staleTime: 60_000,
  });
}
