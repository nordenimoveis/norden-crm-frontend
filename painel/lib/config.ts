import 'server-only';

/**
 * Configuração exclusiva do SERVIDOR do painel (route handlers e RSC).
 * Nada aqui pode vazar para o navegador.
 */

/** URL interna da API do CRM. O navegador nunca fala com ela diretamente. */
export const CRM_API_URL = (process.env.CRM_API_URL ?? 'http://localhost:3333').replace(/\/$/, '');

/** Nome do cookie de sessão (guarda o JWT, httpOnly). */
export const SESSION_COOKIE = 'norden_session';

/** Duração da sessão: 12h, alinhada ao JWT emitido pela API. */
export const SESSION_MAX_AGE = 60 * 60 * 12;

const IS_PROD = process.env.NODE_ENV === 'production';

/** Opções do cookie de sessão. `secure` só em produção (dev roda em http). */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

/**
 * Rotas da API que o proxy do painel pode repassar.
 * Cada item é o começo do caminho (sem a barra inicial).
 * Tudo que não casar é recusado com 404 — em especial `internal/*` e `webhooks/*`.
 */
const ALLOWED_PREFIXES = [
  'auth/me',
  'leads',
  'pipeline',
  'loss-reasons',
  'campaigns',
  'campaign-templates',
  'quick-replies',
  'brokers',
  'users',
  'reports',
  'tasks',
];

/** Segmentos sempre bloqueados, mesmo que algum prefixo mude no futuro. */
const BLOCKED_PREFIXES = ['internal', 'webhooks', 'auth/login'];

/** Decide se um caminho da API pode passar pelo proxy. */
export function isPathAllowed(path: string): boolean {
  const clean = path.replace(/^\/+/, '').split('?')[0] ?? '';
  if (BLOCKED_PREFIXES.some((p) => clean === p || clean.startsWith(p + '/'))) {
    return false;
  }
  return ALLOWED_PREFIXES.some((p) => clean === p || clean.startsWith(p + '/'));
}
