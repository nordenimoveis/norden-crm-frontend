'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useCampanhaDetalhe,
  useMarcarCampanhaComoPronta,
  useDeletarCampanha,
} from '@/hooks/use-campanhas';
import { ROTULO_STATUS_CAMPANHA } from '@/lib/types';

export function CampanhaDetailDialog({
  campanhaId,
  onFechar,
}: {
  campanhaId: string | null;
  onFechar: () => void;
}) {
  const { data: campanha, isLoading } = useCampanhaDetalhe(campanhaId);
  const marcarPronta = useMarcarCampanhaComoPronta();
  const deletar = useDeletarCampanha();
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  async function confirmarPronta() {
    if (!campanha) return;
    await marcarPronta.mutateAsync(campanha.id);
  }

  async function confirmarExclusao() {
    if (!campanha) return;
    await deletar.mutateAsync(campanha.id);
    onFechar();
  }

  return (
    <Dialog open={!!campanhaId} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent>
        {isLoading || !campanha ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{campanha.nome}</DialogTitle>
              <DialogDescription>
                {ROTULO_STATUS_CAMPANHA[campanha.status]} · {campanha._count.destinatarios}{' '}
                destinatário{campanha._count.destinatarios !== 1 ? 's' : ''} · template "
                {campanha.templateMensagem.nome}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="rounded-md border border-border p-3 text-sm text-foreground">
                {campanha.templateMensagem.conteudo}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Amostra de destinatários
                </p>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border">
                  {campanha.destinatarios.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between border-b border-border px-3 py-1.5 text-sm last:border-0"
                    >
                      <span className="text-foreground">{d.lead.nome || d.lead.telefone}</span>
                      <span className="text-xs text-muted-foreground">{d.status}</span>
                    </div>
                  ))}
                  {campanha._count.destinatarios > campanha.destinatarios.length && (
                    <p className="px-3 py-1.5 text-xs text-muted-foreground">
                      + {campanha._count.destinatarios - campanha.destinatarios.length} outros
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="justify-between sm:justify-between">
              {campanha.status === 'rascunho' && (
                <div>
                  {confirmandoExclusao ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={confirmarExclusao}
                        disabled={deletar.isPending}
                      >
                        {deletar.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Confirmar exclusão
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmandoExclusao(false)}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setConfirmandoExclusao(true)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir rascunho
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={onFechar}>
                  Fechar
                </Button>
                {campanha.status === 'rascunho' && (
                  <Button variant="accent" onClick={confirmarPronta} disabled={marcarPronta.isPending}>
                    {marcarPronta.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Marcar como pronta
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
