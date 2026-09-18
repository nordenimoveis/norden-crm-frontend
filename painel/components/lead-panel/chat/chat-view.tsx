'use client';

import { useMemo } from 'react';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { MessageList } from './message-list';
import { Composer } from './composer';

export function ChatView({ leadId, draft, onUsedDraft }: { leadId: string; draft?: string | null; onUsedDraft?: () => void }) {
  const q = useMessages(leadId);
  const pages = useMemo(() => q.data?.pages ?? [], [q.data]);
  const first = pages[0];

  const messages = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const p of pages) for (const m of p.messages) map.set(`${m.id}-${m.private ? 'n' : 'm'}`, m);
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [pages]);

  return (
    <div className="flex h-full flex-col">
      {q.isError ? (
        <p className="flex-1 p-6 text-center text-sm text-muted-foreground">
          Não foi possível carregar a conversa.
        </p>
      ) : (
        <MessageList
          messages={messages}
          loading={q.isLoading}
          hasOlder={Boolean(q.hasNextPage)}
          loadingOlder={q.isFetchingNextPage}
          onLoadOlder={() => q.fetchNextPage()}
        />
      )}
      <Composer
        leadId={leadId}
        canSendFreeText={Boolean(first?.canSendFreeText)}
        windowExpiresAt={first?.windowExpiresAt ?? null}
        draft={draft}
        onUsedDraft={onUsedDraft}
      />
    </div>
  );
}
