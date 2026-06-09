// src/hooks/useInspectionTrend.ts — Reuse useAdminStats cache for daily trend
import { useAdminStats } from './useAdminStats';

export interface DailyTrend {
  date: string;
  count: number;
}

export function useInspectionTrend(_days: number = 30) {
  // Reuse the admin stats query which already includes dailyTrend
  const { data, isLoading, error } = useAdminStats();

  return {
    data: (data?.dailyTrend || []) as DailyTrend[],
    isLoading,
    error,
  };
}
