'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLossReasons } from '@/hooks/use-loss-reasons';
import type { LeadSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  /** Lead sendo marcado como perdido (null = fechado). */
  lead: LeadSummary | null;
  onConfirm: (reasonId: string) => void;
  onCancel: () => void;
}

/** Pergunta o motivo ao mover um lead para "Perdido". */
export function LossReasonDialog({ lead, onConfirm, onCancel }: Props) {
  const { data: reasons = [], isLoading } = useLossReasons(Boolean(lead));
  const [selected, setSelected] = useState<string | null>(null);
  const active = reasons.filter((r) => r.active);

  return (
    <Dialog
      open={Boolean(lead)}
      onOpenChange={(o) => {
        if (!o) {
          setSelected(null);
          onCancel();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como perdido</DialogTitle>
          <DialogDescription>
            {lead ? (
              <>
                Escolha o motivo da perda de <span className="font-medium">{lead.name}</span>. O lead
                continua na base para campanhas futuras.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando motivos…</p>}
          {!isLoading && active.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum motivo cadastrado. Peça a um gestor para criar em Configurações → Motivos de perda.
            </p>
          )}
          {active.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                selected === r.id
                  ? 'border-accent/50 bg-accent/[0.08] text-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  selected === r.id ? 'bg-accent' : 'bg-muted-foreground/40',
                )}
              />
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setSelected(null);
              onCancel();
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onConfirm(selected);
                setSelected(null);
              }
            }}
          >
            Marcar como perdido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
