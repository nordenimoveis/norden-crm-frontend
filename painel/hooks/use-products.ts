'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api/products';

/** Catálogo de empreendimentos (para a gestão e filtros). */
export function useProducts(enabled = true) {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    enabled,
    staleTime: 60_000,
  });
}
