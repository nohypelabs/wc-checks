// src/hooks/useAdminStats.ts - Dashboard Statistics (All Users)
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AdminStats {
  totalUsers: number;
  totalLocations: number;
  totalInspections: number;
  todayInspections: number;
  activeUsers: number;
  avgScore: number;
  userGrowth: number;
  inspectionGrowth: number;
}

// Fetch dashboard statistics (available to all authenticated users)
export function useAdminStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('[useAdminStats] Fetching dashboard stats from /api/stats...');

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch statistics');
      }

      const result = await response.json();
      console.log('[useAdminStats] Stats retrieved:', result.data);

      return result.data as AdminStats;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
