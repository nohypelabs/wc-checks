// src/hooks/useLocations.ts - Locations CRUD via backend API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Tables } from '../types/database.types';

type Location = Tables<'locations'>;

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('[useLocations] Non-JSON response:', text.substring(0, 200));
    throw new Error('Server returned non-JSON response');
  }
  return response.json();
}

interface UseLocationsOptions {
  buildingId?: string;
  organizationId?: string;
  enabled?: boolean;
  includeInactive?: boolean;
}

/**
 * Fetch locations with optional filters via BACKEND API
 */
export function useLocations({
  buildingId,
  organizationId,
  enabled = true,
  includeInactive = false,
}: UseLocationsOptions = {}) {
  return useQuery({
    queryKey: ['locations', buildingId, organizationId, includeInactive],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      // Build query params
      const params = new URLSearchParams();
      if (buildingId) params.append('building_id', buildingId);
      if (organizationId) params.append('organization_id', organizationId);

      const url = `/api/admin/resources?type=locations${params.toString() ? '&' + params.toString() : ''}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to fetch locations' }));
        throw new Error(error.error || 'Failed to fetch locations');
      }

      const result = await safeJsonParse(response);
      let locations = result.data as Location[];

      // Client-side filter for inactive if needed
      if (!includeInactive) {
        locations = locations.filter((l) => l.is_active);
      }

      return locations;
    },
    enabled: enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch single location by ID via BACKEND API
 */
export function useLocation(locationId?: string) {
  return useQuery({
    queryKey: ['location', locationId],
    queryFn: async () => {
      if (!locationId) return null;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/resources?type=locations&id=${locationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to fetch location' }));
        throw new Error(error.error || 'Failed to fetch location');
      }

      const result = await safeJsonParse(response);
      return result.data as Location & {
        buildings?: {
          name: string;
          organization_id: string;
        };
      };
    },
    enabled: !!locationId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch location by short code via BACKEND API
 * NOTE: Backend doesn't support filtering by short_code yet,
 * so we fetch all and filter client-side
 */
export function useLocationByCode(
  shortCode?: string,
  buildingId?: string,
  organizationId?: string
) {
  return useQuery({
    queryKey: ['location-by-code', shortCode, buildingId, organizationId],
    queryFn: async () => {
      if (!shortCode) return null;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      // Build query params
      const params = new URLSearchParams();
      if (buildingId) params.append('building_id', buildingId);
      if (organizationId) params.append('organization_id', organizationId);

      const url = `/api/admin/resources?type=locations${params.toString() ? '&' + params.toString() : ''}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to fetch locations' }));
        throw new Error(error.error || 'Failed to fetch locations');
      }

      const result = await safeJsonParse(response);
      const locations = result.data as Location[];

      // Client-side filter by short_code
      const location = locations.find((l) => l.short_code === shortCode);
      return location || null;
    },
    enabled: !!shortCode,
  });
}

/**
 * Create new location via BACKEND API
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationData: {
      name: string;
      short_code: string;
      organization_id: string;
      building_id?: string | null;
      floor?: string | null;
      code?: string | null;
      type?: string | null;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/admin/resources?type=locations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to create location' }));
        throw new Error(error.error || 'Failed to create location');
      }

      const result = await safeJsonParse(response);
      return result.data as Location;
    },
    onSuccess: (data) => {
      // Invalidate all location caches
      queryClient.invalidateQueries({
        queryKey: ['locations'],
      });
      if (data.building_id) {
        queryClient.invalidateQueries({
          queryKey: ['locations', data.building_id],
        });
      }
      if (data.organization_id) {
        queryClient.invalidateQueries({
          queryKey: ['locations', undefined, data.organization_id],
        });
      }
      toast.success('Location created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create location');
    },
  });
}

/**
 * Update location via BACKEND API
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      locationId,
      updates,
    }: {
      locationId: string;
      updates: Partial<Location>;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/resources?type=locations&id=${locationId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to update location' }));
        throw new Error(error.error || 'Failed to update location');
      }

      const result = await safeJsonParse(response);
      return result.data as Location;
    },
    onSuccess: (data) => {
      // Invalidate related caches
      queryClient.invalidateQueries({
        queryKey: ['locations'],
      });
      queryClient.invalidateQueries({
        queryKey: ['location', data.id],
      });
      toast.success('Location updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update location');
    },
  });
}

/**
 * Soft delete location via BACKEND API
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/resources?type=locations&id=${locationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await safeJsonParse(response).catch(() => ({ error: 'Failed to delete location' }));
        throw new Error(error.error || 'Failed to delete location');
      }

      return safeJsonParse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete location');
    },
  });
}
