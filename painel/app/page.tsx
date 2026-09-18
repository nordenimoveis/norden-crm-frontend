import { redirect } from 'next/navigation';

/** A raiz leva ao Kanban; o middleware cuida de exigir sessão. */
export default function Home() {
  redirect('/kanban');
}
