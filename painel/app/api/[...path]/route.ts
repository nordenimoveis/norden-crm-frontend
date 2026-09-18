import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  CRM_API_URL,
  SESSION_COOKIE,
  isPathAllowed,
  sessionCookieOptions,
} from '@/lib/config';
import { sameOrigin } from '@/lib/server/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Proxy genérico: o navegador chama /api/<rota> e este handler repassa para a
 * API do CRM pela rede interna, anexando o JWT do cookie como Bearer.
 * - Só rotas da allowlist passam (bloqueia internal/* e webhooks/*).
 * - Requisições que alteram dados exigem Origin igual ao host (anti-CSRF).
 * - 401 da API limpa o cookie: a sessão expirou.
 */
async function handle(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  const path = (segments ?? []).join('/');

  if (!isPathAllowed(path)) {
    return NextResponse.json({ error: 'Rota não encontrada' }, { status: 404 });
  }
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Origem inválida' }, { status: 403 });
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 });
  }

  const search = new URL(request.url).search;
  const target = `${CRM_API_URL}/${path}${search}`;

  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  const contentType = request.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let apiRes: Response;
  try {
    apiRes = await fetch(target, {
      method,
      headers,
      body: body && body.byteLength ? Buffer.from(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Servidor indisponível' }, { status: 502 });
  }

  const resBody = await apiRes.arrayBuffer();
  const res = new NextResponse(resBody, {
    status: apiRes.status,
    headers: {
      'content-type': apiRes.headers.get('content-type') ?? 'application/json',
    },
  });

  // Token vencido/revogado: derruba a sessão local para forçar novo login.
  if (apiRes.status === 401) {
    res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  }
  return res;
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
