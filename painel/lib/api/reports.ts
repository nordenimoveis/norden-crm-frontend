'use client';

import { apiFetch } from './client';
import type { ReportSummary } from '@/lib/types';

export function getReport(days: number): Promise<ReportSummary> {
  return apiFetch<ReportSummary>(`reports/summary?days=${days}`);
}
