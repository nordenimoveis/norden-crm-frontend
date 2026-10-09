'use client';

import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateDeal } from '@/hooks/use-leads';
import { ApiError } from '@/lib/api/client';

/** Diálogo para transformar um lead em negócio (entra no funil, coluna Novo Lead). */
export function CreateDealDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  leadName?: string;
  onDone?: () => void;
}) {
  const createDeal = useCreateDeal();
  const [startCadence, setStartCadence] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    createDeal.mutate(
      { id: leadId, startCadence },
      {
        onSuccess: () => { onOpenChange(false); onDone?.(); },
        onError: (e) => setError(e instanceof ApiError ? e.message : 'Não foi possível criar o negócio'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="size-4 text-accent" /> Criar negócio
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {leadName ? <><span className="font-medium text-foreground">{leadName}</span> entra no </> : 'O lead entra no '}
          funil na coluna <span className="font-medium text-foreground">Novo Lead</span>, mantendo o corretor atual. É aqui que ele vira uma oportunidade de venda.
        </p>
        <label className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <input type="checkbox" checked={startCadence} onChange={(e) => setStartCadence(e.target.checked)} className="mt-0.5 size-4" />
          <span>
            Iniciar contato automático (régua de boas-vindas)
            <span className="mt-0.5 block text-xs text-muted-foreground">Deixe desmarcado se você já falou com o cliente ou vai conduzir manualmente.</span>
          </span>
        </label>
        {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={confirm} disabled={createDeal.isPending}>
            <Briefcase className="size-4" /> Criar negócio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
