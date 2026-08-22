import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listarTemplates,
  criarTemplate,
  atualizarTemplate,
  sincronizarTemplatesMeta,
  CriarTemplateInput,
  AtualizarTemplateInput,
} from '@/lib/templates-api';

export function useTemplates() {
  return useQuery({
    queryKey: ['templates-mensagem'],
    queryFn: listarTemplates,
  });
}

export function useCriarTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarTemplateInput) => criarTemplate(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates-mensagem'] }),
  });
}

export function useAtualizarTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AtualizarTemplateInput }) => atualizarTemplate(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates-mensagem'] }),
  });
}

export function useSincronizarTemplatesMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sincronizarTemplatesMeta,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates-mensagem'] }),
  });
}
