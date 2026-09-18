'use client';

import { useQuery } from '@tanstack/react-query';
import { getReport } from '@/lib/api/reports';

export function useReport(days: number, enabled = true) {
  return useQuery({ queryKey: ['report', days], queryFn: () => getReport(days), enabled });
}
