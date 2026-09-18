'use client';

import { createContext, useContext } from 'react';
import type { User } from '@/lib/types';
import { isManager } from '@/lib/types';

const SessionContext = createContext<User | null>(null);

/** Disponibiliza o usuário logado para os componentes cliente. */
export function SessionProvider({ user, children }: { user: User; children: React.ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

/** Usuário logado. Lança se usado fora do provedor (erro de programação). */
export function useSession(): User {
  const user = useContext(SessionContext);
  if (!user) throw new Error('useSession precisa estar dentro de <SessionProvider>');
  return user;
}

/** Atalho: o usuário logado é gestor (DONO/ADMIN)? */
export function useIsManager(): boolean {
  return isManager(useContext(SessionContext)?.role);
}
