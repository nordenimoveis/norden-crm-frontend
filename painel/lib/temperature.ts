import type { Temperature } from '@/lib/types';

/** Cor do ponto de cada temperatura (tokens do tema). */
export const TEMP_DOT: Record<Temperature, string> = {
  NAO_AVALIADO: 'bg-temp-neutro',
  FRIO: 'bg-temp-frio',
  MORNO: 'bg-temp-morno',
  QUENTE: 'bg-temp-quente',
};

/** Cor do texto de cada temperatura. */
export const TEMP_TEXT: Record<Temperature, string> = {
  NAO_AVALIADO: 'text-muted-foreground',
  FRIO: 'text-temp-frio',
  MORNO: 'text-temp-morno',
  QUENTE: 'text-temp-quente',
};
