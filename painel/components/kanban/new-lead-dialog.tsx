'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api/client';
import { createLead, type NewLead } from '@/lib/api/leads';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se gestor, o lead entra pela roleta; senão, fica com o próprio corretor. */
  isManager: boolean;
}

const empty: NewLead = { name: '', phone: '', email: '', interest: '', notes: '' };
const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Não foi possível cadastrar');

/** Cadastro manual de um lead avulso (botão "Novo lead" do quadro). */
export function NewLeadDialog({ open, onOpenChange, isManager }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<NewLead>(empty);
  const [error, setError] = useState<string | null>(null);
  const [dup, setDup] = useState(false);

  const set = (k: keyof NewLead, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = form.name.trim().length >= 2 && (!!form.phone?.trim() || !!form.email?.trim());

  const createM = useMutation({
    mutationFn: () =>
      createLead({
        name: form.name.trim(),
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        interest: form.interest?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      if (res.duplicate) {
        setDup(true);
        setError(null);
      } else {
        close();
      }
    },
    onError: (e) => setError(msg(e)),
  });

  function close() {
    setForm(empty);
    setError(null);
    setDup(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
          <DialogDescription>
            {isManager
              ? 'Será distribuído automaticamente pela roleta entre os corretores ativos.'
              : 'O lead ficará com você.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) createM.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="nl-name">Nome*</Label>
            <Input
              id="nl-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Nome do cliente"
              autoFocus
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nl-phone">Telefone</Label>
              <Input
                id="nl-phone"
                value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="48 99999-0000"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-email">E-mail</Label>
              <Input
                id="nl-email"
                value={form.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
                placeholder="cliente@email.com"
                inputMode="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nl-interest">Interesse</Label>
            <Input
              id="nl-interest"
              value={form.interest ?? ''}
              onChange={(e) => set('interest', e.target.value)}
              placeholder="Ex.: Cobertura em Jurerê Internacional"
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nl-notes">Observações</Label>
            <textarea
              id="nl-notes"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-card outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Anotações internas (opcional)"
            />
          </div>

          <p className="text-xs text-muted-foreground">Informe pelo menos telefone ou e-mail.</p>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {dup && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-500">
              Já existe um lead com esse contato — nada foi duplicado.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={close}>
              {dup ? 'Fechar' : 'Cancelar'}
            </Button>
            <Button type="submit" disabled={!canSubmit || createM.isPending}>
              {createM.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Salvando…
                </>
              ) : (
                'Cadastrar lead'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
