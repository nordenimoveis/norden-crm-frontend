import { cookies } from 'next/headers';
import { CRM_API_URL, SESSION_COOKIE } from '@/lib/config';

// SSE precisa de runtime Node e resposta dinâmica (streaming, sem cache).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Proxy de Server-Sent Events. O EventSource do navegador não manda cabeçalhos,
 * então ele chama /api/events (cookie same-origin) e nós repassamos para
 * /events?token=<jwt> na API, devolvendo o corpo em streaming.
 */
export async function GET(request: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response('sessão expirada', { status: 401 });
  }

  const upstream = await fetch(`${CRM_API_URL}/events?token=${encodeURIComponent(token)}`, {
    headers: { accept: 'text/event-stream' },
    // Encerra o upstream quando o cliente desconecta.
    signal: request.signal,
    cache: 'no-store',
  }).catch(() => null);

  if (!upstream || !upstream.ok || !upstream.body) {
    return new Response('não foi possível abrir o fluxo de eventos', { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      // Desliga o buffering de proxies (Caddy/Nginx) para o evento chegar na hora.
      'x-accel-buffering': 'no',
    },
  });
}
