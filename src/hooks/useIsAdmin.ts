// src/hooks/useIsAdmin.ts - Check if current user is admin (BACKEND API VERSION)
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

export function useIsAdmin() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['verify-role', user?.id],
    queryFn: async (): Promise<{ isAdmin: boolean; isSuperAdmin: boolean }> => {
      if (!user?.id) {
        return { isAdmin: false, isSuperAdmin: false };
      }

      try {
        // Get current session token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.error('[useIsAdmin] No access token available');
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

        const result: VerifyRoleResponse = await response.json();

        console.log('[useIsAdmin] Backend verified role:', result.data.role);

        return {
          isAdmin: result.data.isAdmin,
          isSuperAdmin: result.data.isSuperAdmin,
        };
      } catch (error) {
        console.error('[useIsAdmin] Error verifying role:', error);
        return { isAdmin: false, isSuperAdmin: false };
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    isAdmin: data?.isAdmin || false,
    isSuperAdmin: data?.isSuperAdmin || false,
    loading: isLoading,
  };
}
