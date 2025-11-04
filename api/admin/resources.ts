// api/admin/resources.ts - Organizations, Buildings, Locations CRUD (ADMIN+)
// Consolidates: organizations, buildings, locations
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
  createAuditLog,
} from '../middleware/role-guard.js';

/**
 * GET /api/admin/resources?type=organizations - List all organizations
 * GET /api/admin/resources?type=organizations&id=xxx - Get specific organization
 * POST /api/admin/resources?type=organizations - Create organization
 * PATCH /api/admin/resources?type=organizations&id=xxx - Update organization
 * DELETE /api/admin/resources?type=organizations&id=xxx - Delete organization
 *
 * Same pattern for: buildings, locations
 *
 * Requirements: Admin+ (level 80+)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  const { type, id } = req.query;
  const resourceType = Array.isArray(type) ? type[0] : type;
  const resourceId = Array.isArray(id) ? id[0] : id;

  if (!resourceType || !['organizations', 'buildings', 'locations'].includes(resourceType)) {
    return errorResponse(res, 400, 'Invalid or missing resource type. Must be: organizations, buildings, or locations');
  }

  try {
    // GET - List all or get specific
    if (req.method === 'GET') {
      if (resourceId) {
        let query = (supabase as any).from(resourceType).select('*').eq('id', resourceId);

        // Add relations
        if (resourceType === 'buildings') {
          query = (supabase as any).from(resourceType).select('*, organizations(name)').eq('id', resourceId);
        } else if (resourceType === 'locations') {
          query = (supabase as any).from(resourceType).select('*, buildings(name, organization_id)').eq('id', resourceId);
        }

        const { data, error } = await query.single();

        if (error) throw error;
        return successResponse(res, data, `${resourceType.slice(0, -1)} retrieved`);
      }

      // List all with optional filters
      let query = (supabase as any).from(resourceType).select('*').order('created_at', { ascending: false });

      // Add relations
      if (resourceType === 'buildings') {
        query = (supabase as any).from(resourceType).select('*, organizations(name)').order('created_at', { ascending: false });
      } else if (resourceType === 'locations') {
        query = (supabase as any).from(resourceType).select('*, buildings(name, organization_id)').order('created_at', { ascending: false });
      }

      // Apply filters
      if (resourceType === 'buildings' && req.query.organization_id) {
        const orgId = Array.isArray(req.query.organization_id) ? req.query.organization_id[0] : req.query.organization_id;
        query = query.eq('organization_id', orgId);
      } else if (resourceType === 'locations') {
        if (req.query.building_id) {
          const buildingId = Array.isArray(req.query.building_id) ? req.query.building_id[0] : req.query.building_id;
          query = query.eq('building_id', buildingId);
        }
        if (req.query.organization_id) {
          const orgId = Array.isArray(req.query.organization_id) ? req.query.organization_id[0] : req.query.organization_id;
          query = query.eq('organization_id', orgId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return successResponse(res, data || [], `${resourceType} retrieved`);
    }

    // POST - Create new resource
    if (req.method === 'POST') {
      const insertData: any = {
        ...req.body,
        created_by: auth.userId,
        is_active: true,
      };

      // Validate required fields based on type
      if (resourceType === 'organizations') {
        if (!req.body.name || !req.body.short_code) {
          return errorResponse(res, 400, 'Missing required fields: name, short_code');
        }
      } else if (resourceType === 'buildings') {
        if (!req.body.name || !req.body.short_code || !req.body.organization_id) {
          return errorResponse(res, 400, 'Missing required fields: name, short_code, organization_id');
        }
      } else if (resourceType === 'locations') {
        if (!req.body.name || !req.body.short_code || !req.body.organization_id) {
          return errorResponse(res, 400, 'Missing required fields: name, short_code, organization_id');
        }
      }

      const { data: newResource, error } = await (supabase as any)
        .from(resourceType)
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        `CREATE_${resourceType.slice(0, -1).toUpperCase()}`,
        resourceType.slice(0, -1),
        newResource.id,
        { resourceId: newResource.id, name: newResource.name },
        true
      );

      return successResponse(res, newResource, `${resourceType.slice(0, -1)} created`);
    }

    // PATCH - Update resource
    if (req.method === 'PATCH') {
      if (!resourceId) {
        return errorResponse(res, 400, 'Resource ID required');
      }

      const updates: any = {};
      const allowedFields: Record<string, string[]> = {
        organizations: ['name', 'short_code', 'address', 'phone', 'type', 'is_active'],
        buildings: ['name', 'short_code', 'address', 'total_floors', 'type', 'is_active'],
        locations: ['name', 'short_code', 'building_id', 'floor', 'code', 'type', 'is_active'],
      };

      allowedFields[resourceType].forEach(field => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      updates.updated_at = new Date().toISOString();

      const { data: updated, error } = await (supabase as any)
        .from(resourceType)
        .update(updates)
        .eq('id', resourceId)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        `UPDATE_${resourceType.slice(0, -1).toUpperCase()}`,
        resourceType.slice(0, -1),
        resourceId,
        { resourceId, updates },
        true
      );

      return successResponse(res, updated, `${resourceType.slice(0, -1)} updated`);
    }

    // DELETE - Soft delete resource
    if (req.method === 'DELETE') {
      if (!resourceId) {
        return errorResponse(res, 400, 'Resource ID required');
      }

      const { data: deleted, error } = await (supabase as any)
        .from(resourceType)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', resourceId)
        .select()
        .single();

      if (error) throw error;

      await createAuditLog(
        auth.userId,
        `DELETE_${resourceType.slice(0, -1).toUpperCase()}`,
        resourceType.slice(0, -1),
        resourceId,
        { resourceId },
        true
      );

      return successResponse(res, deleted, `${resourceType.slice(0, -1)} deleted`);
    }

    return errorResponse(res, 405, 'Method not allowed');
  } catch (error: any) {
    console.error(`[${resourceType}] Error:`, error);
    return errorResponse(res, 500, 'Operation failed: ' + error.message);
  }
}
