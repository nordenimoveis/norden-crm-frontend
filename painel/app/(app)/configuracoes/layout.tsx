import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { isManager } from '@/lib/types';

/** Área de gestão — só DONO/ADMIN. Corretor é mandado de volta ao quadro.
 *  A navegação entre as telas agora fica no menu lateral (AppShell). */
export default async function ConfigLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isManager(user.role)) redirect('/kanban');

  return <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">{children}</div>;
}
