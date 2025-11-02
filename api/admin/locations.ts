// api/admin/locations.ts - Locations CRUD (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
  createAuditLog,
} from '../middleware/role-guard';

/**
 * GET /api/admin/locations - List all locations
 * GET /api/admin/locations?id=xxx - Get specific location
 * GET /api/admin/locations?building_id=xxx - Filter by building
 * GET /api/admin/locations?organization_id=xxx - Filter by organization
 * POST /api/admin/locations - Create new location
 * PATCH /api/admin/locations?id=xxx - Update location
 * DELETE /api/admin/locations?id=xxx - Delete location
 *
 * Requirements: Admin+ (level 80+)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  const { id, building_id, organization_id } = req.query;

  try {
    // GET - List all or get specific
    if (req.method === 'GET') {
      if (id) {
        const { data: location, error } = await supabase
          .from('locations')
          .select('*, buildings(name, organization_id)')
          .eq('id', id)
          .single();

        if (error) throw error;
        return successResponse(res, location, 'Location retrieved');
      }

      let query = supabase
        .from('locations')
        .select('*, buildings(name, organization_id)')
        .order('created_at', { ascending: false });

      if (building_id) {
        query = query.eq('building_id', building_id);
      }

      if (organization_id) {
        query = query.eq('organization_id', organization_id);
      }

      const { data: locations, error } = await query;
      if (error) throw error;

      return successResponse(res, locations || [], 'Locations retrieved');
    }

    // POST - Create location
    if (req.method === 'POST') {
      const { name, short_code, building_id, organization_id, floor, code, type } = req.body;

      if (!name || !short_code || !organization_id) {
        return errorResponse(res, 400, 'Missing required fields: name, short_code, organization_id');
      }

      const { data: newLocation, error } = await supabase
        .from('locations')
        .insert([
          {
            name,
            short_code,
            building_id: building_id || null,
            organization_id,
            floor: floor || null,
            code: code || null,
            type: type || null,
            created_by: auth.userId,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        'CREATE_LOCATION',
        'location',
        newLocation.id,
        { locationId: newLocation.id, name: newLocation.name },
        true
      );

      return successResponse(res, newLocation, 'Location created');
    }

    // PATCH - Update location
    if (req.method === 'PATCH') {
      if (!id) {
        return errorResponse(res, 400, 'Location ID required');
      }

      const updates: any = {};
      const allowedFields = ['name', 'short_code', 'building_id', 'floor', 'code', 'type', 'is_active'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      updates.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        'UPDATE_LOCATION',
        'location',
        id as string,
        { locationId: id, updates },
        true
      );

      return successResponse(res, updated, 'Location updated');
    }

    // DELETE - Soft delete location
    if (req.method === 'DELETE') {
      if (!id) {
        return errorResponse(res, 400, 'Location ID required');
      }

      const { data: deleted, error } = await supabase
        .from('locations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        'DELETE_LOCATION',
        'location',
        id as string,
        { locationId: id },
        true
      );

      return successResponse(res, deleted, 'Location deleted');
    }

    return errorResponse(res, 405, 'Method not allowed');
  } catch (error: any) {
    console.error('[locations] Error:', error);
    return errorResponse(res, 500, 'Operation failed: ' + error.message);
  }
}
