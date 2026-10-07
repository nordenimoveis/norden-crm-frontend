import { Phone, MessageCircle, Users, Building2, CheckSquare, Flag, Mail, type LucideIcon } from 'lucide-react';
import type { ActivityType } from '@/lib/types';

/** Tipos de atividade (ícone + rótulo), estilo Pipedrive, adaptado ao imobiliário. */
export const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: LucideIcon }[] = [
  { type: 'LIGACAO', label: 'Ligação', icon: Phone },
  { type: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
  { type: 'REUNIAO', label: 'Reunião', icon: Users },
  { type: 'VISITA', label: 'Visita', icon: Building2 },
  { type: 'TAREFA', label: 'Tarefa', icon: CheckSquare },
  { type: 'PRAZO', label: 'Prazo', icon: Flag },
  { type: 'EMAIL', label: 'E-mail', icon: Mail },
];

export const ACTIVITY_META: Record<ActivityType, { label: string; icon: LucideIcon }> = Object.fromEntries(
  ACTIVITY_TYPES.map((a) => [a.type, { label: a.label, icon: a.icon }]),
) as Record<ActivityType, { label: string; icon: LucideIcon }>;

/** Data/hora amigável + se está vencida (para destaque vermelho). */
export function dueInfo(dueAt: string | null, done: boolean): { label: string; overdue: boolean; today: boolean } {
  if (!dueAt) return { label: 'Sem data', overdue: false, today: false };
  const d = new Date(dueAt);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const overdue = !done && d.getTime() < now.getTime();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const hasTime = time !== '00:00';
  let label: string;
  if (sameDay) label = hasTime ? `Hoje, ${time}` : 'Hoje';
  else {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) label = hasTime ? `Amanhã, ${time}` : 'Amanhã';
    else {
      const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      label = hasTime ? `${date} ${time}` : date;
    }
  }
  return { label, overdue, today: sameDay };
}
