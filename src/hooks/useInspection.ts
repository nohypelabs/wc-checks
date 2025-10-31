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
      
      const { data, error } = await supabase
        .from('inspection_records')
        .select('*')
        .eq('id', inspectionId)
        .single();

      if (error) {
        logger.error('Failed to fetch inspection', error);
        throw new Error(`Failed to fetch inspection: ${error.message}`);
      }
      
      return data as InspectionComponent;
    },
    enabled: !!inspectionId,
  });

  const getDefaultTemplate = useQuery({
    queryKey: ['default-template'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.warn('Using fallback template', error);
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
      return data;
    },
    retry: 1,
  });

  const getLocation = (locationId: string) => useQuery({
    queryKey: ['location', locationId],
    queryFn: async () => {
      if (!locationId) throw new Error('Location ID is required');

      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          floor,
          area,
          code,
          building_id,
          organization_id,
          qr_code,
          is_active,
          buildings!building_id (
            name
          )
        `)
        .eq('id', locationId)
        .single();

      if (error) {
        logger.error('Failed to fetch location', error);
        throw new Error(`Failed to fetch location: ${error.message}`);
      }

      // Transform data to flatten building name
      const transformed: LocationWithDetails = {
        id: data.id,
        name: data.name,
        floor: data.floor,
        area: data.area,
        code: data.code,
        building_id: data.building_id,
        organization_id: data.organization_id,
        qr_code: data.qr_code,
        is_active: data.is_active,
        building: (data as any).buildings?.name || null,
      };

      return transformed;
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

      // Get template ID with timeout protection
      let templateId = 'comprehensive-template';
      try {
        console.log('🔍 Fetching template...');
        const templatePromise = getDefaultTemplate.refetch();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Template fetch timeout')), 5000)
        );

        const templateData = await Promise.race([templatePromise, timeoutPromise]) as any;
        if (templateData?.data?.id) {
          templateId = templateData.data.id;
          console.log('✅ Template fetched:', templateId);
        } else {
          console.log('⚠️ Using fallback template ID');
        }
      } catch (error) {
        console.warn('⚠️ Template fetch failed, using fallback:', error);
        logger.warn('Using fallback template ID');
      }

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

      console.log('💾 [DB] Executing INSERT query...');
      const dbStartTime = Date.now();

      try {
        // Add timeout protection for database insert (60s for slow mobile connections)
        const dbInsertPromise = supabase
          .from('inspection_records')
          .insert(inspectionRecord)
          .select('id, location_id, overall_status, submitted_at')
          .single();

        const dbTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => {
            console.error('❌ [DB] INSERT timeout after 60s');
            reject(new Error('Database save timed out after 60 seconds. Your internet connection is very slow. Please check your connection and try again.'));
          }, 60000)
        );

        const { data, error } = await Promise.race([dbInsertPromise, dbTimeoutPromise]) as any;

        const dbDuration = ((Date.now() - dbStartTime) / 1000).toFixed(2);
        console.log(`💾 [DB] INSERT completed in ${dbDuration}s`);

        if (error) {
          console.error('❌ [DB] INSERT failed:', error);
          console.error('❌ [DB] Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          endTimer();
          logger.error('Failed to submit inspection', error);

          // Provide user-friendly error message
          let userMessage = 'Failed to save inspection to database.';
          if (error.message.includes('timeout')) {
            userMessage = 'Database save timed out. Please check your internet connection and try again.';
          } else if (error.message.includes('network')) {
            userMessage = 'Network error. Please check your internet connection and try again.';
          } else if (error.code === '23505') {
            userMessage = 'Duplicate entry detected. This inspection may have already been submitted.';
          } else if (error.code === '23503') {
            userMessage = 'Invalid reference data. Please contact administrator.';
          }

          throw new Error(userMessage);
        }

        console.log('✅ [DB] INSERT successful! Record ID:', data.id);
        endTimer();
        logger.info('Inspection submitted successfully', { id: data.id });

        return data;
      } catch (dbError: any) {
        console.error('❌ [DB] Unexpected error during INSERT:', dbError);
        endTimer();

        // Re-throw with better message
        if (dbError.message) {
          throw dbError; // Already has user-friendly message
        } else {
          throw new Error('Unexpected error during database save. Please try again.');
        }
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