import 'server-only';

/** Métodos que alteram dados e, por isso, exigem checagem de origem. */
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Proteção simples contra CSRF: em requisições que alteram dados, o cabeçalho
 * `Origin` precisa bater com o host da própria requisição. Navegadores sempre
 * mandam `Origin` em POST/PATCH/etc via fetch, então a ausência é suspeita.
 * GET/HEAD passam direto (não alteram estado).
 */
export function sameOrigin(request: Request): boolean {
  if (!MUTATING.has(request.method.toUpperCase())) return true;

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
