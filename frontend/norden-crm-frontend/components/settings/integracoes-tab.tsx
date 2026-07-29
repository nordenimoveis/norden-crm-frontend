'use client';

import { useState } from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSincronizarLeadsImobzi } from '@/hooks/use-imobzi-integracao';
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

      <p className="text-xs text-muted-foreground">
        A sincronização de imóveis continua na tela{' '}
        <span className="font-medium text-foreground">Catálogo de Imóveis</span>, junto com o
        cadastro/edição — faz mais sentido ficar perto do que ela afeta diretamente.
      </p>
    </div>
  );
}
