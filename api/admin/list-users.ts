// api/admin/list-users.ts - List all users with roles (SUPERADMIN ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
  createAuditLog,
} from '../middleware/role-guard';

/**
 * GET /api/admin/list-users
 *
 * Lists all users with their roles
 *
 * Requirements:
 * - User must be level 90+ (superadmin)
 * - Returns all users with roles from database
 *
 * Security:
 * - Uses backend service key for unrestricted access
 * - Validates requester is superadmin
 * - Creates audit log of who accessed user list
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return res.status(405).json(errorResponse('Method not allowed'));
  }

  // Validate authentication and require superadmin (level 90+)
  const auth = await validateAuth(req, 90);

  if (!auth || !supabase) {
    console.error('[list-users] Auth failed or Supabase not initialized');
    return res.status(403).json(errorResponse('Access denied - Superadmin privileges required'));
  }

  console.log('[list-users] Superadmin access granted:', {
    userId: auth.userId,
    role: auth.userRole.name,
    level: auth.userRole.level,
  });

  try {
    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, phone, is_active, created_at, last_login_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[list-users] Error fetching users:', usersError);
      throw usersError;
    }

    console.log('[list-users] Fetched', users?.length || 0, 'users');

    // Fetch all user_roles with roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles!user_roles_role_id_fkey (
          id,
          name,
          level
        )
      `);

    if (rolesError) {
      console.error('[list-users] Error fetching user roles:', rolesError);
      throw rolesError;
    }

    console.log('[list-users] Fetched', userRoles?.length || 0, 'user roles');

    // Combine the data
    const combined = users.map((user: any) => {
      const userRole = userRoles?.find((ur: any) => ur.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        role: userRole?.roles || null,
      };
    });

    // Create audit log
    await createAuditLog({
      userId: auth.userId,
      action: 'list_users',
      targetUserId: null,
      targetRoleId: null,
      metadata: {
        userCount: combined.length,
        timestamp: new Date().toISOString(),
      },
      status: 'success',
    });

    console.log('[list-users] Success - returning', combined.length, 'users with roles');

    return res.status(200).json(
      successResponse(combined, 'Users retrieved successfully')
    );
  } catch (error: any) {
    console.error('[list-users] Error:', error);

    // Create audit log for failure
    await createAuditLog({
      userId: auth.userId,
      action: 'list_users',
      targetUserId: null,
      targetRoleId: null,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      status: 'failed',
    });

    return res.status(500).json(errorResponse('Failed to retrieve users: ' + error.message));
  }
}
