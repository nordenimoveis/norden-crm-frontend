import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server/session';
import { isManager } from '@/lib/types';
import { DashboardView } from '@/components/dashboard/dashboard-view';

/** Home do gestor: indicadores do CRM. Corretor não tem acesso ao relatório. */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isManager(user.role)) redirect('/kanban');
  return <DashboardView />;
}
