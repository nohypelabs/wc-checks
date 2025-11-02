// src/hooks/useAuditLogs.ts - View audit logs (Admin only)
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

/**
 * Fetch audit logs (admin only)
 * @param limit - Number of logs to fetch (default: 100)
 * @param userId - Filter by specific user (optional)
 * @param action - Filter by specific action (optional)
 */
export function useAuditLogs(
  limit: number = 100,
  userId?: string,
  action?: string
) {
  return useQuery({
    queryKey: ['audit-logs', limit, userId, action],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useAuditLogs] Error:', error);
        throw error;
      }

      return data as AuditLog[];
    },
    staleTime: 30 * 1000, // 30 seconds (relatively fresh)
  });
}

/**
 * Fetch recent admin actions (last 24 hours)
 */
export function useRecentAdminActions() {
  return useQuery({
    queryKey: ['recent-admin-actions'],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data as AuditLog[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch failed actions (errors only)
 */
export function useFailedActions(limit: number = 50) {
  return useQuery({
    queryKey: ['failed-actions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as AuditLog[];
    },
    staleTime: 30 * 1000,
  });
}
