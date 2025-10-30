// src/hooks/useUserRoles.ts - Manage users and their roles (SUPERADMIN ONLY)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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

// Fetch all users with their roles
export function useUsers() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      console.log('[useUsers] Fetching users...');

      // Fetch all users first
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, phone, is_active, created_at, last_login_at')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('[useUsers] Error fetching users:', usersError);
        throw usersError;
      }

      console.log('[useUsers] Fetched', users?.length, 'users');

      // Fetch all user_roles with roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          roles!user_roles_role_id_fkey (
            id,
            name,
            level
          )
        `);

      if (rolesError) {
        console.error('[useUsers] Error fetching user roles:', rolesError);
        throw rolesError;
      }

      console.log('[useUsers] Fetched', userRoles?.length, 'user roles');

      // Combine the data
      const combined = users.map((user: any) => {
        const userRole = userRoles?.find((ur: any) => ur.user_id === user.id);
        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          is_active: user.is_active,
          created_at: user.created_at,
          last_login_at: user.last_login_at,
          role: userRole?.roles || null,
        };
      }) as UserWithRole[];

      console.log('[useUsers] Combined data ready:', combined.length, 'users with roles');
      return combined;
    },
  });
}

// Fetch all available roles
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// Assign role to user
export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      roleId,
      assignedBy
    }: {
      userId: string;
      roleId: string;
      assignedBy: string;
    }) => {
      // First, check if user already has a role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({
            role_id: roleId,
            assigned_by: assignedBy,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: roleId,
            assigned_by: assignedBy,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role assigned successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to assign role: ' + error.message);
    },
  });
}

// Toggle user active status
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success(
        variables.isActive
          ? 'User activated successfully!'
          : 'User deactivated successfully!'
      );
    },
    onError: (error: any) => {
      toast.error('Failed to update user status: ' + error.message);
    },
  });
}

// Get current user's role level
export async function getUserRoleLevel(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('roles!user_roles_role_id_fkey (level)')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    console.error('❌ getUserRoleLevel error:', error);
    return 0;
  }

  const level = (data.roles as any)?.level || 0;
  console.log('✅ getUserRoleLevel success:', { userId, level });
  return level;
}
