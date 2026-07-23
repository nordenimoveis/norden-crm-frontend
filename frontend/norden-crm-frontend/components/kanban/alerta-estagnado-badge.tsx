import { AlertCircle, Clock } from 'lucide-react';
import { AlertaLead } from '@/lib/types';
import { cn } from '@/lib/utils';

export function AlertaEstagnadoBadge({
  alerta,
  horasParado,
}: {
  alerta: AlertaLead;
  horasParado: number | null;
}) {
  if (!alerta) return null;

  const tempoLegivel =
    horasParado !== null && horasParado >= 24
      ? `${Math.floor(horasParado / 24)}d`
      : `${horasParado ?? 0}h`;

  const config =
    alerta === 'aguardando_resposta'
      ? {
          icone: AlertCircle,
          texto: `Aguardando resposta há ${tempoLegivel}`,
          classe: 'bg-red-50 text-red-700',
        }
      : {
          icone: Clock,
          texto: `Sem atividade há ${tempoLegivel}`,
          classe: 'bg-amber-50 text-amber-800',
        };

  const Icone = config.icone;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        config.classe
      )}
      title={config.texto}
    >
      <Icone className="h-3 w-3" />
      {config.texto}
    </span>
  );
}
