import { Suspense } from 'react';
import { LeadsView } from '@/components/leads/leads-view';

/** Lista completa de leads (inclui a Base Antiga do Imobzi), com filtros. */
export default function LeadsPage() {
  return (
    <Suspense>
      <LeadsView />
    </Suspense>
  );
}
