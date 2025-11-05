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
 * Fallback: Direct database query if backend API fails
 * This ensures admin access doesn't break even if backend has issues
 */
async function fallbackRoleCheck(userId: string): Promise<{ isAdmin: boolean; isSuperAdmin: boolean }> {
  console.warn('[useIsAdmin] ⚠️ Using fallback - direct database query');

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles!user_roles_role_id_fkey (
          id,
          name,
          level
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('[useIsAdmin] Fallback query error:', error);
      return { isAdmin: false, isSuperAdmin: false };
    }

    const role = data.roles as { id: string; name: string; level: number } | null;
    const level = role?.level || 0;

    console.log('[useIsAdmin] ✅ Fallback result:', { role: role?.name, level });

    return {
      isAdmin: level >= 80,
      isSuperAdmin: level >= 90, // Super admin level: 90+ (superadmin & system_admin)
    };
  } catch (error) {
    console.error('[useIsAdmin] Fallback error:', error);
    return { isAdmin: false, isSuperAdmin: false };
  }
}

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
        // ATTEMPT 1: Backend API (preferred - server-side validated)
        // ✅ FIX: Use localStorage token instead of getSession() to avoid hang
        console.log('[useIsAdmin] 🔐 Getting token from localStorage for role verification...');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const projectId = supabaseUrl.split('//')[1]?.split('.')[0];

        if (!projectId) {
          console.error('[useIsAdmin] Invalid Supabase URL');
          return await fallbackRoleCheck(user.id);
        }

        const storageKey = `sb-${projectId}-auth-token`;
        const sessionStr = localStorage.getItem(storageKey);

        if (!sessionStr) {
          console.error('[useIsAdmin] No session in localStorage');
          return await fallbackRoleCheck(user.id);
        }

        const sessionData = JSON.parse(sessionStr);
        const token = sessionData?.access_token;

        if (!token) {
          console.error('[useIsAdmin] No access token in session');
          // Fallback to direct query
          return await fallbackRoleCheck(user.id);
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
          console.error('[useIsAdmin] ❌ API error:', response.status);

          // ATTEMPT 2: Fallback to direct database query
          if (response.status >= 500) {
            console.warn('[useIsAdmin] ⚠️ Backend error (500+), using fallback');
            return await fallbackRoleCheck(user.id);
          }

          // For 401/403, don't fallback - user really is unauthorized
          console.log('[useIsAdmin] ❌ Auth error (401/403), returning false');
          return { isAdmin: false, isSuperAdmin: false };
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('[useIsAdmin] Non-JSON response, using fallback');
          return await fallbackRoleCheck(user.id);
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
        console.error('[useIsAdmin] Unexpected error:', error);

        // ATTEMPT 3: Final fallback
        console.warn('[useIsAdmin] Exception caught, using fallback');
        return await fallbackRoleCheck(user.id);
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
