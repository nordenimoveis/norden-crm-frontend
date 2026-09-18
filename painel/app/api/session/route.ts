import { NextResponse } from 'next/server';
import { CRM_API_URL, SESSION_COOKIE, sessionCookieOptions } from '@/lib/config';
import { sameOrigin } from '@/lib/server/csrf';

export const runtime = 'nodejs';

/**
 * Login: recebe { email, password }, autentica na API do CRM pelo servidor e
 * guarda o JWT em cookie httpOnly. O token NUNCA chega ao navegador.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Origem inválida' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: 'Informe e-mail e senha' }, { status: 400 });
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${CRM_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Não foi possível falar com o servidor' }, { status: 502 });
  }

  const data = await apiRes.json().catch(() => ({}));
  if (!apiRes.ok) {
    const error = (data as { error?: string }).error ?? 'E-mail ou senha inválidos';
    return NextResponse.json({ error }, { status: apiRes.status });
  }

  const token = (data as { token?: string }).token;
  if (!token) {
    return NextResponse.json({ error: 'Resposta de login inesperada' }, { status: 502 });
  }

  // Devolve só o usuário; o token vai para o cookie httpOnly.
  const res = NextResponse.json({ user: (data as { user?: unknown }).user ?? null });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}

/** Logout: apaga o cookie de sessão. */
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Origem inválida' }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
