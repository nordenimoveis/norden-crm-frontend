import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listarCampanhas,
  buscarCampanha,
  previewPublico,
  criarCampanha,
  marcarCampanhaComoPronta,
  deletarCampanha,
  CriarCampanhaInput,
} from '@/lib/campanhas-api';
import { FiltroPublico } from '@/lib/types';

export function useCampanhas() {
  return useQuery({
    queryKey: ['campanhas-disparo'],
    queryFn: listarCampanhas,
  });
}

export function useCampanhaDetalhe(id: string | null) {
  return useQuery({
    queryKey: ['campanhas-disparo', id],
    queryFn: () => buscarCampanha(id!),
    enabled: !!id,
  });
}

export function usePreviewPublico(filtro: FiltroPublico, habilitado: boolean) {
  return useQuery({
    queryKey: ['campanhas-disparo', 'preview-publico', filtro],
    queryFn: () => previewPublico(filtro),
    enabled: habilitado,
  });
}

export function useCriarCampanha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarCampanhaInput) => criarCampanha(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campanhas-disparo'] }),
  });
}

export function useMarcarCampanhaComoPronta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marcarCampanhaComoPronta(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campanhas-disparo'] }),
  });
}

export function useDeletarCampanha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletarCampanha(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campanhas-disparo'] }),
  });
}
