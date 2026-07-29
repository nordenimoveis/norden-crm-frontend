'use client';

import { useState } from 'react';
import { Plus, Pencil, MapPin, BedDouble, Ruler, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImoveis } from '@/hooks/use-imoveis';
import { useSincronizarImoveisImobzi } from '@/hooks/use-imobzi-integracao';
import { ImovelFormDialog } from './imovel-form-dialog';
import { Imovel } from '@/lib/types';
import { cn } from '@/lib/utils';

function formatarValor(valor: string | null) {
  if (!valor) return null;
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ImoveisList() {
  const { data: imoveis, isLoading } = useImoveis(true);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [imovelEditando, setImovelEditando] = useState<Imovel | null>(null);

  const sincronizarImoveis = useSincronizarImoveisImobzi();
  const [resumoSync, setResumoSync] = useState<string | null>(null);
  const [erroSync, setErroSync] = useState<string | null>(null);

  function abrirCriacao() {
    setImovelEditando(null);
    setDialogAberto(true);
  }

  function abrirEdicao(imovel: Imovel) {
    setImovelEditando(imovel);
    setDialogAberto(true);
  }

  async function sincronizarImoveisComImobzi() {
    setResumoSync(null);
    setErroSync(null);
    try {
      const resultado = await sincronizarImoveis.mutateAsync();
      setResumoSync(
        `Imóveis: ${resultado.atualizados} atualizados, ${resultado.novos} novos (de ${resultado.total} no total).`
      );
    } catch (e) {
      setErroSync((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Catálogo usado pelo motor de match — cada imóvel ativo é indexado por similaridade
          semântica contra o perfil de busca dos leads.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={sincronizarImoveisComImobzi}
            disabled={sincronizarImoveis.isPending}
          >
            <RefreshCw className={cn('h-4 w-4', sincronizarImoveis.isPending && 'animate-spin')} />
            {sincronizarImoveis.isPending ? 'Sincronizando...' : 'Sincronizar Imóveis'}
          </Button>
          <Button variant="accent" size="sm" onClick={abrirCriacao}>
            <Plus className="h-4 w-4" />
            Novo imóvel
          </Button>
        </div>
      </div>

      {resumoSync && (
        <div className="flex items-center gap-2 rounded-md bg-online/10 px-3 py-2 text-sm text-online">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {resumoSync}
        </div>
      )}
      {erroSync && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {erroSync}
        </p>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : !imoveis || imoveis.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Nenhum imóvel cadastrado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {imoveis.map((imovel) => (
            <button
              key={imovel.id}
              onClick={() => abrirEdicao(imovel)}
              className={cn(
                'flex flex-col rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md',
                !imovel.ativo && 'opacity-50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">{imovel.titulo}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirEdicao(imovel);
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              {imovel.bairro && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {imovel.bairro}, {imovel.cidade}
                </p>
              )}

              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {imovel.metragem && (
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3 w-3" />
                    {imovel.metragem}m²
                  </span>
                )}
                {imovel.quartos && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3 w-3" />
                    {imovel.quartos}
                  </span>
                )}
              </div>

              {imovel.valor && (
                <p className="mt-2 text-sm font-semibold text-accent">
                  {formatarValor(imovel.valor)}
                </p>
              )}

              {!imovel.ativo && (
                <span className="mt-2 w-fit rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  Inativo
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <ImovelFormDialog
        aberto={dialogAberto}
        onFechar={() => setDialogAberto(false)}
        imovelEditando={imovelEditando}
      />
    </div>
  );
}
