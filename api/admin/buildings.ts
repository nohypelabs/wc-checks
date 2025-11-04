// api/admin/buildings.ts - Buildings CRUD (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
  createAuditLog,
} from '../middleware/role-guard.js';

/**
 * GET /api/admin/buildings - List all buildings
 * GET /api/admin/buildings?id=xxx - Get specific building
 * GET /api/admin/buildings?organization_id=xxx - Filter by organization
 * POST /api/admin/buildings - Create new building
 * PATCH /api/admin/buildings?id=xxx - Update building
 * DELETE /api/admin/buildings?id=xxx - Delete building
 *
 * Requirements: Admin+ (level 80+)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  const { id, organization_id } = req.query;
  const buildingId = Array.isArray(id) ? id[0] : id;
  const orgId = Array.isArray(organization_id) ? organization_id[0] : organization_id;

  try {
    // GET - List all or get specific
    if (req.method === 'GET') {
      if (buildingId) {
        const { data: building, error } = await supabase
          .from('buildings')
          .select('*, organizations(name)')
          .eq('id', buildingId)
          .single();

        if (error) throw error;
        return successResponse(res, building, 'Building retrieved');
      }

      let query = supabase
        .from('buildings')
        .select('*, organizations(name)')
        .order('created_at', { ascending: false });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data: buildings, error } = await query;
      if (error) throw error;

      return successResponse(res, buildings || [], 'Buildings retrieved');
    }

    // POST - Create building
    if (req.method === 'POST') {
      const { name, short_code, organization_id, address, total_floors, type } = req.body;

      if (!name || !short_code || !organization_id) {
        return errorResponse(res, 400, 'Missing required fields');
      }

      const { data: newBuilding, error } = await supabase
        .from('buildings')
        .insert([
          {
            name,
            short_code,
            organization_id,
            address: address || null,
            total_floors: total_floors || null,
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
        'CREATE_BUILDING',
        'building',
        newBuilding.id,
        { buildingId: newBuilding.id, name: newBuilding.name },
        true
      );

      return successResponse(res, newBuilding, 'Building created');
    }

    // PATCH - Update building
    if (req.method === 'PATCH') {
      if (!buildingId) {
        return errorResponse(res, 400, 'Building ID required');
      }

      const updates: any = {};
      const allowedFields = ['name', 'short_code', 'address', 'total_floors', 'type', 'is_active'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      updates.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from('buildings')
        .update(updates)
        .eq('id', buildingId)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        'UPDATE_BUILDING',
        'building',
        buildingId,
        { buildingId, updates },
        true
      );

      return successResponse(res, updated, 'Building updated');
    }

    // DELETE - Soft delete building
    if (req.method === 'DELETE') {
      if (!buildingId) {
        return errorResponse(res, 400, 'Building ID required');
      }

      const { data: deleted, error } = await supabase
        .from('buildings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', buildingId)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        'DELETE_BUILDING',
        'building',
        buildingId,
        { buildingId },
        true
      );

      return successResponse(res, deleted, 'Building deleted');
    }

    return errorResponse(res, 405, 'Method not allowed');
  } catch (error: any) {
    console.error('[buildings] Error:', error);
    return errorResponse(res, 500, 'Operation failed: ' + error.message);
  }
}
