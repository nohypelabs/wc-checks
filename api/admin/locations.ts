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
    return res.status(403).json(errorResponse('Access denied - Admin privileges required'));
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
        return res.status(200).json(successResponse(location, 'Location retrieved'));
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

      return res.status(200).json(successResponse(locations || [], 'Locations retrieved'));
    }

    // POST - Create location
    if (req.method === 'POST') {
      const { name, short_code, building_id, organization_id, floor, code, type } = req.body;

      if (!name || !short_code || !organization_id) {
        return res.status(400).json(errorResponse('Missing required fields: name, short_code, organization_id'));
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

      await createAuditLog({
        userId: auth.userId,
        action: 'create_location',
        targetUserId: null,
        targetRoleId: null,
        metadata: { locationId: newLocation.id, name: newLocation.name },
        status: 'success',
      });

      return res.status(201).json(successResponse(newLocation, 'Location created'));
    }

    // PATCH - Update location
    if (req.method === 'PATCH') {
      if (!id) {
        return res.status(400).json(errorResponse('Location ID required'));
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

      await createAuditLog({
        userId: auth.userId,
        action: 'update_location',
        targetUserId: null,
        targetRoleId: null,
        metadata: { locationId: id, updates },
        status: 'success',
      });

      return res.status(200).json(successResponse(updated, 'Location updated'));
    }

    // DELETE - Soft delete location
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json(errorResponse('Location ID required'));
      }

      const { data: deleted, error } = await supabase
        .from('locations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog({
        userId: auth.userId,
        action: 'delete_location',
        targetUserId: null,
        targetRoleId: null,
        metadata: { locationId: id },
        status: 'success',
      });

      return res.status(200).json(successResponse(deleted, 'Location deleted'));
    }

    return res.status(405).json(errorResponse('Method not allowed'));
  } catch (error: any) {
    console.error('[locations] Error:', error);
    return res.status(500).json(errorResponse('Operation failed: ' + error.message));
  }
}
