// api/admin/buildings.ts - Buildings CRUD (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
  createAuditLog,
} from '../middleware/role-guard';

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
    return res.status(403).json(errorResponse('Access denied - Admin privileges required'));
  }

  const { id, organization_id } = req.query;

  try {
    // GET - List all or get specific
    if (req.method === 'GET') {
      if (id) {
        const { data: building, error } = await supabase
          .from('buildings')
          .select('*, organizations(name)')
          .eq('id', id)
          .single();

        if (error) throw error;
        return res.status(200).json(successResponse(building, 'Building retrieved'));
      }

      let query = supabase
        .from('buildings')
        .select('*, organizations(name)')
        .order('created_at', { ascending: false });

      if (organization_id) {
        query = query.eq('organization_id', organization_id);
      }

      const { data: buildings, error } = await query;
      if (error) throw error;

      return res.status(200).json(successResponse(buildings || [], 'Buildings retrieved'));
    }

    // POST - Create building
    if (req.method === 'POST') {
      const { name, short_code, organization_id, address, total_floors, type } = req.body;

      if (!name || !short_code || !organization_id) {
        return res.status(400).json(errorResponse('Missing required fields'));
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

      await createAuditLog({
        userId: auth.userId,
        action: 'create_building',
        targetUserId: null,
        targetRoleId: null,
        metadata: { buildingId: newBuilding.id, name: newBuilding.name },
        status: 'success',
      });

      return res.status(201).json(successResponse(newBuilding, 'Building created'));
    }

    // PATCH - Update building
    if (req.method === 'PATCH') {
      if (!id) {
        return res.status(400).json(errorResponse('Building ID required'));
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
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog({
        userId: auth.userId,
        action: 'update_building',
        targetUserId: null,
        targetRoleId: null,
        metadata: { buildingId: id, updates },
        status: 'success',
      });

      return res.status(200).json(successResponse(updated, 'Building updated'));
    }

    // DELETE - Soft delete building
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json(errorResponse('Building ID required'));
      }

      const { data: deleted, error } = await supabase
        .from('buildings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog({
        userId: auth.userId,
        action: 'delete_building',
        targetUserId: null,
        targetRoleId: null,
        metadata: { buildingId: id },
        status: 'success',
      });

      return res.status(200).json(successResponse(deleted, 'Building deleted'));
    }

    return res.status(405).json(errorResponse('Method not allowed'));
  } catch (error: any) {
    console.error('[buildings] Error:', error);
    return res.status(500).json(errorResponse('Operation failed: ' + error.message));
  }
}
