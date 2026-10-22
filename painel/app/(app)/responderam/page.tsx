import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { InboxView } from '@/components/inbox/inbox-view';

/**
 * Caixa "Responderam": triagem dos leads de campanha que responderam.
 * Gestor vê todos; corretor vê só os seus (a API filtra por `leadScope`), já que
 * a roleta passou a atribuir os respondentes de disparo a um corretor.
 */
export default async function ResponderamPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return (
    <Suspense>
      <InboxView />
    </Suspense>
  );
}
