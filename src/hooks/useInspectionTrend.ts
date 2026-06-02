// src/hooks/useInspectionTrend.ts — Fetch daily trend data with configurable period
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface DailyTrend {
  date: string;
  count: number;
}

export function useInspectionTrend(days: number = 30) {
  return useQuery({
    queryKey: ['inspection-trend', days],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('No authentication token');

      const response = await fetch(`/api/stats?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch trend data');
      }

      const result = await response.json();
      return (result.data?.dailyTrend || []) as DailyTrend[];
    },
    staleTime: 60 * 1000,
  });
}
