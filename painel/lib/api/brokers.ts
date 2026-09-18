'use client';

import { apiFetch } from './client';
import type { Broker } from '@/lib/types';

/** Corretores ativos (para filtro e transferência). Só gestores usam. */
export function getBrokers(): Promise<Broker[]> {
  return apiFetch<Broker[]>('brokers');
}
