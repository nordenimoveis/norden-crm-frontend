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
  const out = m.direction === 'out';
  const note = m.private;
  return (
    <div className={cn('flex', out ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-card',
          note
            ? 'border border-dashed border-accent/40 bg-accent/[0.08] text-foreground'
            : out
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground',
        )}
      >
        {note && (
          <p className="mb-1 flex items-center gap-1 text-[0.7rem] font-medium uppercase tracking-wide text-accent">
            <Lock className="size-3" /> Nota interna
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{m.text}</p>
        <p className={cn('mt-1 text-[0.7rem]', out && !note ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
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
