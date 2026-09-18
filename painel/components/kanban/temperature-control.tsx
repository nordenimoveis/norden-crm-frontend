'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TEMPERATURES, TEMPERATURE_LABELS, type Temperature } from '@/lib/types';
import { TEMP_DOT } from '@/lib/temperature';
import { cn } from '@/lib/utils';

/** Ponto colorido da temperatura (uso estático, ex.: no overlay de arraste). */
export function TemperatureDot({ value }: { value: Temperature }) {
  return <span className={cn('size-2 rounded-full', TEMP_DOT[value])} aria-hidden />;
}

interface Props {
  value: Temperature;
  suggested?: Temperature | null;
  onChange: (t: Temperature) => void;
}

/**
 * Editor de temperatura no próprio card. Abre um menu para trocar sem abrir o
 * cadastro. O `onPointerDown` com stopPropagation impede que o clique inicie o
 * arraste do card (dnd-kit).
 */
export function TemperatureControl({ value, suggested, onChange }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Alterar temperatura"
        >
          <TemperatureDot value={value} />
          <span>{TEMPERATURE_LABELS[value]}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Temperatura</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as Temperature)}>
          {TEMPERATURES.map((t) => (
            <DropdownMenuRadioItem
              key={t}
              value={t}
              onPointerDown={(e) => e.stopPropagation()}
              className="gap-2"
            >
              <TemperatureDot value={t} />
              <span>{TEMPERATURE_LABELS[t]}</span>
              {suggested === t && (
                <span className="ml-auto text-[0.65rem] font-medium uppercase tracking-wide text-accent">
                  IA
                </span>
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
