// api/admin/buildings.ts - Buildings CRUD endpoint (ADMIN+)
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
 * GET /api/admin/buildings?organization_id=xxx - Get buildings by organization
 * POST /api/admin/buildings - Create building (not used, uses resources endpoint)
 * PATCH /api/admin/buildings?id=xxx - Update building
 * DELETE /api/admin/buildings?id=xxx - Soft delete building
 *
 * Requirements: Admin+ (level 80+)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🏛️ [buildings] Request:', req.method, req.query);

  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    console.error('❌ [buildings] Access denied - no auth or supabase');
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  const { id, organization_id } = req.query;
  const buildingId = Array.isArray(id) ? id[0] : id;
  const orgId = Array.isArray(organization_id) ? organization_id[0] : organization_id;

  try {
    // GET - List all or get specific
    if (req.method === 'GET') {
      if (buildingId) {
        console.log('📖 [buildings] Getting single building:', buildingId);
        const { data, error } = await (supabase as any)
          .from('buildings')
          .select('*, organizations(name, short_code)')
          .eq('id', buildingId)
          .single();

        if (error) {
          console.error('❌ [buildings] Error fetching building:', error);
          throw error;
        }

        console.log('✅ [buildings] Building retrieved successfully');
        return successResponse(res, data, 'Building retrieved');
      }

      // List all with optional organization filter
      console.log('📖 [buildings] Listing buildings, org filter:', orgId);
      let query = (supabase as any)
        .from('buildings')
        .select('*, organizations(name, short_code)')
        .order('created_at', { ascending: false });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('❌ [buildings] Error fetching buildings:', error);
        throw error;
      }

      console.log('✅ [buildings] Buildings retrieved:', data?.length || 0);
      return successResponse(res, data || [], 'Buildings retrieved');
    }

    // PATCH - Update building
    if (req.method === 'PATCH') {
      if (!buildingId) {
        console.error('❌ [buildings] PATCH: Building ID required');
        return errorResponse(res, 400, 'Building ID required');
      }

      console.log('🔄 [buildings] Updating building:', buildingId, req.body);

      const updates: any = {};
      const allowedFields = ['name', 'short_code', 'address', 'total_floors', 'type', 'is_active', 'organization_id'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      updates.updated_at = new Date().toISOString();

      const { data: updated, error } = await (supabase as any)
        .from('buildings')
        .update(updates)
        .eq('id', buildingId)
        .select()
        .single();

      if (error) {
        console.error('❌ [buildings] Error updating building:', error);
        throw error;
      }

      await createAuditLog(
        auth.userId,
        'UPDATE_BUILDING',
        'building',
        buildingId,
        { buildingId, updates },
        true
      );

      console.log('✅ [buildings] Building updated successfully');
      return successResponse(res, updated, 'Building updated');
    }

    // DELETE - Soft delete building
    if (req.method === 'DELETE') {
      if (!buildingId) {
        console.error('❌ [buildings] DELETE: Building ID required');
        return errorResponse(res, 400, 'Building ID required');
      }

      console.log('🗑️ [buildings] Soft deleting building:', buildingId);

      const { data: deleted, error } = await (supabase as any)
        .from('buildings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', buildingId)
        .select()
        .single();

      if (error) {
        console.error('❌ [buildings] Error deleting building:', error);
        throw error;
      }

      await createAuditLog(
        auth.userId,
        'DELETE_BUILDING',
        'building',
        buildingId,
        { buildingId },
        true
      );

      console.log('✅ [buildings] Building soft deleted successfully');
      return successResponse(res, deleted, 'Building deleted');
    }

    console.error('❌ [buildings] Method not allowed:', req.method);
    return errorResponse(res, 405, 'Method not allowed');
  } catch (error: any) {
    console.error('❌ [buildings] Error:', error);
    return errorResponse(res, 500, 'Operation failed: ' + error.message);
  }
}
