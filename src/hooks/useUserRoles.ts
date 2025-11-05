// src/hooks/useUserRoles.ts - Manage users and their roles (SUPERADMIN ONLY)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('[useUserRoles] Non-JSON response:', text.substring(0, 200));
    throw new Error('Server returned non-JSON response');
  }
  return response.json();
}

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean | null;
  created_at: string | null;
  last_login_at: string | null;
  role: {
    id: string;
    name: string;
    level: number;
  } | null;
}

// Fetch all users with their roles (BACKEND API VERSION)
export function useUsers() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      console.log('[useUsers] Fetching users from backend API...');

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // ✅ Call backend API instead of direct Supabase query
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to fetch users' }));
        console.error('[useUsers] Backend API error:', error);
        throw new Error(error.error || 'Failed to fetch users');
      }

      const result = await safeJsonParse(response);
      const users = result.data as UserWithRole[];

      console.log('[useUsers] Fetched', users.length, 'users from backend API');
      return users;
    },
  });
}

// Fetch all available roles (BACKEND API VERSION)
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      console.log('[useRoles] Fetching roles from backend API...');

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // ✅ Call backend API instead of direct Supabase query
      const response = await fetch('/api/admin/users?roles=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to fetch roles' }));
        console.error('[useRoles] Backend API error:', error);
        throw new Error(error.error || 'Failed to fetch roles');
      }

      const result = await safeJsonParse(response);
      const roles = result.data;

      console.log('[useRoles] Fetched', roles.length, 'roles from backend API');
      return roles;
    },
  });
}

// Assign role to user (BACKEND API VERSION)
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      roleId,
    }: {
      userId: string;
      roleId: string;
      assignedBy?: string; // Not needed anymore - backend handles it
    }) => {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Call backend API with server-side validation
      const response = await fetch('/api/admin/users?action=assign-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roleId }),
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to assign role' }));
        throw new Error(error.error || 'Failed to assign role');
      }

      return safeJsonParse(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['verify-role'] });
      toast.success(data.message || 'Role assigned successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign role');
    },
  });
}

// Toggle user active status (BACKEND API VERSION)
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Call backend API with server-side validation
      const response = await fetch('/api/admin/users?action=toggle-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isActive }),
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to update user status' }));
        throw new Error(error.error || 'Failed to update user status');
      }

      return safeJsonParse(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success(data.message || 'User status updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });
}

/**
 * ✅ REMOVED: getUserRoleLevel() has been deleted
 *
 * This function was making direct database queries and bypassing backend validation.
 * ALL role checks must go through backend API for security.
 *
 * Migration guide:
 * ```
 * // ❌ OLD (REMOVED - bypassed backend)
 * const level = await getUserRoleLevel(user.id);
 * const isAdmin = level >= 80;
 *
 * // ✅ NEW (uses backend API)
 * import { useIsAdmin } from '@/hooks/useIsAdmin';
 * const { isAdmin, isSuperAdmin } = useIsAdmin();
 * ```
 *
 * Why removed:
 * - Direct database queries bypass backend authorization
 * - No audit logging for role checks
 * - Security risk - frontend can manipulate queries
 * - Not single source of truth
 */
