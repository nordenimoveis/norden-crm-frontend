import { Suspense } from 'react';
import { TasksView } from '@/components/tasks/tasks-view';

/** Lista de tarefas do corretor (ligações sugeridas pela régua). */
export default function TarefasPage() {
  return (
    <Suspense>
      <TasksView />
    </Suspense>
  );
}
