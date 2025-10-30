// src/hooks/useIsAdmin.ts - Check if current user is admin (DIRECT QUERY VERSION)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('[useIsAdmin] Checking admin status for user:', user.id);

        // METHOD 1: Try RPC function first
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('is_admin');

          if (!rpcError && rpcResult !== null) {
            console.log('[useIsAdmin] RPC is_admin() returned:', rpcResult);
            setIsAdmin(rpcResult === true);
            setLoading(false);
            return;
          } else {
            console.warn('[useIsAdmin] RPC is_admin() failed or not found:', rpcError?.message);
          }
        } catch (rpcErr) {
          console.warn('[useIsAdmin] RPC call exception:', rpcErr);
        }

        // METHOD 2: Fallback to direct query with explicit FK
        console.log('[useIsAdmin] Trying direct query method...');

        const { data, error } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            role_id,
            roles!user_roles_role_id_fkey (
              id,
              name,
              level
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[useIsAdmin] Direct query error:', error);
          setIsAdmin(false);
        } else if (data) {
          // Check if role level >= 80 (admin level)
          const roleLevel = (data.roles as any)?.level || 0;
          const roleName = (data.roles as any)?.name || 'unknown';

          console.log('[useIsAdmin] User role:', JSON.stringify({
            name: roleName,
            level: roleLevel,
            isAdmin: roleLevel >= 80
          }));

          setIsAdmin(roleLevel >= 80);
        } else {
          console.warn('[useIsAdmin] No role found for user');
          setIsAdmin(false);
        }

      } catch (error) {
        console.error('[useIsAdmin] Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  return { isAdmin, loading };
}
