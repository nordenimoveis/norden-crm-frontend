import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/config';

/**
 * Guarda de rotas leve: só verifica se o cookie de sessão existe.
 * A validade do token e as permissões (papéis) ficam a cargo da API — o
 * middleware apenas evita renderizar telas internas sem sessão.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === '/login';

  // Sem sessão em rota interna → manda para o login.
  if (!hasSession && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Já logado tentando abrir o login → vai para o Kanban.
  if (hasSession && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/kanban';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Não intercepta API, assets do Next, arquivos estáticos nem o favicon.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
