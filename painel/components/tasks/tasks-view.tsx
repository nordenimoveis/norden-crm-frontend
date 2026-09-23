'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, PhoneCall, PhoneOff, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/session-provider';
import { useTasks, useCompleteTask } from '@/hooks/use-tasks';
import { ApiError } from '@/lib/api/client';
import { isManager, type LeadTask } from '@/lib/types';
import { cn } from '@/lib/utils';

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Não foi possível concluir');

/** Só dígitos, para os links tel: e wa.me. */
function digits(phone: string | null): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '');
  return d.length >= 10 ? d : null;
}

/** Rótulo curto para o vencimento ("hoje", "atrasada", data). */
function dueLabel(iso: string): string {
  const due = new Date(iso);
  const today = new Date();
  const sameDay = due.toDateString() === today.toDateString();
  if (sameDay) return 'para hoje';
  if (due.getTime() < today.getTime()) return 'atrasada';
  return due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function TasksView() {
  const user = useSession();
  const manager = isManager(user.role);
  const { data: tasks = [], isLoading, isError } = useTasks();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-medium tracking-tight">Tarefas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ligações sugeridas pela régua quando o cliente ainda não respondeu.
          {manager ? ' Você vê as de todos os corretores.' : ' Ligue e registre o resultado.'}
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Não foi possível carregar as tarefas. Tente recarregar a página.
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card/50 py-14 text-center">
          <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-500" />
          <p className="text-sm font-medium">Nenhuma tarefa pendente</p>
          <p className="text-xs text-muted-foreground">Tudo em dia por aqui.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} showBroker={manager} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskCard({ task, showBroker }: { task: LeadTask; showBroker: boolean }) {
  const complete = useCompleteTask();
  const [error, setError] = useState<string | null>(null);
  const d = digits(task.leadPhone);
  const overdue = dueLabel(task.dueAt) === 'atrasada';

  const finish = (status: 'FEITA' | 'SEM_RESPOSTA') => {
    setError(null);
    complete.mutate({ id: task.id, status }, { onError: (e) => setError(msg(e)) });
  };

  return (
    <li className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PhoneCall className="size-4 shrink-0 text-accent" />
            <Link
              href={`/kanban?lead=${task.leadId}`}
              className="truncate font-medium text-foreground hover:underline"
            >
              {task.leadName}
            </Link>
          </div>
          {task.leadInterest && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{task.leadInterest}</p>
          )}
          {showBroker && task.brokerName && (
            <p className="mt-0.5 text-xs text-muted-foreground">Corretor: {task.brokerName}</p>
          )}
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
            overdue
              ? 'bg-destructive/10 text-destructive'
              : 'bg-secondary text-secondary-foreground',
          )}
        >
          {dueLabel(task.dueAt)}
        </span>
      </div>

      {/* Ações de contato */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {d ? (
          <>
            <Button asChild size="sm" variant="secondary">
              <a href={`tel:+${d}`}>
                <PhoneCall className="size-4" /> Ligar
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href={`https://wa.me/${d}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Sem telefone cadastrado</span>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {/* Resultado da ligação */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          onClick={() => finish('FEITA')}
          disabled={complete.isPending}
          className="bg-emerald-600 text-white hover:bg-emerald-600/90"
        >
          <Check className="size-4" /> Falei com o cliente
        </Button>
        <Button size="sm" variant="outline" onClick={() => finish('SEM_RESPOSTA')} disabled={complete.isPending}>
          <PhoneOff className="size-4" /> Não atendeu
        </Button>
      </div>
    </li>
  );
}
