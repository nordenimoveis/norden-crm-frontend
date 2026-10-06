'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/use-products';
import { ApiError } from '@/lib/api/client';
import { createProduct, deleteProduct, updateProduct } from '@/lib/api/products';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

const msg = (e: unknown) => (e instanceof ApiError ? e.message : 'Não foi possível concluir');
const toAliases = (s: string) => s.split(',').map((a) => a.trim()).filter(Boolean);

export function ProductsEditor() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useProducts();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newAliases, setNewAliases] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['lead-interests'] });
  };
  const onErr = (e: unknown) => setError(msg(e));

  const createM = useMutation({
    mutationFn: (v: { name: string; aliases?: string[] }) => createProduct(v),
    onSuccess: () => { setNewName(''); setNewAliases(''); setError(null); invalidate(); },
    onError: onErr,
  });
  const updateM = useMutation({
    mutationFn: (v: { id: string; patch: { name?: string; aliases?: string[]; active?: boolean } }) => updateProduct(v.id, v.patch),
    onSuccess: () => { setError(null); invalidate(); },
    onError: onErr,
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { setError(null); invalidate(); },
    onError: onErr,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Empreendimentos da Norden. O CRM usa este catálogo para <span className="font-medium text-foreground">reconhecer o produto</span>{' '}
        nas mensagens que chegam pelo WhatsApp (nome + apelidos) e para padronizar os filtros do funil.
        Use os <span className="font-medium text-foreground">apelidos</span> para variações de escrita (ex.: "Origem", "Origem Jurerê", "Edifício Origem").
      </p>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <ul className="space-y-2">
        {products.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            onSave={(patch) => updateM.mutate({ id: p.id, patch })}
            onToggle={() => updateM.mutate({ id: p.id, patch: { active: !p.active } })}
            onDelete={() => {
              if (confirm(`Excluir o empreendimento "${p.name}"?`)) deleteM.mutate(p.id);
            }}
            busy={updateM.isPending || deleteM.isPending}
          />
        ))}
        {products.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum empreendimento ainda. Cadastre o primeiro abaixo.
          </li>
        )}
      </ul>

      <form
        className="space-y-2 border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (newName.trim()) createM.mutate({ name: newName.trim(), aliases: toAliases(newAliases) });
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Novo empreendimento (ex.: Origem Jurerê)" maxLength={120} />
          <Input value={newAliases} onChange={(e) => setNewAliases(e.target.value)} placeholder="Apelidos, separados por vírgula" maxLength={300} />
          <Button type="submit" disabled={!newName.trim() || createM.isPending} className="shrink-0">
            <Plus className="size-4" /> Adicionar
          </Button>
        </div>
      </form>
    </div>
  );
}

function ProductRow({
  product,
  onSave,
  onToggle,
  onDelete,
  busy,
}: {
  product: Product;
  onSave: (patch: { name?: string; aliases?: string[] }) => void;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [name, setName] = useState(product.name);
  const [aliases, setAliases] = useState(product.aliases.join(', '));
  const aliasesArr = aliases.split(',').map((a) => a.trim()).filter(Boolean);
  const dirty =
    (name.trim() !== product.name && name.trim().length > 0) ||
    aliasesArr.join('|') !== product.aliases.join('|');

  const save = () => {
    if (!dirty) return;
    const patch: { name?: string; aliases?: string[] } = { aliases: aliasesArr };
    if (name.trim() && name.trim() !== product.name) patch.name = name.trim();
    onSave(patch);
  };

  return (
    <li className={cn('flex flex-col gap-2 rounded-lg border border-border bg-card p-2 shadow-card sm:flex-row sm:items-center', !product.active && 'opacity-60')}>
      <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={save} maxLength={120} className="h-9 sm:max-w-[16rem]" />
      <Input
        value={aliases}
        onChange={(e) => setAliases(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        placeholder="Apelidos (vírgula)"
        maxLength={300}
        className="h-9 flex-1"
      />
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onToggle} disabled={busy} title={product.active ? 'Desativar' : 'Ativar'} className="text-muted-foreground">
          {product.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} disabled={busy} title="Excluir" className="text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
