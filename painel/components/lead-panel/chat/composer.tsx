'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, FileText, Mail, Paperclip, Send, Sparkles, StickyNote, X, Zap } from 'lucide-react';
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
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const { text, note, template, attach } = useSendActions(leadId);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_BYTES = 50 * 1024 * 1024; // 50 MB por arquivo (o WhatsApp ainda limita por tipo)

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.size > 0);
    const tooBig = incoming.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" passa de 50 MB. Comprima ou envie em partes.`);
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...incoming].slice(0, 10));
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

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

  const sending = text.isPending || note.isPending || attach.isPending;
  const noteMode = mode === 'note';
  const disabled = !noteMode && !canSendFreeText;
  const canSend = (value.trim().length > 0 || files.length > 0) && !disabled && !sending;

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
    setError(null);

    // Anexos (só no modo mensagem): enviam junto com a legenda digitada.
    if (!noteMode && files.length > 0) {
      attach.mutate(
        { files, caption: content || undefined },
        {
          onSuccess: () => {
            setFiles([]);
            setValue('');
          },
          onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível enviar os arquivos'),
        },
      );
      return;
    }

    if (!content) return;
    const m = noteMode ? note : text;
    m.mutate(content, {
      onSuccess: () => setValue(''),
      onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível enviar'),
    });
  }

  // Colar print (Ctrl/Cmd+V com imagem na área de transferência).
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    if (noteMode || disabled) return;
    const pasted = Array.from(e.clipboardData.files);
    if (pasted.length > 0) {
      e.preventDefault();
      addFiles(pasted);
    }
  }

  return (
    <div
      className="relative border-t border-border p-3"
      onDragOver={(e) => {
        if (noteMode || disabled) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={(e) => {
        if (noteMode || disabled) return;
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      {/* Arrastar arquivos para cá */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-1 z-10 grid place-items-center rounded-xl border-2 border-dashed border-accent bg-accent/[0.08] text-sm font-medium text-accent">
          <span className="inline-flex items-center gap-2">
            <Paperclip className="size-4" /> Solte para anexar
          </span>
        </div>
      )}

      {/* Aviso: fora da janela de 24h do WhatsApp (nunca abriu, ou expirou) */}
      {disabled && (
        <div className="mb-2.5 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-500">
          <Clock className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {windowExpiresAt
              ? 'Tempo de resposta de 24h esgotado. Envie um template aprovado.'
              : 'O cliente ainda não respondeu no WhatsApp — só dá para enviar um template. O texto livre abre assim que ele responder.'}
          </span>
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

      {/* Prévia dos anexos selecionados (miniatura de imagem ou chip de arquivo) */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => {
            const isImg = f.type.startsWith('image/');
            const preview = isImg ? URL.createObjectURL(f) : null;
            return (
              <div
                key={`${f.name}-${i}`}
                className="group relative flex items-center gap-2 rounded-lg border border-border bg-card p-1 pr-2 text-xs"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt={f.name}
                    className="size-10 rounded object-cover"
                    onLoad={() => URL.revokeObjectURL(preview)}
                  />
                ) : (
                  <span className="grid size-10 place-items-center rounded bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                  </span>
                )}
                <span className="max-w-[120px] truncate font-medium text-foreground">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  title="Remover"
                  aria-label={`Remover ${f.name}`}
                  className="grid size-5 shrink-0 place-items-center rounded-full bg-foreground/10 text-foreground/70 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = ''; // permite reanexar o mesmo arquivo
        }}
      />

      {/* Campo: template + anexar + texto + enviar */}
      <div className="flex items-end gap-2">
        {mode === 'msg' && (
          <>
            <button
              type="button"
              onClick={() => setTemplateOpen(true)}
              title="Escolher template aprovado"
              className="inline-flex h-[52px] shrink-0 items-center gap-1.5 rounded-xl border border-accent/35 bg-accent/[0.08] px-3 text-xs font-semibold text-accent transition-colors hover:bg-accent/[0.16]"
            >
              <Zap className="size-4" />
              <span className="hidden sm:inline">templates</span>
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              title="Anexar arquivo (imagem, PDF, planilha…)"
              aria-label="Anexar arquivo"
              className="grid size-[52px] shrink-0 place-items-center rounded-xl border border-input bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <Paperclip className="size-5" />
            </button>
          </>
        )}
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
          onPaste={handlePaste}
          disabled={disabled}
          rows={1}
          placeholder={
            noteMode ? 'Nota interna (o cliente não vê)…' : disabled ? 'Envie um template…' : 'Escreva uma mensagem…  (/ para respostas rápidas)'
          }
          className={cn(
            'max-h-[200px] min-h-[52px] min-w-0 flex-1 resize-none rounded-xl border bg-card px-3.5 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
            noteMode ? 'border-accent/40 bg-accent/[0.05]' : 'border-input',
          )}
        />
        <Button
          size="icon"
          onClick={submit}
          disabled={!canSend}
          title="Enviar"
          aria-label="Enviar"
          className="size-11 shrink-0 rounded-xl"
        >
          <Send className="size-[18px]" />
        </Button>
      </div>

      {/* Modo (Mensagem / Nota interna) + rascunho da IA + dica */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('msg')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors',
              mode === 'msg' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Mail className="size-3.5" /> Mensagem
          </button>
          <button
            type="button"
            onClick={() => setMode('note')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors',
              mode === 'note' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <StickyNote className="size-3.5" /> Nota interna
          </button>
        </div>

        {mode === 'msg' && draft && canSendFreeText && (
          <button
            type="button"
            onClick={() => {
              setValue(draft);
              onUsedDraft?.();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/[0.08] px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/[0.14]"
          >
            <Sparkles className="size-3" /> Usar rascunho da IA
          </button>
        )}

        {!disabled && (
          <p className="ml-auto hidden text-[0.68rem] text-muted-foreground sm:block">
            <span className="font-medium text-foreground/70">Enter</span> envia
            {!noteMode && windowExpiresAt ? ` · janela até ${formatDateTime(windowExpiresAt)}` : ''}
          </p>
        )}
      </div>

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
