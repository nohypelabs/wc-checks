// api/admin/locations.ts - Locations CRUD (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
  createAuditLog,
} from '../middleware/role-guard.js';

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
  const locationId = Array.isArray(id) ? id[0] : id;
  const buildingId = Array.isArray(building_id) ? building_id[0] : building_id;
  const orgId = Array.isArray(organization_id) ? organization_id[0] : organization_id;

  try {
    // GET - List all or get specific
    if (req.method === 'GET') {
      if (locationId) {
        const { data: location, error } = await supabase
          .from('locations')
          .select('*, buildings(name, organization_id)')
          .eq('id', locationId)
          .single();

        if (error) throw error;
        return successResponse(res, location, 'Location retrieved');
      }

      let query = supabase
        .from('locations')
        .select('*, buildings(name, organization_id)')
        .order('created_at', { ascending: false });

      if (buildingId) {
        query = query.eq('building_id', buildingId);
      }

      if (orgId) {
        query = query.eq('organization_id', orgId);
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
      if (!locationId) {
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
        .eq('id', locationId)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        'UPDATE_LOCATION',
        'location',
        locationId,
        { locationId, updates },
        true
      );

      return successResponse(res, updated, 'Location updated');
    }

    // DELETE - Soft delete location
    if (req.method === 'DELETE') {
      if (!locationId) {
        return errorResponse(res, 400, 'Location ID required');
      }

      const { data: deleted, error } = await supabase
        .from('locations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', locationId)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        'DELETE_LOCATION',
        'location',
        locationId,
        { locationId },
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
