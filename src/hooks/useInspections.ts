// src/hooks/useInspections.ts - User-level Inspections CRUD via backend API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Tables } from '../types/database.types';

type InspectionRecord = Tables<'inspection_records'>;

/**
 * Fetch current user's inspections via BACKEND API
 * Users can only see their own inspections
 */
export function useInspections() {
  return useQuery({
    queryKey: ['inspections', 'my-inspections'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/inspections', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch inspections');
      }

      const result = await response.json();
      return result.data as InspectionRecord[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch all inspections via ADMIN API
 * Only admins can access this endpoint - returns all users' inspections
 */
export function useAdminInspections(limit: number = 100) {
  return useQuery({
    queryKey: ['admin-inspections', limit],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/admin/inspections?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch admin inspections');
      }

      const result = await response.json();
      return result.data.inspections as InspectionRecord[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch single inspection by ID via BACKEND API
 * User can only access their own inspections
 */
export function useInspection(inspectionId?: string) {
  return useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      if (!inspectionId) return null;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/inspections?id=${inspectionId}`, {
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
        };
        users?: {
          full_name: string;
        };
      };
    },
    enabled: !!inspectionId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create new inspection via BACKEND API
 */
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inspectionData: {
      location_id: string;
      inspection_date: string;
      responses: any; // JSONB field
      photos?: string[];
      notes?: string | null;
      status?: string;
      template_id?: string | null;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspectionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create inspection');
      }

      const result = await response.json();
      return result.data as InspectionRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['inspections'],
      });
      toast.success('Inspection created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create inspection');
    },
  });
}

/**
 * Update own inspection via BACKEND API
 * User can only update their own inspections
 */
export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inspectionId,
      updates,
    }: {
      inspectionId: string;
      updates: Partial<InspectionRecord>;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/inspections?id=${inspectionId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update inspection');
      }

      const result = await response.json();
      return result.data as InspectionRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['inspections'],
      });
      queryClient.invalidateQueries({
        queryKey: ['inspection', data.id],
      });
      toast.success('Inspection updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update inspection');
    },
  });
}

/**
 * Delete own inspection via BACKEND API
 * User can only delete their own inspections
 */
export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inspectionId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/inspections?id=${inspectionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete inspection');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspection deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete inspection');
    },
  });
}
