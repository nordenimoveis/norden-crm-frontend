import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { SessionProvider } from '@/components/session-provider';
import { RealtimeProvider } from '@/components/realtime-provider';
import { AppTopbar } from '@/components/app-topbar';

/**
 * Shell autenticado. Confirma a sessão no servidor (via /auth/me) e injeta o
 * usuário. Se o token não valer mais, volta ao login.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <SessionProvider user={user}>
      <RealtimeProvider>
        <div className="flex min-h-dvh flex-col">
          <AppTopbar />
          <main className="flex-1">{children}</main>
        </div>
      </RealtimeProvider>
    </SessionProvider>
  );
}
