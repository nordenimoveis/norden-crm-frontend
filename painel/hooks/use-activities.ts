'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createActivity,
  deleteActivity,
  getAgenda,
  getAgendaCounts,
  getLeadActivities,
  setActivityDone,
  updateActivity,
  type ActivityPatch,
  type AgendaFilter,
  type AgendaSource,
  type NewActivity,
} from '@/lib/api/activities';
import type { ActivityType } from '@/lib/types';

/** Atividades de um negócio (lead). */
export function useLeadActivities(leadId: string | null) {
  return useQuery({
    queryKey: ['lead', leadId, 'activities'],
    queryFn: () => getLeadActivities(leadId as string),
    enabled: Boolean(leadId),
  });
}

/** Agenda global unificada (tela Atividades). */
export function useAgenda(filter: AgendaFilter, type?: ActivityType | null, source?: AgendaSource | null, brokerId?: string | null) {
  return useQuery({
    queryKey: ['agenda', filter, type ?? null, source ?? null, brokerId ?? null],
    queryFn: () => getAgenda({ filter, type, source, brokerId }),
    refetchInterval: 60_000,
  });
}

export function useAgendaCounts() {
  return useQuery({ queryKey: ['agenda-counts'], queryFn: getAgendaCounts, refetchInterval: 60_000 });
}

/** Ações de atividade com revalidação do lead e da agenda. */
export function useActivityActions(leadId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    if (leadId) qc.invalidateQueries({ queryKey: ['lead', leadId, 'activities'] });
    qc.invalidateQueries({ queryKey: ['agenda'] });
    qc.invalidateQueries({ queryKey: ['agenda-counts'] });
  };
  const create = useMutation({ mutationFn: (input: NewActivity) => createActivity(input), onSuccess: invalidate });
  const update = useMutation({ mutationFn: (v: { id: string; patch: ActivityPatch }) => updateActivity(v.id, v.patch), onSuccess: invalidate });
  const toggle = useMutation({ mutationFn: (v: { id: string; done: boolean }) => setActivityDone(v.id, v.done), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (id: string) => deleteActivity(id), onSuccess: invalidate });
  return { create, update, toggle, remove };
}
