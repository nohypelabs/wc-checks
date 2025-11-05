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
      console.log('[useIsAdmin] 🚀 Query function called for user:', user?.id);

      if (!user?.id) {
        console.log('[useIsAdmin] ❌ No user ID, returning false');
        return { isAdmin: false, isSuperAdmin: false };
      }

      try {
        // ✅ BACKEND API ONLY - No direct database queries
        console.log('[useIsAdmin] 🔐 Getting token from localStorage for role verification...');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const projectId = supabaseUrl.split('//')[1]?.split('.')[0];

        if (!projectId) {
          console.error('[useIsAdmin] ❌ Invalid Supabase URL - DENYING ACCESS');
          return { isAdmin: false, isSuperAdmin: false };
        }

        const storageKey = `sb-${projectId}-auth-token`;
        const sessionStr = localStorage.getItem(storageKey);

        if (!sessionStr) {
          console.error('[useIsAdmin] ❌ No session in localStorage - DENYING ACCESS');
          return { isAdmin: false, isSuperAdmin: false };
        }

        const sessionData = JSON.parse(sessionStr);
        const token = sessionData?.access_token;

        if (!token) {
          console.error('[useIsAdmin] ❌ No access token in session - DENYING ACCESS');
          return { isAdmin: false, isSuperAdmin: false };
        }

        console.log('[useIsAdmin] ✅ Got token from localStorage for role check');

        // Call backend API for server-side role verification
        console.log('[useIsAdmin] 📡 Calling backend API /api/auth/verify-role...');
        const response = await fetch('/api/auth/verify-role', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('[useIsAdmin] 📡 Backend API response status:', response.status);

        if (!response.ok) {
          console.error('[useIsAdmin] ❌ API error:', response.status, '- DENYING ACCESS');

          // ✅ NO FALLBACK - Always deny access if backend API fails
          // This ensures proper authorization and audit logging
          if (response.status >= 500) {
            console.error('[useIsAdmin] ❌ Backend server error (500+) - DENYING ACCESS');
          } else {
            console.error('[useIsAdmin] ❌ Unauthorized (401/403) - DENYING ACCESS');
          }

          return { isAdmin: false, isSuperAdmin: false };
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[useIsAdmin] ❌ Non-JSON response from backend - DENYING ACCESS');
          return { isAdmin: false, isSuperAdmin: false };
        }

        const result: VerifyRoleResponse = await response.json();

        console.log('[useIsAdmin] ✅ Backend verified role:', JSON.stringify(result.data.role));
        console.log('[useIsAdmin] 🔍 Result:', {
          isAdmin: result.data.isAdmin,
          isSuperAdmin: result.data.isSuperAdmin,
          level: result.data.role.level,
          roleName: result.data.role.name,
        });

        // ✅ EXTRA DEBUG: Log the actual comparison
        console.log('[useIsAdmin] 🔍 Level check:', {
          level: result.data.role.level,
          'level >= 90': result.data.role.level >= 90,
          'result.isSuperAdmin': result.data.isSuperAdmin,
        });

        return {
          isAdmin: result.data.isAdmin,
          isSuperAdmin: result.data.isSuperAdmin,
        };
      } catch (error) {
        console.error('[useIsAdmin] ❌ Unexpected error:', error);

        // ✅ NO FALLBACK - Deny access on any error
        // All authorization must go through backend API for security
        console.error('[useIsAdmin] ❌ Exception caught - DENYING ACCESS');
        return { isAdmin: false, isSuperAdmin: false };
      }
    },
    enabled: !!user?.id, // Only run when user is available
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry twice before giving up
    retryDelay: 1000, // Wait 1s between retries
    // Return false defaults on error instead of throwing
    throwOnError: false,
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

  // ✅ DEBUG: Log query state
  console.log('[useIsAdmin] 🔍 Query state:', {
    authLoading,
    isLoading,
    isFetching,
    fetchStatus,
    hasUser: !!user?.id,
    hasData: !!data,
    hasNeverFetched,
    dataUpdatedAt,
  });

  // ✅ DEBUG: Log what we're returning
  console.log('[useIsAdmin] 📤 Returning:', {
    isAdmin: data?.isAdmin ?? false,
    isSuperAdmin: data?.isSuperAdmin ?? false,
    loading: isReallyLoading,
    hasData: !!data,
    hasError: !!error,
  });

  // Always return safe defaults - never undefined
  return {
    isAdmin: data?.isAdmin ?? false,
    isSuperAdmin: data?.isSuperAdmin ?? false,
    loading: isReallyLoading, // ✅ Use real loading state
    error: error ? String(error) : null,
  };
}
