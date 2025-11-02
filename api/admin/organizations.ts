// api/admin/organizations.ts - Organizations CRUD (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
  createAuditLog,
} from '../middleware/role-guard';

/**
 * GET /api/admin/organizations - List all organizations
 * GET /api/admin/organizations?id=xxx - Get specific organization
 * POST /api/admin/organizations - Create new organization
 * PATCH /api/admin/organizations?id=xxx - Update organization
 * DELETE /api/admin/organizations?id=xxx - Delete organization
 *
 * Requirements: Admin+ (level 80+)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate authentication
  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  const { id } = req.query;

  try {
    // GET - List all or get specific
    if (req.method === 'GET') {
      if (id) {
        // Get specific organization
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!org) {
          return errorResponse(res, 404, 'Organization not found');
        }

        return successResponse(res, org, 'Organization retrieved successfully');
      } else {
        // List all organizations
        const { data: organizations, error } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return successResponse(res, organizations || [], 'Organizations retrieved successfully');
      }
    }

    // POST - Create new organization
    if (req.method === 'POST') {
      const { name, short_code, address, phone, email, logo_url } = req.body;

      // Validation
      if (!name || !short_code) {
        return errorResponse(res, 400, 'Missing required fields: name, short_code');
      }

      // Create organization
      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert([
          {
            name,
            short_code,
            address: address || null,
            phone: phone || null,
            email: email || null,
            logo_url: logo_url || null,
            created_by: auth.userId,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await createAuditLog(
        auth.userId,
        'CREATE_ORGANIZATION',
        'organization',
        newOrg.id,
        {
          organizationId: newOrg.id,
          name: newOrg.name,
          short_code: newOrg.short_code,
        },
        true
      );

      return successResponse(res, newOrg, 'Organization created successfully');
    }

    // PATCH - Update organization
    if (req.method === 'PATCH') {
      if (!id) {
        return errorResponse(res, 400, 'Organization ID required');
      }

      const { name, short_code, address, phone, email, logo_url, is_active } = req.body;

      // Build update object
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (short_code !== undefined) updates.short_code = short_code;
      if (address !== undefined) updates.address = address;
      if (phone !== undefined) updates.phone = phone;
      if (email !== undefined) updates.email = email;
      if (logo_url !== undefined) updates.logo_url = logo_url;
      if (is_active !== undefined) updates.is_active = is_active;
      updates.updated_at = new Date().toISOString();

      // Update organization
      const { data: updatedOrg, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await createAuditLog(
        auth.userId,
        'UPDATE_ORGANIZATION',
        'organization',
        id as string,
        {
          organizationId: id,
          updates,
        },
        true
      );

      return successResponse(res, updatedOrg, 'Organization updated successfully');
    }

    // DELETE - Delete organization
    if (req.method === 'DELETE') {
      if (!id) {
        return errorResponse(res, 400, 'Organization ID required');
      }

      // Soft delete - set is_active to false
      const { data: deletedOrg, error } = await supabase
        .from('organizations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await createAuditLog(
        auth.userId,
        'DELETE_ORGANIZATION',
        'organization',
        id as string,
        {
          organizationId: id,
        },
        true
      );

      return successResponse(res, deletedOrg, 'Organization deleted successfully');
    }

    return errorResponse(res, 405, 'Method not allowed');
  } catch (error: any) {
    console.error('[organizations] Error:', error);

    // Audit log for failure
    if (req.method !== 'GET') {
      await createAuditLog(
        auth.userId,
        `${req.method?.toUpperCase()}_ORGANIZATION`,
        'organization',
        (req.query.id as string) || undefined,
        {
          error: error.message,
          body: req.body,
        },
        false,
        error.message
      );
    }

    return errorResponse(res, 500, 'Operation failed: ' + error.message);
  }
}
