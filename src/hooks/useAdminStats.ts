// src/hooks/useAdminStats.ts - Dashboard Statistics (All Users)
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AdminStats {
  totalUsers: number;
  totalLocations: number;
  totalInspections: number;
  todayInspections: number;
  inspections7d: number;
  inspections30d: number;
  activeUsers: number;
  avgScore: number;
  userGrowth: number;
  inspectionGrowth: number;
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
      const data = result.data as AdminStats;
      console.log('[useAdminStats] Stats retrieved:', data);

      // If API didn't return 7d/30d, fetch directly from Supabase
      if (!data.inspections7d && !data.inspections30d) {
        console.log('[useAdminStats] API missing 7d/30d, fetching directly...');
        const now = new Date();
        const weekAgo = dateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
        const monthAgo = dateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30));

        const [r7, r30] = await Promise.all([
          supabase.from('inspection_records').select('*', { count: 'exact', head: true }).gte('inspection_date', weekAgo),
          supabase.from('inspection_records').select('*', { count: 'exact', head: true }).gte('inspection_date', monthAgo),
        ]);

        data.inspections7d = r7.count || 0;
        data.inspections30d = r30.count || 0;
        console.log('[useAdminStats] Fallback 7d:', data.inspections7d, '30d:', data.inspections30d);
      }

      // Also fetch totalUsers/totalLocations if API returned 0
      if (!data.totalUsers) {
        const [u, l] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('locations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        ]);
        data.totalUsers = u.count || 0;
        data.totalLocations = l.count || 0;
      }

      return data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
