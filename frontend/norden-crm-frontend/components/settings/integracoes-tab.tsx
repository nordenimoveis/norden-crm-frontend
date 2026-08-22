'use client';

import { useState } from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSincronizarLeadsImobzi } from '@/hooks/use-imobzi-integracao';
import { CANAIS, CANAL_META } from '@/lib/canais';
import { cn } from '@/lib/utils';

export function IntegracoesTab() {
  const sincronizarLeads = useSincronizarLeadsImobzi();
  const [resumo, setResumo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function sincronizar() {
    setResumo(null);
    setErro(null);
    try {
      const resultado = await sincronizarLeads.mutateAsync();
      setResumo(
        `${resultado.atualizados} leads atualizados, ${resultado.novos} novos (de ${resultado.total} no total).`
      );
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Imobzi — Leads/Contatos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Desde que o webhook foi configurado, novos contatos e atualizações chegam
              automaticamente em tempo real. Este botão serve só pra uma carga inicial única —
              trazer contatos que já existiam no Imobzi antes do webhook ser criado.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={sincronizar}
            disabled={sincronizarLeads.isPending}
            className="shrink-0"
          >
            <Users className={cn('h-4 w-4', sincronizarLeads.isPending && 'animate-pulse')} />
            {sincronizarLeads.isPending ? 'Sincronizando...' : 'Sincronizar Leads'}
          </Button>
        </div>

        {resumo && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-online/10 px-3 py-2 text-sm text-online">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {resumo}
          </div>
        )}
        {erro && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {erro}
          </p>
        )}
      </div>

      {/* Canais da caixa de entrada omnichannel */}
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-foreground">Canais de atendimento (Meta)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A caixa de entrada unificada atende WhatsApp, Instagram Direct e Messenger, além de
          responder comentários dos seus posts. Todos usam a Graph API da Meta.
        </p>

        <div className="mt-3 space-y-2">
          {CANAIS.map((c) => (
            <div
              key={c}
              className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                <span className={cn('text-base', CANAL_META[c].cor)}>{CANAL_META[c].emoji}</span>
                {CANAL_META[c].rotulo}
              </span>
              <span className="text-xs text-muted-foreground">
                {c === 'whatsapp' ? 'WhatsApp Cloud API' : 'Página + Instagram Business'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Configuração do webhook</p>
          <p className="mt-1">
            No App da Meta, aponte o webhook de Instagram/Messenger para{' '}
            <code className="rounded bg-background px-1 py-0.5">/webhooks/meta-messaging</code> e
            assine os campos <code className="rounded bg-background px-1 py-0.5">messages</code>,{' '}
            <code className="rounded bg-background px-1 py-0.5">messaging_postbacks</code>,{' '}
            <code className="rounded bg-background px-1 py-0.5">comments</code> e{' '}
            <code className="rounded bg-background px-1 py-0.5">feed</code>. O WhatsApp continua em{' '}
            <code className="rounded bg-background px-1 py-0.5">/webhooks/whatsapp</code>.
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        A sincronização de imóveis continua na tela{' '}
        <span className="font-medium text-foreground">Catálogo de Imóveis</span>, junto com o
        cadastro/edição — faz mais sentido ficar perto do que ela afeta diretamente.
      </p>
    </div>
  );
}
