import { useQuery } from '@tanstack/react-query';
import { buscarVisitasAgendadas } from '@/lib/leads-api';

export function useVisitasAgendadas() {
  return useQuery({
    queryKey: ['leads', 'visitas-agendadas'],
    queryFn: buscarVisitasAgendadas,
  });
}
