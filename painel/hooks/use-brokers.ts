'use client';

import { useQuery } from '@tanstack/react-query';
import { getBrokers } from '@/lib/api/brokers';

/** Corretores ativos. Habilite só para gestores (corretor não precisa). */
export function useBrokers(enabled: boolean) {
  return useQuery({
    queryKey: ['brokers'],
    queryFn: getBrokers,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
