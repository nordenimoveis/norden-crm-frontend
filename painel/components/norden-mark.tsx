import { cn } from '@/lib/utils';

/**
 * Assinatura visual da Norden. Sóbria: só o nome em serifada com um traço de
 * acento. Evita logotipo pesado — o clima é de marca de alto padrão.
 */
export function NordenMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-baseline gap-2 select-none', className)}>
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        Norden
      </span>
      <span className="h-4 w-px bg-accent" aria-hidden />
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        CRM
      </span>
    </span>
  );
}
