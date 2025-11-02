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
    return res.status(403).json(errorResponse('Access denied - Admin privileges required'));
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
          return res.status(404).json(errorResponse('Organization not found'));
        }

        return res.status(200).json(successResponse(org, 'Organization retrieved successfully'));
      } else {
        // List all organizations
        const { data: organizations, error } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(successResponse(organizations || [], 'Organizations retrieved successfully'));
      }
    }

    // POST - Create new organization
    if (req.method === 'POST') {
      const { name, short_code, address, phone, email, logo_url } = req.body;

      // Validation
      if (!name || !short_code) {
        return res.status(400).json(errorResponse('Missing required fields: name, short_code'));
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
      await createAuditLog({
        userId: auth.userId,
        action: 'create_organization',
        targetUserId: null,
        targetRoleId: null,
        metadata: {
          organizationId: newOrg.id,
          name: newOrg.name,
          short_code: newOrg.short_code,
        },
        status: 'success',
      });

      return res.status(201).json(successResponse(newOrg, 'Organization created successfully'));
    }

    // PATCH - Update organization
    if (req.method === 'PATCH') {
      if (!id) {
        return res.status(400).json(errorResponse('Organization ID required'));
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
      await createAuditLog({
        userId: auth.userId,
        action: 'update_organization',
        targetUserId: null,
        targetRoleId: null,
        metadata: {
          organizationId: id,
          updates,
        },
        status: 'success',
      });

      return res.status(200).json(successResponse(updatedOrg, 'Organization updated successfully'));
    }

    // DELETE - Delete organization
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json(errorResponse('Organization ID required'));
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
      await createAuditLog({
        userId: auth.userId,
        action: 'delete_organization',
        targetUserId: null,
        targetRoleId: null,
        metadata: {
          organizationId: id,
        },
        status: 'success',
      });

      return res.status(200).json(successResponse(deletedOrg, 'Organization deleted successfully'));
    }

    return res.status(405).json(errorResponse('Method not allowed'));
  } catch (error: any) {
    console.error('[organizations] Error:', error);

    // Audit log for failure
    if (req.method !== 'GET') {
      await createAuditLog({
        userId: auth.userId,
        action: `${req.method?.toLowerCase()}_organization`,
        targetUserId: null,
        targetRoleId: null,
        metadata: {
          error: error.message,
          body: req.body,
        },
        status: 'failed',
      });
    }

    return res.status(500).json(errorResponse('Operation failed: ' + error.message));
  }
}
