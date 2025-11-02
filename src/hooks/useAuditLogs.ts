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
 * Fetch audit logs (admin only) - BACKEND API VERSION
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
      console.log('[useAuditLogs] Fetching audit logs from backend API...');

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (userId) params.append('userId', userId);
      if (action) params.append('action', action);

      // ✅ Call backend API instead of direct Supabase query
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[useAuditLogs] Backend API error:', error);
        throw new Error(error.error || 'Failed to fetch audit logs');
      }

      const result = await response.json();
      const logs = result.data.logs as AuditLog[];

      console.log('[useAuditLogs] Fetched', logs.length, 'audit logs from backend API');
      return logs;
    },
    staleTime: 30 * 1000, // 30 seconds (relatively fresh)
  });
}

/**
 * Fetch recent admin actions (last 24 hours) - BACKEND API VERSION
 */
export function useRecentAdminActions() {
  return useQuery({
    queryKey: ['recent-admin-actions'],
    queryFn: async () => {
      console.log('[useRecentAdminActions] Fetching recent admin actions from backend API...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // ✅ Call backend API with 'since' filter
      const params = new URLSearchParams({
        limit: '50',
        since: yesterday.toISOString(),
      });

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch recent admin actions');
      }

      const result = await response.json();
      return result.data.logs as AuditLog[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch failed actions (errors only) - BACKEND API VERSION
 */
export function useFailedActions(limit: number = 50) {
  return useQuery({
    queryKey: ['failed-actions', limit],
    queryFn: async () => {
      console.log('[useFailedActions] Fetching failed actions from backend API...');

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // ✅ Call backend API with 'success=false' filter
      const params = new URLSearchParams({
        limit: limit.toString(),
        success: 'false',
      });

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch failed actions');
      }

      const result = await response.json();
      return result.data.logs as AuditLog[];
    },
    staleTime: 30 * 1000,
  });
}
