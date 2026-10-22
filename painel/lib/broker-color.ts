/**
 * Cor estável por corretor, derivada do id — o mesmo corretor sempre recebe a
 * mesma cor (no selo do card e no chip do filtro). Classes escritas por extenso
 * para o JIT do Tailwind gerá-las.
 */
const BROKER_COLORS = [
  { dot: 'bg-sky-500', pill: 'bg-sky-500/12 text-sky-700 dark:text-sky-300' },
  { dot: 'bg-violet-500', pill: 'bg-violet-500/12 text-violet-700 dark:text-violet-300' },
  { dot: 'bg-emerald-500', pill: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' },
  { dot: 'bg-amber-500', pill: 'bg-amber-500/14 text-amber-700 dark:text-amber-300' },
  { dot: 'bg-rose-500', pill: 'bg-rose-500/12 text-rose-700 dark:text-rose-300' },
  { dot: 'bg-teal-500', pill: 'bg-teal-500/12 text-teal-700 dark:text-teal-300' },
  { dot: 'bg-indigo-500', pill: 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300' },
  { dot: 'bg-fuchsia-500', pill: 'bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300' },
];

function idx(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % BROKER_COLORS.length;
}

/** Ponto sólido (chip do filtro). Sem corretor → cinza neutro. */
export function brokerDot(id?: string | null): string {
  return id ? BROKER_COLORS[idx(id)]!.dot : 'bg-muted-foreground/40';
}

/** Fundo suave + texto (selo do card). Sem corretor → neutro. */
export function brokerPill(id?: string | null): string {
  return id ? BROKER_COLORS[idx(id)]!.pill : 'bg-muted text-muted-foreground';
}
