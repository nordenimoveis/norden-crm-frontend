'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useLeadsDoBoard } from '@/hooks/use-leads';
import { useAuthStore } from '@/store/auth-store';
import { Canal, Lead } from '@/lib/types';
import { CANAIS, CANAL_META, identificadorLead, nomeExibicaoLead } from '@/lib/canais';
import { cn } from '@/lib/utils';

function iniciais(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

function formatarHora(iso: string | null) {
  if (!iso) return '';
  const data = new Date(iso);
  const hoje = new Date();
  const mesmoDia = data.toDateString() === hoje.toDateString();

  if (mesmoDia) {
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function ConversationList({
  leadIdAtivo,
  onSelecionar,
}: {
  leadIdAtivo: string | null;
  onSelecionar: (id: string) => void;
}) {
  const usuario = useAuthStore((state) => state.usuario);
  const [busca, setBusca] = useState('');
  const [canalFiltro, setCanalFiltro] = useState<Canal | 'todos'>('todos');
  const { data, isLoading } = useLeadsDoBoard({});

  const conversas = useMemo(() => {
    const items = data?.items ?? [];
    const porCanal =
      canalFiltro === 'todos'
        ? items
        : items.filter((l) => (l.canalPrincipal ?? 'whatsapp') === canalFiltro);
    const filtradas = busca
      ? porCanal.filter(
          (l) =>
            (l.nome ?? '').toLowerCase().includes(busca.toLowerCase()) ||
            (l.telefone ?? '').includes(busca)
        )
      : porCanal;

    // Mais recente primeiro — quem nunca trocou mensagem fica no final
    return [...filtradas].sort((a, b) => {
      const ta = a.ultimaMensagemEm ? new Date(a.ultimaMensagemEm).getTime() : 0;
      const tb = b.ultimaMensagemEm ? new Date(b.ultimaMensagemEm).getTime() : 0;
      return tb - ta;
    });
  }, [data, busca, canalFiltro]);

  // Quando a conversa ativa muda (ex: abrindo um link direto com ?leadId=,
  // vindo da Agenda, de Campanhas, ou de "Meus Leads"), garante que ela
  // fique visível na lista, mesmo se estiver fora da área rolada — sem
  // isso, o destaque visual acontecia, mas a pessoa podia não enxergar
  // onde, se a conversa estivesse mais abaixo na lista.
  const itemAtivoRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (leadIdAtivo && itemAtivoRef.current) {
      itemAtivoRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [leadIdAtivo, conversas]);

  return (
    <div className="flex w-[320px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <h2 className="font-display text-lg font-medium text-sidebar-foreground">Mensagens</h2>
      </div>

      <div className="border-b border-sidebar-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar conversa..."
            className="w-full rounded-md border border-sidebar-border bg-white/5 py-2 pl-8 pr-3 text-sm text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>

        {/* Filtro por canal — WhatsApp / Instagram / Messenger, ou todos. */}
        <div className="mt-2 flex items-center gap-1">
          <FiltroCanalBotao
            ativo={canalFiltro === 'todos'}
            onClick={() => setCanalFiltro('todos')}
            rotulo="Todos"
          />
          {CANAIS.map((c) => (
            <FiltroCanalBotao
              key={c}
              ativo={canalFiltro === c}
              onClick={() => setCanalFiltro(c)}
              rotulo={CANAL_META[c].emoji}
              titulo={CANAL_META[c].rotulo}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="p-4 text-center text-xs text-sidebar-muted">Carregando...</p>
        ) : conversas.length === 0 ? (
          <p className="p-4 text-center text-xs text-sidebar-muted">Nenhuma conversa encontrada.</p>
        ) : (
          conversas.map((lead: Lead) => {
            const ativo = lead.id === leadIdAtivo;
            const nomeExibicao = nomeExibicaoLead(lead);
            const canal = lead.canalPrincipal ?? 'whatsapp';

            return (
              <button
                key={lead.id}
                ref={ativo ? itemAtivoRef : undefined}
                onClick={() => onSelecionar(lead.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-sidebar-border/60 px-4 py-3 text-left transition-colors',
                  ativo ? 'bg-white/[0.07]' : 'hover:bg-white/5'
                )}
              >
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
                    {iniciais(nomeExibicao)}
                  </div>
                  {lead.statusIA === 'ativa' && (
                    <span
                      className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-sidebar bg-amber-500 text-[8px]"
                      title="IA respondendo automaticamente"
                    >
                      🤖
                    </span>
                  )}
                  {lead.naoLida && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-sidebar bg-sky-500" />
                  )}
                  {/* Selo do canal — identifica de imediato se é WhatsApp,
                      Instagram ou Messenger, como no Respond.io. */}
                  <span
                    className={cn(
                      'absolute -bottom-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-sidebar text-[8px]',
                      CANAL_META[canal].corBg
                    )}
                    title={CANAL_META[canal].rotulo}
                  >
                    {CANAL_META[canal].emoji}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        'truncate text-sm',
                        lead.naoLida
                          ? 'font-semibold text-sidebar-foreground'
                          : 'font-medium text-sidebar-foreground/90'
                      )}
                    >
                      {nomeExibicao}
                    </p>
                    <span className="shrink-0 text-[11px] text-sidebar-muted">
                      {formatarHora(lead.ultimaMensagemEm)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'mt-0.5 truncate text-xs',
                      lead.naoLida ? 'text-sidebar-foreground/80' : 'text-sidebar-muted'
                    )}
                  >
                    {usuario?.papel !== 'corretor' && lead.corretor ? `${lead.corretor.nome} · ` : ''}
                    {identificadorLead(lead)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function FiltroCanalBotao({
  ativo,
  onClick,
  rotulo,
  titulo,
}: {
  ativo: boolean;
  onClick: () => void;
  rotulo: string;
  titulo?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo ?? rotulo}
      className={cn(
        'rounded-md px-2 py-1 text-xs font-medium transition-colors',
        ativo
          ? 'bg-accent/20 text-accent'
          : 'text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground'
      )}
    >
      {rotulo}
    </button>
  );
}
