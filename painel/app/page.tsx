import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { isManager } from '@/lib/types';

/**
 * Raiz: gestor vai para o Dashboard, corretor direto ao funil.
 * O middleware já exige sessão antes de chegar aqui.
 */
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  redirect(isManager(user.role) ? '/dashboard' : '/kanban');
}
