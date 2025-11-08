// src/hooks/useBuildings.ts - Buildings CRUD via backend API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Tables } from '../types/database.types';

type Building = Tables<'buildings'>;

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('[useBuildings] Non-JSON response:', text.substring(0, 200));
    throw new Error('Server returned non-JSON response');
  }
  return response.json();
}

interface UseBuildingsOptions {
  organizationId?: string;
  enabled?: boolean;
  includeInactive?: boolean;
}

/**
 * Fetch buildings with optional organization filter via BACKEND API
 */
export function useBuildings({
  organizationId,
  enabled = true,
  includeInactive = false,
}: UseBuildingsOptions = {}) {
  return useQuery({
    queryKey: ['buildings', organizationId, includeInactive],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const url = organizationId
        ? `/api/admin/buildings?organization_id=${organizationId}`
        : '/api/admin/resources?type=buildings';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to fetch buildings' }));
        throw new Error(error.error || 'Failed to fetch buildings');
      }

      const result = await safeJsonParse(response);
      let buildings = result.data as Building[];

      // Client-side filter for inactive if needed
      if (!includeInactive) {
        buildings = buildings.filter((b) => b.is_active);
      }

      return buildings;
    },
    enabled: enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch single building by ID via BACKEND API
 */
export function useBuilding(buildingId?: string) {
  return useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      if (!buildingId) return null;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/resources?type=buildings&id=${buildingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to fetch building' }));
        throw new Error(error.error || 'Failed to fetch building');
      }

      const result = await safeJsonParse(response);
      return result.data as Building & {
        organizations?: {
          name: string;
        };
      };
    },
    enabled: !!buildingId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch building by short code via BACKEND API
 * NOTE: Backend doesn't support filtering by short_code yet,
 * so we fetch all and filter client-side
 */
export function useBuildingByCode(shortCode?: string, organizationId?: string) {
  return useQuery({
    queryKey: ['building-by-code', shortCode, organizationId],
    queryFn: async () => {
      if (!shortCode) return null;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const url = organizationId
        ? `/api/admin/buildings?organization_id=${organizationId}`
        : '/api/admin/resources?type=buildings';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to fetch buildings' }));
        throw new Error(error.error || 'Failed to fetch buildings');
      }

      const result = await safeJsonParse(response);
      const buildings = result.data as Building[];

      // Client-side filter by short_code
      const building = buildings.find((b) => b.short_code === shortCode);
      return building || null;
    },
    enabled: !!shortCode,
  });
}

/**
 * Create new building via BACKEND API
 */
export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buildingData: {
      name: string;
      short_code: string;
      organization_id: string;
      type?: string;
      address?: string;
      total_floors?: number;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/resources?type=buildings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildingData),
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to create building' }));
        throw new Error(error.error || 'Failed to create building');
      }

      const result = await safeJsonParse(response);
      return result.data as Building;
    },
    onSuccess: (data) => {
      // Invalidate buildings cache for this organization
      queryClient.invalidateQueries({
        queryKey: ['buildings', data.organization_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['buildings'],
      });
      toast.success('Building created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create building');
    },
  });
}

/**
 * Update building via BACKEND API
 */
export function useUpdateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      buildingId,
      updates,
    }: {
      buildingId: string;
      updates: Partial<Building>;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/resources?type=buildings&id=${buildingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to update building' }));
        throw new Error(error.error || 'Failed to update building');
      }

      const result = await safeJsonParse(response);
      return result.data as Building;
    },
    onSuccess: (data) => {
      // Invalidate related caches
      queryClient.invalidateQueries({
        queryKey: ['buildings', data.organization_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['building', data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['buildings'],
      });
      toast.success('Building updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update building');
    },
  });
}

/**
 * Soft delete building via BACKEND API
 */
export function useDeleteBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buildingId: string) => {
      console.log('🗑️ [useDeleteBuilding] Starting delete for building:', buildingId);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('❌ [useDeleteBuilding] No authentication token');
        throw new Error('No authentication token');
      }

      console.log('📡 [useDeleteBuilding] Sending DELETE request to:', `/api/admin/resources?type=buildings&id=${buildingId}`);

      const response = await fetch(`/api/admin/resources?type=buildings&id=${buildingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📨 [useDeleteBuilding] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await safeJsonParse(response).catch((e) => {
          console.error('❌ [useDeleteBuilding] Failed to parse error response:', e);
          return { error: 'Failed to delete building' };
        });
        console.error('❌ [useDeleteBuilding] Delete failed:', errorData);
        throw new Error(errorData.error || 'Failed to delete building');
      }

      const result = await safeJsonParse(response);
      console.log('✅ [useDeleteBuilding] Delete successful:', result);
      return result;
    },
    onSuccess: () => {
      console.log('✅ [useDeleteBuilding] onSuccess callback triggered');
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast.success('Gedung berhasil dihapus!');
    },
    onError: (error: Error) => {
      console.error('❌ [useDeleteBuilding] onError callback triggered:', error);
      toast.error(error.message || 'Gagal menghapus gedung');
    },
  });
}

/**
 * Count locations per building
 * NOTE: Still uses direct query as we don't have a stats endpoint for buildings yet
 */
export function useBuildingStats(buildingId?: string) {
  return useQuery({
    queryKey: ['building-stats', buildingId],
    queryFn: async () => {
      if (!buildingId) return null;

      const { count, error } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('building_id', buildingId)
        .eq('is_active', true);

      if (error) throw error;

      return {
        totalLocations: count || 0,
      };
    },
    enabled: !!buildingId,
  });
}