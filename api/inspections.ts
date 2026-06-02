// api/inspections.ts - Inspections CRUD (ALL USERS)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, supabase, successResponse, errorResponse } from './middleware/role-guard.js';

/**
 * GET /api/inspections - List user's own inspections
 * GET /api/inspections?id=xxx - Get specific inspection (own only)
 * POST /api/inspections - Create new inspection
 * PATCH /api/inspections?id=xxx - Update inspection (own only)
 * DELETE /api/inspections?id=xxx - Delete inspection (own only)
 *
 * Requirements: Authenticated user (level 0+)
 * Users can only access their own inspections
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await validateAuth(req, 0); // Any authenticated user

  if (!auth || !supabase) {
    return errorResponse(res, 401, 'Authentication required');
  }

  const { id } = req.query;
  const inspectionId = Array.isArray(id) ? id[0] : id;
  const userId = auth.userId;

  try {
    // GET - List user's inspections or get specific
    if (req.method === 'GET') {
      if (inspectionId) {
        const { data: inspection, error } = await supabase
          .from('inspection_records')
          .select('*, locations!inner(id, name, floor, buildings(name)), users!inspection_records_user_id_fkey(full_name)')
          .eq('id', inspectionId)
          .eq('user_id', userId) // Users can only see their own
          .single();

        if (error) throw error;
        if (!inspection) {
          return errorResponse(res, 404, 'Inspection not found');
        }

        return successResponse(res, inspection, 'Inspection retrieved');
      }

      // List all inspections for current user
      const { data: inspections, error } = await supabase
        .from('inspection_records')
        .select('*, locations!inner(id, name, floor, buildings(name))')
        .eq('user_id', userId)
        .order('inspection_date', { ascending: false });

      if (error) throw error;

      return successResponse(res, inspections || [], 'Inspections retrieved');
    }

    // POST - Create inspection
    if (req.method === 'POST') {
      const {
        location_id,
        template_id,
        inspection_date,
        inspection_time,
        overall_status,
        responses,
        photo_urls,
        notes,
        submitted_at,
        duration_seconds,
        verification_notes,
        verified_at,
        verified_by,
      } = req.body;

      if (!location_id || !inspection_date || !responses) {
        return errorResponse(res, 400, 'Missing required fields: location_id, inspection_date, responses');
      }

      const now = new Date();
      const inspectionData = {
        user_id: userId,
        location_id,
        template_id: template_id || null,
        inspection_date: inspection_date || now.toISOString().split('T')[0],
        inspection_time: inspection_time || now.toTimeString().split(' ')[0],
        overall_status: overall_status || 'satisfactory',
        responses,
        photo_urls: photo_urls || null,
        notes: notes?.trim() || null,
        submitted_at: submitted_at || now.toISOString(),
        duration_seconds: duration_seconds || null,
        verification_notes: verification_notes || null,
        verified_at: verified_at || null,
        verified_by: verified_by || null,
      };

      console.log('[inspections] Creating inspection:', {
        user_id: userId,
        location_id,
        photo_count: photo_urls?.length || 0,
      });

      const { data: newInspection, error } = await supabase
        .from('inspection_records')
        .insert([inspectionData])
        .select('id, location_id, overall_status, submitted_at')
        .single();

      if (error) {
        console.error('[inspections] Insert error:', error);
        throw error;
      }

      console.log('[inspections] Inspection created successfully:', newInspection.id);

      return successResponse(res, newInspection, 'Inspection created');
    }

    // PATCH - Update inspection (own only)
    if (req.method === 'PATCH') {
      if (!inspectionId) {
        return errorResponse(res, 400, 'Inspection ID required');
      }

      // Verify ownership
      const { data: existing } = await supabase
        .from('inspection_records')
        .select('user_id')
        .eq('id', inspectionId)
        .single();

      if (!existing || existing.user_id !== userId) {
        return errorResponse(res, 403, 'Access denied - not your inspection');
      }

      const updates: any = {};
      const allowedFields = ['responses', 'photo_urls', 'notes', 'overall_status'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      updates.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('inspection_records')
        .update(updates)
        .eq('id', inspectionId)
        .eq('user_id', userId) // Double check ownership
        .select()
        .single();

      if (error) throw error;

      return successResponse(res, updated, 'Inspection updated');
    }

    // DELETE - Delete inspection (own only)
    if (req.method === 'DELETE') {
      if (!inspectionId) {
        return errorResponse(res, 400, 'Inspection ID required');
      }

      const { data: deleted, error } = await supabase
        .from('inspection_records')
        .delete()
        .eq('id', inspectionId)
        .eq('user_id', userId) // Users can only delete their own
        .select()
        .single();

      if (error) throw error;

      return successResponse(res, deleted, 'Inspection deleted');
    }

    return errorResponse(res, 405, 'Method not allowed');
  } catch (error: any) {
    console.error('[inspections] Error:', error);
    return errorResponse(res, 500, 'Operation failed: ' + error.message);
  }
}
