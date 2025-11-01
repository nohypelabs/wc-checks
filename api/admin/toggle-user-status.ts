// api/admin/toggle-user-status.ts - Toggle user active status with protection
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { validateAuth, createAuditLog, errorResponse, successResponse } from '../middleware/role-guard';
import type { Database } from '../../src/types/database.types';

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * POST /api/admin/toggle-user-status
 *
 * Activate or deactivate a user with validation:
 * - Only admin (level >= 80) can toggle user status
 * - Cannot deactivate yourself
 * - Cannot modify user with equal or higher role level
 * - Creates audit log entry
 *
 * Body:
 *   {
 *     userId: string,
 *     isActive: boolean
 *   }
 *
 * Response:
 *   {
 *     success: true,
 *     message: string
 *   }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  // 🔥 VALIDATION: Only admin (level >= 80) can toggle user status
  const auth = await validateAuth(req, 80);

  if (!auth) {
    return errorResponse(res, 403, 'Forbidden: Admin access required');
  }

  // Parse request body
  const { userId, isActive } = req.body;

  if (!userId || typeof isActive !== 'boolean') {
    return errorResponse(res, 400, 'Missing or invalid fields: userId (string) and isActive (boolean) required');
  }

  // 🔥 VALIDATION: Cannot modify yourself
  if (userId === auth.userId) {
    return errorResponse(res, 400, 'Cannot modify your own status');
  }

  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      return errorResponse(res, 500, 'Database connection error - missing configuration');
    }

    // Get target user details
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, is_active')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return errorResponse(res, 404, 'User not found');
    }

    // Get target user's role level
    const { data: targetUserRole, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles!user_roles_role_id_fkey (
          id,
          name,
          level
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError) {
      console.error('[toggle-user-status] Error fetching target user role:', roleError);
      return errorResponse(res, 500, 'Database error');
    }

    // Extract target user's role level
    const targetRoleData = targetUserRole?.roles as { id: string; name: string; level: number } | null;
    const targetLevel = targetRoleData?.level || 0;
    const targetRoleName = targetRoleData?.name || 'user';

    console.log('[toggle-user-status] Target user role:', {
      email: targetUser.email,
      role: targetRoleName,
      level: targetLevel,
    });

    // 🔥 VALIDATION: Cannot modify user with equal or higher role level
    if (targetLevel >= auth.userRole.level) {
      return errorResponse(
        res,
        403,
        `Cannot modify user with equal or higher role level (target: ${targetLevel}, yours: ${auth.userRole.level})`
      );
    }

    // Check if status is already the desired state
    if (targetUser.is_active === isActive) {
      return successResponse(
        res,
        {
          userId,
          isActive,
          unchanged: true,
        },
        `User is already ${isActive ? 'active' : 'inactive'}`
      );
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[toggle-user-status] Error updating user:', updateError);
      return errorResponse(res, 500, 'Failed to update user status');
    }

    // 📝 AUDIT LOG
    await createAuditLog(auth.userId, 'TOGGLE_USER_STATUS', {
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      targetUserName: targetUser.full_name,
      targetRole: targetRoleName,
      previousStatus: targetUser.is_active,
      newStatus: isActive,
    });

    console.log(`[toggle-user-status] Success: ${targetUser.email} ${isActive ? 'activated' : 'deactivated'}`);

    return successResponse(
      res,
      {
        userId,
        isActive,
        userName: targetUser.full_name,
      },
      `User "${targetUser.full_name}" ${isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    console.error('[toggle-user-status] Unexpected error:', error);
    return errorResponse(res, 500, 'Internal server error');
  }
}
