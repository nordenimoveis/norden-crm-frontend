import 'server-only';
import { cookies } from 'next/headers';
import { CRM_API_URL, SESSION_COOKIE } from '@/lib/config';
import type { User } from '@/lib/types';

/** Lê o JWT do cookie httpOnly (só no servidor). */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Usuário atual, buscado em /auth/me com o token da sessão.
 * Retorna null se não houver sessão ou se o token estiver inválido/expirado.
 * Os papéis servem só para a interface — a API continua garantindo o acesso.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const res = await fetch(`${CRM_API_URL}/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    // A API pode devolver { user } ou o próprio usuário.
    return (data.user ?? data) as User;
  } catch {
    return null;
  }
}
