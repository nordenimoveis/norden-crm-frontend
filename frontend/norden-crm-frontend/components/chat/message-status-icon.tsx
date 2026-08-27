import { Check, CheckCheck, Clock, AlertTriangle } from 'lucide-react';
import { MensagemStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export function MessageStatusIcon({ status, erro }: { status: MensagemStatus; erro?: string | null }) {
  switch (status) {
    case 'pendente':
      return <Clock className="h-3 w-3 text-sidebar-muted" />;
    case 'enviada':
      return <Check className="h-3 w-3 text-sidebar-muted" />;
    case 'entregue':
      return <CheckCheck className="h-3 w-3 text-sidebar-muted" />;
    case 'lida':
      // Tique duplo azul — convenção universal de "lido" em apps de mensagem
      return <CheckCheck className={cn('h-3 w-3 text-sky-400')} />;
    case 'falhou':
      return (
        <AlertTriangle
          className="h-3 w-3 text-red-400"
          aria-label={erro ? `Não entregue: ${erro}` : 'Não entregue'}
        >
          <title>{erro ? `Não entregue: ${erro}` : 'Não entregue'}</title>
        </AlertTriangle>
      );
    default:
      return null;
  }
}
