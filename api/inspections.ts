// api/inspections.ts - Inspections CRUD (ALL USERS)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, supabase, successResponse, errorResponse } from './middleware/role-guard';

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
    return res.status(401).json(errorResponse('Authentication required'));
  }

  const { id } = req.query;
  const userId = auth.userId;

  try {
    // GET - List user's inspections or get specific
    if (req.method === 'GET') {
      if (id) {
        const { data: inspection, error } = await supabase
          .from('inspection_records')
          .select('*, locations(name, floor), users(full_name)')
          .eq('id', id)
          .eq('user_id', userId) // Users can only see their own
          .single();

        if (error) throw error;
        if (!inspection) {
          return res.status(404).json(errorResponse('Inspection not found'));
        }

        return res.status(200).json(successResponse(inspection, 'Inspection retrieved'));
      }

      // List all inspections for current user
      const { data: inspections, error } = await supabase
        .from('inspection_records')
        .select('*, locations(name, floor)')
        .eq('user_id', userId)
        .order('inspection_date', { ascending: false });

      if (error) throw error;

      return res.status(200).json(successResponse(inspections || [], 'Inspections retrieved'));
    }

    // POST - Create inspection
    if (req.method === 'POST') {
      const {
        location_id,
        inspection_date,
        responses,
        photos,
        notes,
        status,
        template_id,
      } = req.body;

      if (!location_id || !inspection_date || !responses) {
        return res.status(400).json(errorResponse('Missing required fields'));
      }

      const { data: newInspection, error } = await supabase
        .from('inspection_records')
        .insert([
          {
            user_id: userId,
            location_id,
            inspection_date,
            responses,
            photos: photos || [],
            notes: notes || null,
            status: status || 'completed',
            template_id: template_id || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(successResponse(newInspection, 'Inspection created'));
    }

    // PATCH - Update inspection (own only)
    if (req.method === 'PATCH') {
      if (!id) {
        return res.status(400).json(errorResponse('Inspection ID required'));
      }

      // Verify ownership
      const { data: existing } = await supabase
        .from('inspection_records')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existing || existing.user_id !== userId) {
        return res.status(403).json(errorResponse('Access denied - not your inspection'));
      }

      const updates: any = {};
      const allowedFields = ['responses', 'photos', 'notes', 'status'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      updates.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('inspection_records')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId) // Double check ownership
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(successResponse(updated, 'Inspection updated'));
    }

    // DELETE - Delete inspection (own only)
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json(errorResponse('Inspection ID required'));
      }

      const { data: deleted, error } = await supabase
        .from('inspection_records')
        .delete()
        .eq('id', id)
        .eq('user_id', userId) // Users can only delete their own
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(successResponse(deleted, 'Inspection deleted'));
    }

    return res.status(405).json(errorResponse('Method not allowed'));
  } catch (error: any) {
    console.error('[inspections] Error:', error);
    return res.status(500).json(errorResponse('Operation failed: ' + error.message));
  }
}
