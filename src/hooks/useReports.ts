// src/hooks/useReports.ts - FIXED VERSION using API endpoints with admin support
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export interface InspectionReport {
  id: string;
  inspection_date: string;
  inspection_time: string;
  overall_status: string;
  responses: any;
  location: {
    id: string;
    name: string;
    building: string | null;
    floor: string | null;
    organization_id: string;
    building_id: string | null;
    organization?: {
      id: string;
      name: string;
      short_code: string;
    } | null;
    building_ref?: {
      id: string;
      name: string;
      short_code: string;
      type: string;
    } | null;
  };
  user: {
    id: string;
    full_name: string;
    email: string;
    occupation_id?: string;
  };
  occupation?: {
    id: string;
    display_name: string;
    description?: string;
    color?: string;
    icon?: string;
  } | null;
  photo_urls: string[];
  notes: string | null;
}

export interface DateInspections {
  date: string;
  inspections: InspectionReport[];
  averageScore: number;
  count: number;
}

/**
 * Get inspections for a specific month
 *
 * @param userId - Optional. If provided, filters to specific user. If not provided:
 *   - Admin (level >= 80): fetches ALL users' inspections
 *   - Regular user: fetches their own inspections
 * @param currentDate - The month to fetch data for
 * @param enabled - Whether to enable the query (default true)
 * @param buildingId - Optional. Filter by building
 */
export const useMonthlyInspections = (
  userId: string | undefined,
  currentDate: Date,
  enabled: boolean = true,
  buildingId?: string,
  organizationId?: string
) => {
  return useQuery({
    queryKey: ['monthly-inspections', userId || 'all', format(currentDate, 'yyyy-MM'), buildingId, organizationId],
    queryFn: async () => {
      const month = format(currentDate, 'yyyy-MM');

      console.log('📅 Fetching monthly inspections:', {
        userId: userId || 'ALL',
        month,
        buildingId: buildingId || 'ALL',
        organizationId: organizationId || 'ALL'
      });

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      // Build API URL
      let apiUrl = `/api/reports?month=${month}`;
      if (userId) {
        apiUrl += `&userId=${userId}`;
      }
      if (buildingId) {
        apiUrl += `&buildingId=${buildingId}`;
      }
      if (organizationId) {
        apiUrl += `&organizationId=${organizationId}`;
      }
      // If no userId provided, admin will see ALL, regular users will see their own (backend handles this)

      // Call API endpoint
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('❌ Error fetching monthly inspections:', errorData);
        throw new Error(errorData.error || 'Failed to fetch monthly inspections');
      }

      const result = await response.json();
      const dateInspections: DateInspections[] = result.data;

      console.log('✅ Fetched monthly inspections:', dateInspections.length, 'dates');

      return dateInspections;
    },
    // ✅ FIX: Wait for admin check to complete before fetching
    enabled: enabled,
  });
};

/**
 * Get inspections for a specific date
 *
 * @param userId - Optional. If provided, filters to specific user. If not provided:
 *   - Admin (level >= 80): fetches ALL users' inspections
 *   - Regular user: fetches their own inspections
 * @param date - The specific date to fetch data for
 * @param enabled - Whether to enable the query (default true)
 * @param buildingId - Optional. Filter by building
 * @param page - Page number (default 1)
 * @param limit - Items per page (default 10)
 */
export const useDateInspections = (
  userId: string | undefined,
  date: string,
  enabled: boolean = true,
  buildingId?: string,
  organizationId?: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ['date-inspections', userId || 'all', date, buildingId, organizationId, page, limit],
    queryFn: async () => {
      if (!date) {
        console.warn('⚠️ Missing date');
        return { inspections: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      }

      console.log('📅 Fetching inspections for date:', {
        userId: userId || 'ALL',
        date,
        buildingId: buildingId || 'ALL',
        organizationId: organizationId || 'ALL'
      });

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      // Build API URL
      let apiUrl = `/api/reports?date=${date}&page=${page}&limit=${limit}`;
      if (userId) {
        apiUrl += `&userId=${userId}`;
      }
      if (buildingId) {
        apiUrl += `&buildingId=${buildingId}`;
      }
      if (organizationId) {
        apiUrl += `&organizationId=${organizationId}`;
      }
      // If no userId provided, admin will see ALL, regular users will see their own (backend handles this)

      // Call API endpoint
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('❌ Error fetching date inspections:', errorData);
        throw new Error(errorData.error || 'Failed to fetch date inspections');
      }

      const result = await response.json();
      const inspections: InspectionReport[] = result.data.inspections || [];
      const pagination = result.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

      console.log('✅ Fetched date inspections:', inspections.length, 'page:', pagination.page, 'total:', pagination.total);

      return { inspections, pagination };
    },
    // ✅ FIX: Wait for admin check to complete AND date to be selected
    enabled: enabled && !!date,
  });
};
