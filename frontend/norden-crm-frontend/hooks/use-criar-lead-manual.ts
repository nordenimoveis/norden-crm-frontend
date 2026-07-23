import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criarLeadManual, CriarLeadManualInput } from '@/lib/leads-api';

export function useCriarLeadManual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CriarLeadManualInput) => criarLeadManual(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
