'use client';

import type { User } from '@/lib/types';

/** Erro de API com status e (quando houver) detalhes de validação. */
export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Chamada à API do CRM através do proxy do painel (/api/...).
 * O cookie httpOnly vai junto automaticamente (same-origin).
 * Em 401, a sessão caiu: mandamos o usuário para o login.
 */
export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/${path.replace(/^\/+/, '')}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError('Sessão expirada', 401);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = (data as { error?: string })?.error ?? 'Erro inesperado';
    throw new ApiError(message, res.status, (data as { details?: unknown })?.details);
  }
  return data as T;
}

/** Login pelo route handler (guarda o cookie httpOnly). */
export async function login(email: string, password: string): Promise<User | null> {
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error ?? 'Falha no login', res.status);
  }
  return (data as { user?: User }).user ?? null;
}

/** Logout: apaga o cookie e volta ao login. */
export async function logout(): Promise<void> {
  await fetch('/api/session', { method: 'DELETE' }).catch(() => {});
  if (typeof window !== 'undefined') window.location.href = '/login';
}

/** Usuário atual (para telas client-side que precisam confirmar a sessão). */
export function getMe(): Promise<{ user: User } | User> {
  return apiFetch('auth/me');
}
