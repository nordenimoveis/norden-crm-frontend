'use client';

import { useState } from 'react';
import { Plus, Loader2, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCampanhas, useDeletarCampanha } from '@/hooks/use-campanhas';
import { CampanhaDetailDialog } from './campanha-detail-dialog';
import { ROTULO_STATUS_CAMPANHA, CampanhaDisparo, CampanhaDisparoStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const TOM_STATUS: Record<CampanhaDisparoStatus, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  pronta: 'bg-accent/10 text-accent',
  agendada: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  enviando: 'bg-sky-100 text-sky-700',
  concluida: 'bg-online/10 text-online',
  cancelada: 'bg-red-50 text-red-700',
};

export function CampanhasList({ onNova }: { onNova: () => void }) {
  const { data: campanhas, isLoading } = useCampanhas();
  const [detalheId, setDetalheId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Campanhas de disparo em massa via WhatsApp, usando templates aprovados pela Meta.
        </p>
        <Button variant="accent" size="sm" onClick={onNova}>
          <Plus className="h-4 w-4" />
          Nova campanha
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando campanhas...
        </div>
      ) : !campanhas || campanhas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Nenhuma campanha criada ainda.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {campanhas.map((campanha) => (
            <CampanhaRow key={campanha.id} campanha={campanha} onAbrir={() => setDetalheId(campanha.id)} />
          ))}
        </div>
      )}

      <CampanhaDetailDialog campanhaId={detalheId} onFechar={() => setDetalheId(null)} />
    </div>
  );
}

function CampanhaRow({ campanha, onAbrir }: { campanha: CampanhaDisparo; onAbrir: () => void }) {
  const deletar = useDeletarCampanha();
  const [confirmando, setConfirmando] = useState(false);

  const total = campanha._count.destinatarios;
  const enviado = campanha.progresso?.enviado ?? 0;
  const falhou = campanha.progresso?.falhou ?? 0;
  const processados = enviado + falhou;
  const mostrarBarra = campanha.status === 'enviando' || campanha.status === 'concluida' || processados > 0;
  const pctEnviado = total > 0 ? (enviado / total) * 100 : 0;
  const pctFalhou = total > 0 ? (falhou / total) * 100 : 0;

  async function excluir(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    await deletar.mutateAsync(campanha.id);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(e) => e.key === 'Enter' && onAbrir()}
      className="cursor-pointer p-4 text-left transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{campanha.nome}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Template: {campanha.templateMensagem.nome} · criada por {campanha.criadoPor.nome}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {total}
          </span>
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', TOM_STATUS[campanha.status])}>
            {ROTULO_STATUS_CAMPANHA[campanha.status]}
          </span>
          {confirmando ? (
            <span className="flex items-center gap-1">
              <button
                onClick={excluir}
                disabled={deletar.isPending}
                className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deletar.isPending ? '...' : 'Confirmar'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmando(false);
                }}
                className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              onClick={excluir}
              title="Excluir campanha"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de progresso — enviados (verde) + falhas (vermelho) sobre o total */}
      {mostrarBarra && (
        <div className="mt-2">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-online transition-all" style={{ width: `${pctEnviado}%` }} />
            <div className="h-full bg-red-500 transition-all" style={{ width: `${pctFalhou}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {processados}/{total} processados · <span className="text-online">{enviado} enviados</span>
            {falhou > 0 && <span className="text-red-600 dark:text-red-400"> · {falhou} falhas</span>}
          </p>
        </div>
      )}
    </div>
  );
}
