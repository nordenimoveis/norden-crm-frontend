'use client';

import { useMemo, useState } from 'react';
import { Loader2, Send, ExternalLink, CheckCircle2, MessageSquare, Search } from 'lucide-react';
import {
  useComentarios,
  useResponderComentario,
  usePusherComentarios,
} from '@/hooks/use-comentarios';
import { CANAIS, CANAL_META } from '@/lib/canais';
import { Canal, ComentarioSocial } from '@/lib/types';
import { cn } from '@/lib/utils';

type FiltroStatus = 'todos' | 'pendentes' | 'respondidos';

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ComentariosInbox() {
  usePusherComentarios();

  const [canalFiltro, setCanalFiltro] = useState<Canal | 'todos'>('todos');
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>('todos');
  const [busca, setBusca] = useState('');

  const respondido =
    statusFiltro === 'todos' ? undefined : statusFiltro === 'respondidos';

  const { data, isLoading } = useComentarios({
    canal: canalFiltro === 'todos' ? undefined : canalFiltro,
    respondido,
    busca: busca || undefined,
  });

  const comentarios = data ?? [];
  const pendentes = useMemo(() => comentarios.filter((c) => !c.respondido).length, [comentarios]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      {/* Cabeçalho + filtros */}
      <div className="shrink-0 border-b border-border bg-card px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-medium text-foreground">Comentários</h2>
            <p className="text-xs text-muted-foreground">
              Comentários dos seus posts no Instagram e Facebook — responda sem sair do CRM.
            </p>
          </div>
          {pendentes > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              {pendentes} pendente{pendentes > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por texto ou autor..."
              className="w-56 rounded-md border border-border bg-muted/40 py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>

          <div className="flex items-center gap-1">
            <Chip ativo={statusFiltro === 'todos'} onClick={() => setStatusFiltro('todos')}>
              Todos
            </Chip>
            <Chip ativo={statusFiltro === 'pendentes'} onClick={() => setStatusFiltro('pendentes')}>
              Pendentes
            </Chip>
            <Chip
              ativo={statusFiltro === 'respondidos'}
              onClick={() => setStatusFiltro('respondidos')}
            >
              Respondidos
            </Chip>
          </div>

          <span className="mx-1 h-4 w-px bg-border" />

          <div className="flex items-center gap-1">
            <Chip ativo={canalFiltro === 'todos'} onClick={() => setCanalFiltro('todos')}>
              Todos os canais
            </Chip>
            {CANAIS.filter((c) => c !== 'whatsapp').map((c) => (
              <Chip key={c} ativo={canalFiltro === c} onClick={() => setCanalFiltro(c)}>
                {CANAL_META[c].emoji} {CANAL_META[c].rotulo}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comentarios.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-40" />
            <p className="text-sm">Nenhum comentário por aqui.</p>
            <p className="max-w-sm text-xs">
              Assim que alguém comentar em um post conectado do Instagram ou Facebook, ele aparece
              aqui para você responder.
            </p>
          </div>
        ) : (
          comentarios.map((comentario) => (
            <ComentarioCard key={comentario.id} comentario={comentario} />
          ))
        )}
      </div>
    </div>
  );
}

function ComentarioCard({ comentario }: { comentario: ComentarioSocial }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const responder = useResponderComentario();

  const meta = CANAL_META[comentario.canal];
  const autor =
    comentario.autorNome ||
    (comentario.autorUsername ? `@${comentario.autorUsername}` : 'Autor desconhecido');

  async function enviar() {
    if (!texto.trim() || responder.isPending) return;
    await responder.mutateAsync({ comentarioId: comentario.id, texto: texto.trim() });
    setTexto('');
    setAberto(false);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm',
              meta.corBg
            )}
            title={meta.rotulo}
          >
            {meta.emoji}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{autor}</p>
            <p className="text-[11px] text-muted-foreground">
              {meta.rotulo} · {formatarData(comentario.recebidoEm ?? comentario.criadoEm)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {comentario.respondido ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Respondido
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              Pendente
            </span>
          )}
          {comentario.permalink && (
            <a
              href={comentario.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              title="Abrir post original"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{comentario.texto}</p>

      {comentario.lead && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Vinculado ao lead <span className="text-foreground">{comentario.lead.nome ?? comentario.lead.id}</span>
        </p>
      )}

      <div className="mt-3">
        {!aberto ? (
          <button
            onClick={() => setAberto(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Send className="h-3.5 w-3.5" />
            {comentario.respondido ? 'Responder novamente' : 'Responder'}
          </button>
        ) : (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              rows={2}
              placeholder="Escreva uma resposta pública ao comentário..."
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={enviar}
                disabled={!texto.trim() || responder.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {responder.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Publicar resposta
              </button>
              <button
                onClick={() => {
                  setAberto(false);
                  setTexto('');
                }}
                className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
        ativo ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}
