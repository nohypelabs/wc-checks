// src/hooks/useIsAdmin.ts - Check if current user is admin (BACKEND API WITH FALLBACK)
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface VerifyRoleResponse {
  success: boolean;
  data: {
    userId: string;
    role: {
      id: string;
      name: string;
      level: number;
    };
    isAdmin: boolean;
    isSuperAdmin: boolean;
  };
}

/**
 * ✅ SECURITY: All role checks MUST go through backend API
 *
 * NO direct database queries allowed to prevent:
 * - Frontend authorization bypass
 * - Inconsistent role validation
 * - Missing audit logs
 *
 * If backend API fails, return false (deny access) instead of fallback
 */

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, isFetching, error, dataUpdatedAt, fetchStatus } = useQuery({
    queryKey: ['verify-role', user?.id],
    queryFn: async (): Promise<{ isAdmin: boolean; isSuperAdmin: boolean }> => {
      if (!user?.id) {
        return { isAdmin: false, isSuperAdmin: false };
      }

      try {
        // ✅ BACKEND API ONLY - No direct database queries
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const projectId = supabaseUrl.split('//')[1]?.split('.')[0];

        if (!projectId) {
          console.error('[useIsAdmin] Invalid Supabase URL');
          return { isAdmin: false, isSuperAdmin: false };
        }

        const storageKey = `sb-${projectId}-auth-token`;
        const sessionStr = localStorage.getItem(storageKey);

        if (!sessionStr) {
          console.error('[useIsAdmin] No session in localStorage');
          return { isAdmin: false, isSuperAdmin: false };
        }

        const sessionData = JSON.parse(sessionStr);
        const token = sessionData?.access_token;

        if (!token) {
          console.error('[useIsAdmin] No access token');
          return { isAdmin: false, isSuperAdmin: false };
        }

        // Call backend API for server-side role verification
        const response = await fetch('/api/auth/verify-role', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('[useIsAdmin] API error:', response.status);
          return { isAdmin: false, isSuperAdmin: false };
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[useIsAdmin] Non-JSON response');
          return { isAdmin: false, isSuperAdmin: false };
        }

        const result: VerifyRoleResponse = await response.json();

        return {
          isAdmin: result.data.isAdmin,
          isSuperAdmin: result.data.isSuperAdmin,
        };
      } catch (error) {
        console.error('[useIsAdmin] Unexpected error:', error);
        return { isAdmin: false, isSuperAdmin: false };
      }
    },
    enabled: !!user?.id, // Only run when user is available
    staleTime: 30 * 60 * 1000, // 30 minutes - role changes are rare
    gcTime: 60 * 60 * 1000, // 60 minutes garbage collection
    retry: 1, // Retry once before giving up (faster failure)
    retryDelay: 500, // Wait 500ms between retries (faster retry)
    // Return false defaults on error instead of throwing
    throwOnError: false,
    refetchOnWindowFocus: false, // Don't refetch on window focus (reduce API calls)
  });

  // Log error if present for debugging
  if (error) {
    console.error('[useIsAdmin] Query error:', error);
  }

  // ✅ FIX: Calculate real loading state
  // We're loading if:
  // 1. Auth is still loading, OR
  // 2. Query is loading/fetching, OR
  // 3. We have a user but haven't fetched data yet (dataUpdatedAt === 0)
  const hasNeverFetched = dataUpdatedAt === 0;
  const isReallyLoading = authLoading || isLoading || isFetching || (!!user?.id && hasNeverFetched);

  // Always return safe defaults - never undefined
  return {
    isAdmin: data?.isAdmin ?? false,
    isSuperAdmin: data?.isSuperAdmin ?? false,
    loading: isReallyLoading, // ✅ Use real loading state
    error: error ? String(error) : null,
  };
}
