import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { isManager } from '@/lib/types';
import { InboxView } from '@/components/inbox/inbox-view';

/** Caixa "Responderam": triagem dos leads de campanha (base antiga) que responderam. */
export default async function ResponderamPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  // Leads da Base Antiga só são visíveis para gestores (regra de isolamento).
  if (!isManager(user.role)) redirect('/kanban');
  return (
    <Suspense>
      <InboxView />
    </Suspense>
  );
}
