// api/admin/list-roles.ts - List all available roles (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
} from '../middleware/role-guard';

/**
 * GET /api/admin/list-roles
 *
 * Lists all active roles available in the system
 *
 * Requirements:
 * - User must be level 80+ (admin or above)
 * - Returns only active roles
 *
 * Security:
 * - Validates requester is admin+
 * - Uses backend service key for reliable access
 * - Only returns active roles for security
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  // Validate authentication and require admin (level 80+)
  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    console.error('[list-roles] Auth failed or Supabase not initialized');
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  console.log('[list-roles] Admin access granted:', {
    userId: auth.userId,
    role: auth.userRole.name,
    level: auth.userRole.level,
  });

  try {
    // Fetch all active roles
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: false });

    if (error) {
      console.error('[list-roles] Error fetching roles:', error);
      throw error;
    }

    console.log('[list-roles] Success - returning', roles?.length || 0, 'roles');

    return successResponse(res, roles || [], 'Roles retrieved successfully');
  } catch (error: any) {
    console.error('[list-roles] Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve roles: ' + error.message);
  }
}
