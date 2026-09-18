'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelCampaign,
  createCampaign,
  createCampaignTemplate,
  deleteCampaign,
  deleteCampaignTemplate,
  getCampaignTemplates,
  getCampaigns,
  launchCampaign,
  updateCampaignTemplate,
} from '@/lib/api/campaigns';
import type { CampaignFilters } from '@/lib/types';

export function useCampaignTemplates(enabled = true) {
  return useQuery({ queryKey: ['campaign-templates'], queryFn: getCampaignTemplates, enabled, staleTime: 60_000 });
}

export function useCampaigns(enabled = true) {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: getCampaigns,
    enabled,
    // Enquanto há campanha enviando, atualiza o progresso sozinho.
    refetchInterval: (q) => (q.state.data?.some((c) => c.status === 'ENVIANDO') ? 4000 : false),
  });
}

export function useTemplateMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['campaign-templates'] });
  return {
    create: useMutation({ mutationFn: (i: { name: string; preview: string; paramSources: string[] }) => createCampaignTemplate(i), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (v: { id: string; patch: Record<string, unknown> }) => updateCampaignTemplate(v.id, v.patch), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => deleteCampaignTemplate(id), onSuccess: invalidate }),
  };
}

export function useCampaignMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['campaigns'] });
  return {
    create: useMutation({ mutationFn: (i: { name: string; templateId: string; filters: CampaignFilters }) => createCampaign(i), onSuccess: invalidate }),
    launch: useMutation({ mutationFn: (v: { id: string; scheduledFor?: string | null }) => launchCampaign(v.id, v.scheduledFor), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: string) => cancelCampaign(id), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => deleteCampaign(id), onSuccess: invalidate }),
  };
}
