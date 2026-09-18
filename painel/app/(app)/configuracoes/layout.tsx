import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { isManager } from '@/lib/types';
import { ConfigNav } from '@/components/gestao/config-nav';

/** Área de gestão — só DONO/ADMIN. Corretor é mandado de volta ao quadro. */
export default async function ConfigLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isManager(user.role)) redirect('/kanban');

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-medium tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Funil de vendas e motivos de perda.</p>
      </div>
      <ConfigNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
