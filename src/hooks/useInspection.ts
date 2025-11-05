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

      // Fetch template to get real UUID from database
      console.log('📋 Fetching template...');
      let templateId: string | null = null;

      try {
        // Get token from localStorage (same as later in the code)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
        const storageKey = `sb-${projectId}-auth-token`;
        const sessionStr = localStorage.getItem(storageKey);

        if (sessionStr) {
          const sessionData = JSON.parse(sessionStr);
          const token = sessionData?.access_token;

          if (token) {
            const templateRes = await fetch('/api/templates', {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (templateRes.ok) {
              const templateData = await templateRes.json();
              templateId = templateData.data?.id || null;
              console.log('✅ Template fetched:', templateId);
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Failed to fetch template:', e);
      }

      // If no template found, throw error
      if (!templateId) {
        throw new Error('No inspection template found. Please contact admin to create a default template.');
      }

      const now = new Date();
      // ✅ FIX: Use local date, not UTC date to avoid timezone issues
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const inspection_date = `${year}-${month}-${day}`;
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

      // SKIP getSession() - it hangs! Get token from localStorage directly
      const apiCall = (async () => {
        console.log('🔐 Getting token from localStorage...');

        // Get Supabase project ID from URL
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const projectId = supabaseUrl.split('//')[1]?.split('.')[0];

        if (!projectId) {
          throw new Error('Invalid Supabase URL');
        }

        // Construct localStorage key
        const storageKey = `sb-${projectId}-auth-token`;
        const sessionStr = localStorage.getItem(storageKey);

        if (!sessionStr) {
          throw new Error('No session in localStorage');
        }

        const sessionData = JSON.parse(sessionStr);
        const token = sessionData?.access_token;

        if (!token) {
          throw new Error('No access token in session');
        }

        console.log('✅ Got token from localStorage');

        console.log('📤 Calling /api/inspections...');
        const response = await fetch('/api/inspections', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inspectionRecord),
        });

        console.log(`📥 Response: ${response.status}`);

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return result.data;
      })();

      const timeout = new Promise((_, reject) =>
        setTimeout(() => {
          console.error('⏰ OVERALL TIMEOUT after 20s');
          reject(new Error('TIMEOUT'));
        }, 20000)
      );

      try {
        const data = await Promise.race([apiCall, timeout]);
        console.log('✅ SUCCESS!');
        endTimer();
        return data;
      } catch (error: any) {
        endTimer();
        console.error('❌ FAILED:', error.message);
        throw new Error(error.message || 'Save failed');
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