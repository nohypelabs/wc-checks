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
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          is_active,
          created_at,
          last_login_at,
          user_roles (
            role_id,
            roles (
              id,
              name,
              level
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to flatten role
      return data.map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        role: user.user_roles && user.user_roles.length > 0
          ? user.user_roles[0].roles
          : null,
      })) as UserWithRole[];
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
    .select('roles (level)')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return 0;
  return (data.roles as any)?.level || 0;
}
