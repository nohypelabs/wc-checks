// src/hooks/useAdminStats.ts - Admin Dashboard Statistics via Backend API
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

// Fetch admin dashboard statistics
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      console.log('[useAdminStats] Fetching from backend API...');

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/admin/stats', {
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
