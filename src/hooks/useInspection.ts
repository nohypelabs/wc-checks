// src/hooks/useInspection.ts - OPTIMIZED: No double upload
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { TablesInsert } from '../../src/types/database.types';
import type { InspectionComponent } from '../types/inspection.types';

interface SubmitInspectionData {
  location_id: string;
  user_id: string;
  responses: Record<string, any>;
  photo_urls: string[]; // ✅ Changed from File[] to string[]
  notes?: string;
  duration_seconds?: number;
}

interface LocationWithDetails {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
  area: string | null;
  code: string | null;
  building_id: string;
  organization_id: string;
  qr_code: string;
  is_active: boolean | null;
}

export const useInspection = (inspectionId?: string) => {
  const queryClient = useQueryClient();

  const getInspection = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      if (!inspectionId) return null;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/inspections?id=${inspectionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        logger.error('Failed to fetch inspection via API', errorData);
        throw new Error(`Failed to fetch inspection: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      return result.data as InspectionComponent;
    },
    enabled: !!inspectionId,
  });

  const getDefaultTemplate = useQuery({
    queryKey: ['default-template'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        logger.warn('No auth token for template fetch, using fallback');
        return {
          id: 'comprehensive-template',
          name: 'Comprehensive Inspection',
          description: 'Default comprehensive inspection template',
          fields: {
            components: [],
            requiredPhotos: 0,
            maxPhotos: 10,
            allowNotes: true
          },
          estimated_time: 300,
          is_active: true,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      try {
        const response = await fetch('/api/templates', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch template');
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        logger.warn('Template fetch failed, using fallback', error);
        return {
          id: 'comprehensive-template',
          name: 'Comprehensive Inspection',
          description: 'Default comprehensive inspection template',
          fields: {
            components: [],
            requiredPhotos: 0,
            maxPhotos: 10,
            allowNotes: true
          },
          estimated_time: 300,
          is_active: true,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    },
    retry: 1,
  });

  const getLocation = (locationId: string) => useQuery({
    queryKey: ['location', locationId],
    queryFn: async () => {
      if (!locationId) throw new Error('Location ID is required');

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/locations?id=${locationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        logger.error('Failed to fetch location via API', errorData);
        throw new Error(`Failed to fetch location: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      return result.data as LocationWithDetails;
    },
    enabled: !!locationId,
  });

  const submitInspection = useMutation({
    mutationFn: async (inspectionData: SubmitInspectionData) => {
      const endTimer = logger.startTimer('Submit inspection');

      const {
        location_id,
        user_id,
        responses,
        photo_urls,
        notes,
        duration_seconds,
      } = inspectionData;

      if (!location_id || !user_id) {
        throw new Error('Location ID and User ID are required');
      }

      // ✅ Photos already uploaded by form, just use the URLs
      logger.info('Submitting inspection with photos', {
        photo_count: photo_urls.length
      });

      // Validate photo URLs
      if (photo_urls.length > 0) {
        const invalidUrls = photo_urls.filter(url => !url || typeof url !== 'string' || !url.startsWith('http'));
        if (invalidUrls.length > 0) {
          console.error('❌ Invalid photo URLs detected:', invalidUrls);
          throw new Error(`Invalid photo URLs: ${invalidUrls.length} URLs are not valid`);
        }
        console.log('✅ All photo URLs validated');
      }

      // Skip template fetch - use fallback directly
      const templateId = 'comprehensive-template';

      const now = new Date();
      const inspection_date = now.toISOString().split('T')[0];
      const inspection_time = now.toTimeString().split(' ')[0];
      const submitted_at = now.toISOString();

      const score = responses.score || 0;
      let overall_status = 'satisfactory';
      
      if (score >= 90) overall_status = 'excellent';
      else if (score >= 75) overall_status = 'good';
      else if (score >= 60) overall_status = 'fair';
      else if (score >= 40) overall_status = 'poor';
      else overall_status = 'very_poor';

      const inspectionRecord: TablesInsert<'inspection_records'> = {
        location_id,
        user_id,
        template_id: templateId,
        inspection_date,
        inspection_time,
        overall_status,
        responses,
        photo_urls: photo_urls.length > 0 ? photo_urls : null,
        notes: notes?.trim() || null,
        submitted_at,
        duration_seconds: duration_seconds || null,
        verification_notes: null,
        verified_at: null,
        verified_by: null,
      };

      console.log('💾 [DB] Preparing to insert into database...');

      // Calculate payload size
      const jsonPayload = JSON.stringify(inspectionRecord);
      const payloadSizeKB = (new Blob([jsonPayload]).size / 1024).toFixed(2);
      const payloadSizeMB = (parseFloat(payloadSizeKB) / 1024).toFixed(2);

      console.log('💾 [DB] Record data:', {
        location_id,
        user_id,
        photos: photo_urls.length,
        score,
        status: overall_status,
        payloadSize: `${payloadSizeKB} KB (${payloadSizeMB} MB)`,
        responsesKeys: Object.keys(responses).length
      });

      // Warn if payload is too large (>1MB)
      if (parseFloat(payloadSizeKB) > 1024) {
        console.warn(`⚠️ Large payload detected: ${payloadSizeMB}MB. Database save may be slow.`);
      }

      // Reject if payload is unreasonably large (>5MB)
      if (parseFloat(payloadSizeKB) > 5120) {
        console.error(`❌ Payload too large: ${payloadSizeMB}MB. Maximum 5MB allowed.`);
        throw new Error(`Payload too large: ${payloadSizeMB}MB. Please reduce number of photos or notes length.`);
      }

      logger.info('Saving inspection to database', {
        location_id,
        photos: photo_urls.length,
        score
      });

      console.log('🌐 [API] Sending inspection to backend API...');
      const apiStartTime = Date.now();

      try {
        // Get session with timeout
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]) as any;
        const token = session?.access_token;

        if (!token) {
          throw new Error('No auth token');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('/api/inspections', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inspectionRecord),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(errorData.error || `Failed (${response.status})`);
        }

        const result = await response.json();
        const data = result.data;

        console.log('✅ [API] Inspection submitted successfully! Record ID:', data.id);
        endTimer();
        logger.info('Inspection submitted successfully', { id: data.id });

        return data;
      } catch (apiError: any) {
        endTimer();

        if (apiError.name === 'AbortError') {
          throw new Error('Request timeout. Check your connection and try again.');
        }

        throw apiError.message
          ? apiError
          : new Error('Failed to save. Try again.');
      }

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['location-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // ⚡ Refresh dashboard on submit
    },
    onError: (error: Error) => {
      logger.error('Inspection mutation failed', error);
    },
  });

  const getLocationInspections = (locationId: string) => useQuery({
    queryKey: ['location-inspections', locationId],
    queryFn: async () => {
      if (!locationId) return [];

      const { data, error } = await supabase
        .from('inspection_records')
        .select(`
          *,
          users:user_id (
            full_name,
            email
          )
        `)
        .eq('location_id', locationId)
        .order('submitted_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch location inspections', error);
        throw new Error(`Failed to fetch inspections: ${error.message}`);
      }

      return data;
    },
    enabled: !!locationId,
  });

  return {
    getInspection,
    getDefaultTemplate,
    getLocation,
    submitInspection,
    getLocationInspections,
  };
};