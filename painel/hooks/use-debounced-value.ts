'use client';

import { useEffect, useState } from 'react';

/** Retorna o valor após parar de mudar por `delay` ms (evita busca a cada tecla). */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
