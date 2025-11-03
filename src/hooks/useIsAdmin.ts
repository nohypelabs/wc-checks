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
      isSuperAdmin: level >= 100,
    };
  } catch (error) {
    console.error('[useIsAdmin] Fallback error:', error);
    return { isAdmin: false, isSuperAdmin: false };
  }
}

export function useIsAdmin() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['verify-role', user?.id],
    queryFn: async (): Promise<{ isAdmin: boolean; isSuperAdmin: boolean }> => {
      if (!user?.id) {
        return { isAdmin: false, isSuperAdmin: false };
      }

      try {
        // ATTEMPT 1: Backend API (preferred - server-side validated)
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.error('[useIsAdmin] No access token available');
          // Fallback to direct query
          return await fallbackRoleCheck(user.id);
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

          // ATTEMPT 2: Fallback to direct database query
          if (response.status >= 500) {
            console.warn('[useIsAdmin] Backend error (500+), using fallback');
            return await fallbackRoleCheck(user.id);
          }

          // For 401/403, don't fallback - user really is unauthorized
          return { isAdmin: false, isSuperAdmin: false };
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('[useIsAdmin] Non-JSON response, using fallback');
          return await fallbackRoleCheck(user.id);
        }

        const result: VerifyRoleResponse = await response.json();

        console.log('[useIsAdmin] ✅ Backend verified role:', result.data.role);

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
    enabled: !!user?.id,
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

  // Always return safe defaults - never undefined
  return {
    isAdmin: data?.isAdmin ?? false,
    isSuperAdmin: data?.isSuperAdmin ?? false,
    loading: isLoading,
    error: error ? String(error) : null,
  };
}
