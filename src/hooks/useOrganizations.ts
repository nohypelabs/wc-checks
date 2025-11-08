// src/hooks/useOrganizations.ts - Organizations CRUD via Backend API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('[useOrganizations] Non-JSON response:', text.substring(0, 200));
    throw new Error('Server returned non-JSON response');
  }
  return response.json();
}

export interface Organization {
  id: string;
  name: string;
  short_code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch all organizations
export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/admin/resources?type=organizations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to fetch organizations' }));
        throw new Error(error.error || 'Failed to fetch organizations');
      }

      const result = await safeJsonParse(response);
      return result.data as Organization[];
    },
  });
}

// Create organization
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Organization>) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/admin/resources?type=organizations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to create organization' }));
        throw new Error(error.error || 'Failed to create organization');
      }

      return safeJsonParse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create organization');
    },
  });
}

// Update organization
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Organization> }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('No authentication token');

      const response = await fetch(`/api/admin/resources?type=organizations&id=${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to update organization' }));
        throw new Error(error.error || 'Failed to update organization');
      }

      return safeJsonParse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update organization');
    },
  });
}

// Delete organization
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ [useDeleteOrganization] Starting delete for organization:', id);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('❌ [useDeleteOrganization] No authentication token');
        throw new Error('No authentication token');
      }

      console.log('📡 [useDeleteOrganization] Sending DELETE request to:', `/api/admin/resources?type=organizations&id=${id}`);

      const response = await fetch(`/api/admin/resources?type=organizations&id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log('📨 [useDeleteOrganization] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await safeJsonParse(response).catch((e) => {
          console.error('❌ [useDeleteOrganization] Failed to parse error response:', e);
          return { error: 'Failed to delete organization' };
        });
        console.error('❌ [useDeleteOrganization] Delete failed:', errorData);
        throw new Error(errorData.error || 'Failed to delete organization');
      }

      const result = await safeJsonParse(response);
      console.log('✅ [useDeleteOrganization] Delete successful:', result);
      return result;
    },
    onSuccess: () => {
      console.log('✅ [useDeleteOrganization] onSuccess callback triggered');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organisasi berhasil dihapus!');
    },
    onError: (error: any) => {
      console.error('❌ [useDeleteOrganization] onError callback triggered:', error);
      toast.error(error.message || 'Gagal menghapus organisasi');
    },
  });
}
