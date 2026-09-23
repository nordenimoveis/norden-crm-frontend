'use client';

import { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function Bubble({ m }: { m: ChatMessage }) {
  if (m.direction === 'system') {
    return (
      <div className="my-1 text-center text-xs text-muted-foreground">
        {m.text} · {formatDateTime(m.at)}
      </div>
    );
  }

  // Nota interna: cartão central discreto (não é balão de conversa).
  if (m.private) {
    return (
      <div className="flex justify-center py-1">
        <div className="max-w-[86%] rounded-xl border border-dashed border-accent/40 bg-accent/[0.07] px-4 py-2.5 text-center">
          <p className="mb-1 flex items-center justify-center gap-1 text-[0.66rem] font-semibold uppercase tracking-wide text-accent">
            <Lock className="size-3" /> Nota interna
          </p>
          {m.senderName && <p className="text-xs font-medium text-foreground">{m.senderName}</p>}
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{m.text}</p>
          <p className="mt-1 text-[0.66rem] text-muted-foreground/70">{formatDateTime(m.at)}</p>
        </div>
      </div>
    );
  }

  const out = m.direction === 'out';
  return (
    <div className={cn('flex', out ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm shadow-card after:absolute after:bottom-0 after:size-3',
          out
            ? 'rounded-br-md border border-sent-border bg-sent text-sent-foreground after:-right-1.5 after:bg-sent after:[clip-path:polygon(0_0,100%_100%,0_100%)]'
            : 'rounded-bl-md border border-border bg-card text-foreground after:-left-1.5 after:bg-card after:[clip-path:polygon(100%_0,100%_100%,0_100%)]',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{m.text}</p>
        <p className={cn('mt-1 text-[0.68rem]', out ? 'text-sent-foreground/60' : 'text-muted-foreground')}>
          {m.senderName ? `${m.senderName} · ` : ''}
          {formatDateTime(m.at)}
        </p>
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  hasOlder,
  loadingOlder,
  onLoadOlder,
  loading,
}: {
  messages: ChatMessage[];
  hasOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  loading: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  // Rola para o fim quando chega mensagem nova ou ao abrir.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lastId]);

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
      {hasOlder && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onLoadOlder} disabled={loadingOlder}>
            {loadingOlder ? 'Carregando…' : 'Carregar mais antigas'}
          </Button>
        </div>
      )}
      {loading && messages.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando conversa…</p>
      )}
      {!loading && messages.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Sem mensagens ainda.</p>
      )}
      {messages.map((m) => (
        <Bubble key={`${m.id}-${m.private ? 'n' : 'm'}`} m={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
