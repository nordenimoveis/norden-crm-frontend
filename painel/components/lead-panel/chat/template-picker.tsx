'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getTemplates } from '@/lib/api/messages';
import { cn } from '@/lib/utils';

export function TemplatePicker({
  leadId,
  open,
  onOpenChange,
  onSend,
  sending,
}: {
  leadId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSend: (step: number) => void;
  sending: boolean;
}) {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['lead', leadId, 'templates'],
    queryFn: () => getTemplates(leadId),
    enabled: open,
  });
  const [sel, setSel] = useState<number | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar template aprovado</DialogTitle>
          <DialogDescription>
            Fora da janela de 24h, o WhatsApp só permite um template aprovado pela Meta.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {templates.map((t) => (
            <button
              key={t.step}
              type="button"
              onClick={() => setSel(t.step)}
              className={cn(
                'w-full rounded-md border p-3 text-left transition-colors',
                sel === t.step ? 'border-accent/50 bg-accent/[0.08]' : 'border-border hover:bg-muted',
              )}
            >
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.name}</p>
              <p className="text-sm text-foreground">{t.preview}</p>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!sel || sending} onClick={() => sel && onSend(sel)}>
            {sending ? 'Enviando…' : 'Enviar template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
