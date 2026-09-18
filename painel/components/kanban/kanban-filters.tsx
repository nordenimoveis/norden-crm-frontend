'use client';

import { Search, Users, Check, Archive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TEMPERATURES, TEMPERATURE_LABELS, type Broker, type Temperature } from '@/lib/types';
import { TEMP_DOT } from '@/lib/temperature';
import { cn } from '@/lib/utils';

interface Props {
  search: string;
  onSearch: (v: string) => void;
  temperature: Temperature | null;
  onTemperature: (t: Temperature | null) => void;
  includeOld: boolean;
  onIncludeOld: (v: boolean) => void;
  isManager: boolean;
  brokerId: string | null;
  onBroker: (id: string | null) => void;
  brokers: Broker[];
}

export function KanbanFilters({
  search,
  onSearch,
  temperature,
  onTemperature,
  includeOld,
  onIncludeOld,
  isManager,
  brokerId,
  onBroker,
  brokers,
}: Props) {
  const brokerName = brokers.find((b) => b.id === brokerId)?.name;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Busca */}
      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por nome, telefone…"
          className="pl-9"
          aria-label="Buscar leads"
        />
      </div>

      {/* Filtros rápidos de temperatura */}
      <div className="flex items-center gap-1">
        {TEMPERATURES.map((t) => {
          const active = temperature === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onTemperature(active ? null : t)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-foreground/20 bg-foreground/[0.06] text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              <span className={cn('size-2 rounded-full', TEMP_DOT[t])} />
              {TEMPERATURE_LABELS[t]}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Filtro por corretor — só gestores */}
        {isManager && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <Users className="size-4 text-muted-foreground" />
                <span className="max-w-[10rem] truncate">
                  {brokerName ?? 'Todos os corretores'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
              <DropdownMenuLabel>Corretor</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={brokerId ?? ''}
                onValueChange={(v) => onBroker(v || null)}
              >
                <DropdownMenuRadioItem value="">Todos os corretores</DropdownMenuRadioItem>
                {brokers.map((b) => (
                  <DropdownMenuRadioItem key={b.id} value={b.id}>
                    {b.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Base Antiga (fora por padrão) */}
        <button
          type="button"
          onClick={() => onIncludeOld(!includeOld)}
          aria-pressed={includeOld}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors',
            includeOld
              ? 'border-accent/40 bg-accent/[0.08] text-foreground'
              : 'border-input bg-card text-muted-foreground hover:bg-muted',
          )}
          title="Mostrar leads da Base Antiga"
        >
          {includeOld ? <Check className="size-4" /> : <Archive className="size-4" />}
          Base Antiga
        </button>
      </div>
    </div>
  );
}
