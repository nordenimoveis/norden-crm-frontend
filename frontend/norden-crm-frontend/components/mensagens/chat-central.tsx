'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, AlertCircle, MoreVertical, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { useLeadDetalhado } from '@/hooks/use-lead-detalhado';
import { useEnviarMensagem } from '@/hooks/use-enviar-mensagem';
import { useChatRealtime } from '@/hooks/use-chat-realtime';
import { useQuickReplies } from '@/hooks/use-quick-replies';
import { useArquivarLead, useDeletarLead } from '@/hooks/use-leads-acoes';
import { useAuthStore } from '@/store/auth-store';
import { useUiStore } from '@/store/ui-store';
import { substituirVariaveis } from '@/lib/template-variaveis';
import { MessageBubble } from '@/components/chat/message-bubble';
import { QuickReplyPopover } from '@/components/chat/quick-reply-popover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QuickReply } from '@/lib/types';
import { CANAL_META, identificadorLead, nomeExibicaoLead } from '@/lib/canais';
import { cn } from '@/lib/utils';

export function ChatCentral({ leadId }: { leadId: string }) {
  const { data: lead, isLoading } = useLeadDetalhado(leadId);
  useChatRealtime(leadId);

  const usuario = useAuthStore((state) => state.usuario);
  const canalLead = lead?.canalPrincipal ?? 'whatsapp';
  const enviarMensagem = useEnviarMensagem(leadId, lead?.telefone ?? null, canalLead);

  const router = useRouter();
  const arquivar = useArquivarLead();
  const deletar = useDeletarLead();
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const podeExcluir = usuario?.papel === 'gestor' || usuario?.papel === 'admin';

  async function alternarArquivo() {
    if (!lead) return;
    await arquivar.mutateAsync({ leadId: lead.id, arquivada: !lead.arquivada });
    // Arquivar tira a conversa do inbox — volta para a lista.
    if (!lead.arquivada) router.push('/mensagens', { scroll: false });
  }

  async function confirmarExclusao() {
    if (!lead) return;
    await deletar.mutateAsync(lead.id);
    setConfirmandoExclusao(false);
    router.push('/mensagens', { scroll: false });
  }

  const [texto, setTexto] = useState('');
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mensagensFimRef = useRef<HTMLDivElement>(null);

  const gatilhoAtivo = texto.startsWith('/');
  const termoBusca = gatilhoAtivo ? texto.slice(1) : '';

  const { data: quickRepliesTodos } = useQuickReplies('', true);
  const quickRepliesFiltrados = useMemo(() => {
    if (!quickRepliesTodos) return [];
    if (!termoBusca) return quickRepliesTodos;
    const termo = termoBusca.toLowerCase();
    return quickRepliesTodos.filter((qr) => qr.titulo.toLowerCase().includes(termo));
  }, [quickRepliesTodos, termoBusca]);

  useEffect(() => {
    mensagensFimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lead?.mensagens.length]);

  useEffect(() => {
    setIndiceAtivo(0);
  }, [termoBusca]);

  const mensagemSugerida = useUiStore((state) => state.mensagemSugerida);
  const definirMensagemSugerida = useUiStore((state) => state.definirMensagemSugerida);

  useEffect(() => {
    if (mensagemSugerida && mensagemSugerida.leadId === leadId) {
      setTexto(mensagemSugerida.texto);
      definirMensagemSugerida(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  function selecionarQuickReply(item: QuickReply) {
    const textoSubstituido = substituirVariaveis(item.textoMensagem, {
      lead_name: lead?.nome ?? undefined,
      broker_name: usuario?.nome ?? undefined,
    });
    setTexto(textoSubstituido);
    textareaRef.current?.focus();
  }

  function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || enviarMensagem.isPending) return;

    enviarMensagem.mutate(conteudo);
    setTexto('');
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (gatilhoAtivo && quickRepliesFiltrados.length > 0) {
      if (evento.key === 'ArrowDown') {
        evento.preventDefault();
        setIndiceAtivo((i) => (i + 1) % quickRepliesFiltrados.length);
        return;
      }
      if (evento.key === 'ArrowUp') {
        evento.preventDefault();
        setIndiceAtivo((i) => (i - 1 + quickRepliesFiltrados.length) % quickRepliesFiltrados.length);
        return;
      }
      if (evento.key === 'Enter') {
        evento.preventDefault();
        selecionarQuickReply(quickRepliesFiltrados[indiceAtivo]);
        return;
      }
      if (evento.key === 'Escape') {
        evento.preventDefault();
        setTexto('');
        return;
      }
    }

    if (evento.key === 'Enter' && !evento.shiftKey && !gatilhoAtivo) {
      evento.preventDefault();
      enviar();
    }
  }

  if (isLoading || !lead) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{nomeExibicaoLead(lead)}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                'bg-muted',
                CANAL_META[canalLead].cor
              )}
            >
              {CANAL_META[canalLead].emoji} {CANAL_META[canalLead].rotulo}
            </span>
            {identificadorLead(lead)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => void alternarArquivo()}>
              {lead.arquivada ? (
                <>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Desarquivar conversa
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar conversa
                </>
              )}
            </DropdownMenuItem>
            {podeExcluir && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950"
                  onSelect={() => setConfirmandoExclusao(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir conversa
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={confirmandoExclusao} onOpenChange={setConfirmandoExclusao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conversa</DialogTitle>
            <DialogDescription>
              Isso apaga em definitivo o lead <strong>{nomeExibicaoLead(lead)}</strong> e todo o
              histórico (mensagens, notas, agendamentos). Esta ação não pode ser desfeita. Se quiser
              apenas tirar do inbox, use <em>Arquivar</em>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmandoExclusao(false)} disabled={deletar.isPending}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              onClick={confirmarExclusao}
              disabled={deletar.isPending}
            >
              {deletar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lead.status === 'respondeu' && lead.atendimentoHumano && (
        <div className="flex items-center gap-1.5 border-b border-red-100 bg-red-50 px-5 py-2 text-xs font-medium text-red-700">
          <AlertCircle className="h-3.5 w-3.5" />
          O lead respondeu — cadência automática pausada. Atendimento manual necessário.
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
        {lead.mensagens.length === 0 && (
          <p className="pt-8 text-center text-xs text-muted-foreground">Nenhuma mensagem ainda.</p>
        )}
        {lead.mensagens.map((mensagem) => (
          <MessageBubble key={mensagem.id} mensagem={mensagem} />
        ))}
        <div ref={mensagensFimRef} />
      </div>

      <div className="relative border-t border-border bg-card p-4">
        {gatilhoAtivo && (
          <QuickReplyPopover
            itens={quickRepliesFiltrados}
            indiceAtivo={indiceAtivo}
            onSelecionar={selecionarQuickReply}
          />
        )}

        <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 transition-shadow focus-within:ring-2 focus-within:ring-accent/40">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            rows={1}
            placeholder="Digite uma mensagem, ou / para usar um script..."
            className={cn(
              'max-h-32 flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus-visible:ring-0'
            )}
          />
          <button
            onClick={enviar}
            disabled={!texto.trim() || enviarMensagem.isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {enviarMensagem.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
