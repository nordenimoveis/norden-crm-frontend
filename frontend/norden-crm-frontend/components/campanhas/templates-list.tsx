'use client';

import { useState } from 'react';
import { Plus, Loader2, Pencil, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTemplates, useSincronizarTemplatesMeta } from '@/hooks/use-templates';
import { TemplateFormDialog } from './template-form-dialog';
import { TemplateMensagem } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TemplatesList() {
  const { data: templates, isLoading } = useTemplates();
  const sincronizar = useSincronizarTemplatesMeta();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState<TemplateMensagem | null>(null);
  const [resumoSync, setResumoSync] = useState<string | null>(null);

  function abrirCriacao() {
    setItemEditando(null);
    setDialogAberto(true);
  }

  function abrirEdicao(item: TemplateMensagem) {
    setItemEditando(item);
    setDialogAberto(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Templates pré-aprovados pela Meta, usados na cadência automática e em campanhas.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              sincronizar.mutate(undefined, {
                onSuccess: (r) =>
                  setResumoSync(`${r.criados} novos, ${r.atualizados} atualizados (de ${r.total}).`),
                onError: (e) => setResumoSync((e as Error).message),
              })
            }
            disabled={sincronizar.isPending}
          >
            <RefreshCw className={cn('h-4 w-4', sincronizar.isPending && 'animate-spin')} />
            Sincronizar da Meta
          </Button>
          <Button variant="accent" size="sm" onClick={abrirCriacao}>
            <Plus className="h-4 w-4" />
            Novo template
          </Button>
        </div>
      </div>

      {resumoSync && (
        <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{resumoSync}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando templates...
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Nenhum template cadastrado ainda.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {templates.map((template) => (
            <div key={template.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{template.nome}</p>
                  <span
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      template.aprovadoMeta
                        ? 'bg-online/10 text-online'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {template.aprovadoMeta ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {template.aprovadoMeta ? 'Aprovado' : 'Pendente'}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{template.conteudo}</p>
              </div>

              <button
                onClick={() => abrirEdicao(template)}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <TemplateFormDialog aberto={dialogAberto} onFechar={() => setDialogAberto(false)} templateEditando={itemEditando} />
    </div>
  );
}
