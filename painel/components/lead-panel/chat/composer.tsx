'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSendActions } from '@/hooks/use-messages';
import { useQuickReplies } from '@/hooks/use-quick-replies';
import { renderQuickReply } from '@/lib/api/quick-replies';
import { ApiError } from '@/lib/api/client';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { TemplatePicker } from './template-picker';

type Mode = 'msg' | 'note';

export function Composer({
  leadId,
  canSendFreeText,
  windowExpiresAt,
  draft,
  onUsedDraft,
}: {
  leadId: string;
  canSendFreeText: boolean;
  windowExpiresAt: string | null;
  draft?: string | null;
  onUsedDraft?: () => void;
}) {
  const [mode, setMode] = useState<Mode>('msg');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const { text, note, template } = useSendActions(leadId);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Campo que cresce sozinho conforme o texto (1 → ~8 linhas), depois rola.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Menu de respostas rápidas: aparece ao digitar "/" no início (modo mensagem).
  const slash = mode === 'msg' && value.startsWith('/');
  const query = slash ? value.slice(1).toLowerCase() : '';
  const { data: quickReplies = [] } = useQuickReplies(slash);
  const matches = useMemo(
    () => quickReplies.filter((q) => q.shortcut.includes(query) || q.title.toLowerCase().includes(query)),
    [quickReplies, query],
  );

  const sending = text.isPending || note.isPending;
  const noteMode = mode === 'note';
  const disabled = !noteMode && !canSendFreeText;

  async function pickQuickReply(id: string) {
    try {
      const { text: rendered } = await renderQuickReply(id, leadId);
      setValue(rendered);
    } catch {
      setValue('');
    }
  }

  function submit() {
    const content = value.trim();
    if (!content) return;
    setError(null);
    const m = noteMode ? note : text;
    m.mutate(content, {
      onSuccess: () => setValue(''),
      onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível enviar'),
    });
  }

  return (
    <div className="border-t border-border p-3">
      {/* Alternador mensagem/nota */}
      <div className="mb-2 flex items-center gap-2">
        <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('msg')}
            className={cn('rounded px-2 py-1 font-medium', mode === 'msg' ? 'bg-secondary text-foreground' : 'text-muted-foreground')}
          >
            Mensagem
          </button>
          <button
            type="button"
            onClick={() => setMode('note')}
            className={cn('rounded px-2 py-1 font-medium', mode === 'note' ? 'bg-secondary text-foreground' : 'text-muted-foreground')}
          >
            Nota interna
          </button>
        </div>
        {mode === 'msg' && draft && canSendFreeText && (
          <button
            type="button"
            onClick={() => {
              setValue(draft);
              onUsedDraft?.();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/[0.08] px-2 py-0.5 text-xs text-accent"
          >
            <Sparkles className="size-3" /> Usar rascunho da IA
          </button>
        )}
      </div>

      {/* Aviso de janela de 24h */}
      {disabled && (
        <div className="mb-2 rounded-md border border-border bg-muted/50 p-2.5 text-xs text-muted-foreground">
          Fora da janela de 24h do WhatsApp — texto livre bloqueado. Envie um template aprovado ou registre uma nota interna.
          <div className="mt-2">
            <Button size="sm" variant="accent" onClick={() => setTemplateOpen(true)}>
              Escolher template
            </Button>
          </div>
        </div>
      )}

      {/* Menu de respostas rápidas */}
      {slash && matches.length > 0 && (
        <div className="mb-2 max-h-40 overflow-y-auto rounded-md border border-border bg-popover shadow-panel">
          {matches.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => pickQuickReply(q.id)}
              className="flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium">
                /{q.shortcut} {q.global && <span className="text-xs text-muted-foreground">· global</span>}
              </span>
              <span className="line-clamp-1 text-xs text-muted-foreground">{q.title}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !disabled) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          rows={1}
          placeholder={
            noteMode ? 'Nota interna (o cliente não vê)…' : disabled ? 'Envie um template…' : 'Escreva uma mensagem…  (/ para respostas rápidas)'
          }
          className={cn(
            'max-h-[200px] min-h-[52px] flex-1 resize-none rounded-xl border bg-card px-3.5 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
            noteMode ? 'border-accent/40 bg-accent/[0.05]' : 'border-input',
          )}
        />
        <Button
          size="icon"
          onClick={submit}
          disabled={disabled || sending || !value.trim()}
          title="Enviar"
          aria-label="Enviar"
          className="size-11 shrink-0 rounded-xl"
        >
          <Send className="size-[18px]" />
        </Button>
      </div>

      {/* Dica de teclado + janela de 24h, discreta */}
      {!disabled && (
        <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
          <span className="font-medium text-foreground/70">Enter</span> envia ·{' '}
          <span className="font-medium text-foreground/70">Shift+Enter</span> quebra linha
          {!noteMode && windowExpiresAt ? ` · janela aberta até ${formatDateTime(windowExpiresAt)}` : ''}
        </p>
      )}

      <TemplatePicker
        leadId={leadId}
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        sending={template.isPending}
        onSend={(step) =>
          template.mutate(step, {
            onSuccess: () => setTemplateOpen(false),
            onError: (e) => {
              setTemplateOpen(false);
              setError(e instanceof ApiError ? e.message : 'Não foi possível enviar o template');
            },
          })
        }
      />
    </div>
  );
}
