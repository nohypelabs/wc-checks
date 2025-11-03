// src/hooks/useAdminInspections.ts - Admin-level Inspections view via backend API
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database.types';

type InspectionRecord = Tables<'inspection_records'>;

interface UseAdminInspectionsOptions {
  userId?: string;
  locationId?: string;
  date?: string; // yyyy-mm-dd format
  limit?: number;
  enabled?: boolean;
}

interface AdminInspectionsResponse {
  inspections: (InspectionRecord & {
    locations?: {
      name: string;
      floor: string | null;
    };
    users?: {
      full_name: string;
      email: string;
    };
  })[];
  count: number;
  filters: {
    user_id?: string;
    location_id?: string;
    date?: string;
    limit: string;
  };
}

/**
 * Fetch all inspections (admin view) via BACKEND API
 * Admins can view all inspections across all users
 * This is READ-ONLY - admins must use /api/inspections for modifications
 */
export function useAdminInspections({
  userId,
  locationId,
  date,
  limit = 100,
  enabled = true,
}: UseAdminInspectionsOptions = {}) {
  return useQuery({
    queryKey: ['admin-inspections', userId, locationId, date, limit],
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
      if (userId) params.append('user_id', userId);
      if (locationId) params.append('location_id', locationId);
      if (date) params.append('date', date);
      params.append('limit', limit.toString());

      const url = `/api/admin/inspections${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch admin inspections');
      }

      const result = await response.json();
      return result.data as AdminInspectionsResponse;
    },
    enabled: enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch single inspection (admin view) via BACKEND API
 */
export function useAdminInspection(inspectionId?: string) {
  return useQuery({
    queryKey: ['admin-inspection', inspectionId],
    queryFn: async () => {
      if (!inspectionId) return null;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/inspections?id=${inspectionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch inspection');
      }

      const result = await response.json();
      return result.data as InspectionRecord & {
        locations?: {
          name: string;
          floor: string | null;
          buildings?: {
            name: string;
          };
        };
        users?: {
          full_name: string;
          email: string;
        };
      };
    },
    enabled: !!inspectionId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch inspections for a specific user (admin view)
 */
export function useUserInspections(userId?: string, limit = 50) {
  return useAdminInspections({
    userId,
    limit,
    enabled: !!userId,
  });
}

/**
 * Fetch inspections for a specific location (admin view)
 */
export function useLocationInspections(locationId?: string, limit = 50) {
  return useAdminInspections({
    locationId,
    limit,
    enabled: !!locationId,
  });
}

/**
 * Fetch inspections for a specific date (admin view)
 */
export function useDateInspections(date?: string, limit = 100) {
  return useAdminInspections({
    date,
    limit,
    enabled: !!date,
  });
}
