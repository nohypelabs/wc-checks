// api/admin/organizations.ts - Organizations CRUD endpoint (ADMIN+)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
  createAuditLog,
} from '../middleware/role-guard.js';

/**
 * GET /api/admin/organizations - List all organizations
 * GET /api/admin/organizations?id=xxx - Get specific organization
 * POST /api/admin/organizations - Create organization (not used, uses resources endpoint)
 * PATCH /api/admin/organizations?id=xxx - Update organization
 * DELETE /api/admin/organizations?id=xxx - Soft delete organization
 *
 * Requirements: Admin+ (level 80+)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🏢 [organizations] Request:', req.method, req.query);

  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    console.error('❌ [organizations] Access denied - no auth or supabase');
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  const { id } = req.query;
  const orgId = Array.isArray(id) ? id[0] : id;

  try {
    // GET - List all or get specific
    if (req.method === 'GET') {
      if (orgId) {
        console.log('📖 [organizations] Getting single organization:', orgId);
        const { data, error } = await (supabase as any)
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();

        if (error) {
          console.error('❌ [organizations] Error fetching organization:', error);
          throw error;
        }

        console.log('✅ [organizations] Organization retrieved successfully');
        return successResponse(res, data, 'Organization retrieved');
      }

      // List all
      console.log('📖 [organizations] Listing all organizations');
      const { data, error } = await (supabase as any)
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [organizations] Error fetching organizations:', error);
        throw error;
      }

      console.log('✅ [organizations] Organizations retrieved:', data?.length || 0);
      return successResponse(res, data || [], 'Organizations retrieved');
    }

    // PATCH - Update organization
    if (req.method === 'PATCH') {
      if (!orgId) {
        console.error('❌ [organizations] PATCH: Organization ID required');
        return errorResponse(res, 400, 'Organization ID required');
      }

      console.log('🔄 [organizations] Updating organization:', orgId, req.body);

      const updates: any = {};
      const allowedFields = ['name', 'short_code', 'address', 'phone', 'email', 'logo_url', 'is_active'];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      updates.updated_at = new Date().toISOString();

      const { data: updated, error } = await (supabase as any)
        .from('organizations')
        .update(updates)
        .eq('id', orgId)
        .select()
        .single();

      if (error) {
        console.error('❌ [organizations] Error updating organization:', error);
        throw error;
      }

      await createAuditLog(
        auth.userId,
        'UPDATE_ORGANIZATION',
        'organization',
        orgId,
        { orgId, updates },
        true
      );

      console.log('✅ [organizations] Organization updated successfully');
      return successResponse(res, updated, 'Organization updated');
    }

    // DELETE - Soft delete organization
    if (req.method === 'DELETE') {
      if (!orgId) {
        console.error('❌ [organizations] DELETE: Organization ID required');
        return errorResponse(res, 400, 'Organization ID required');
      }

      console.log('🗑️ [organizations] Soft deleting organization:', orgId);

      // Check if organization has active buildings
      const { data: buildings, error: buildingsError } = await (supabase as any)
        .from('buildings')
        .select('id')
        .eq('organization_id', orgId)
        .eq('is_active', true);

      if (buildingsError) {
        console.error('❌ [organizations] Error checking buildings:', buildingsError);
        throw buildingsError;
      }

      if (buildings && buildings.length > 0) {
        console.warn('⚠️ [organizations] Cannot delete organization with active buildings');
        return errorResponse(res, 409, `Cannot delete organization: ${buildings.length} active building(s) found. Please deactivate buildings first.`);
      }

      const { data: deleted, error } = await (supabase as any)
        .from('organizations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', orgId)
        .select()
        .single();

      if (error) {
        console.error('❌ [organizations] Error deleting organization:', error);
        throw error;
      }

      await createAuditLog(
        auth.userId,
        'DELETE_ORGANIZATION',
        'organization',
        orgId,
        { orgId },
        true
      );

      console.log('✅ [organizations] Organization soft deleted successfully');
      return successResponse(res, deleted, 'Organization deleted');
    }

    console.error('❌ [organizations] Method not allowed:', req.method);
    return errorResponse(res, 405, 'Method not allowed');
  } catch (error: any) {
    console.error('❌ [organizations] Error:', error);
    return errorResponse(res, 500, 'Operation failed: ' + error.message);
  }
}
