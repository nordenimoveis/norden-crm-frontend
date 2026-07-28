import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sincronizarImoveisImobzi, sincronizarLeadsImobzi } from '@/lib/imobzi-integracao-api';

export function useSincronizarImoveisImobzi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sincronizarImoveisImobzi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['imoveis'] }),
  });
}

export function useSincronizarLeadsImobzi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sincronizarLeadsImobzi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
}
