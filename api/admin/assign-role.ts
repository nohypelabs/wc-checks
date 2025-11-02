// api/admin/assign-role.ts - Assign role to user with server-side validation
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
 * POST /api/admin/assign-role
 *
 * Assign a role to a user with validation:
 * - Only superadmin (level >= 100) can assign roles
 * - Cannot assign role higher than your own level
 * - Creates audit log entry
 *
 * Body:
 *   {
 *     userId: string,
 *     roleId: string
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

  // 🔥 VALIDATION: Only superadmin (level >= 100) can assign roles
  const auth = await validateAuth(req, 100);

  if (!auth) {
    return errorResponse(res, 403, 'Forbidden: Only superadmin can assign roles');
  }

  // Parse request body
  const { userId, roleId } = req.body;

  if (!userId || !roleId) {
    return errorResponse(res, 400, 'Missing required fields: userId and roleId');
  }

  // Validate userId and roleId are strings
  if (typeof userId !== 'string' || typeof roleId !== 'string') {
    return errorResponse(res, 400, 'Invalid data types: userId and roleId must be strings');
  }

  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      return errorResponse(res, 500, 'Database connection error - missing configuration');
    }

    // Get target role details
    const { data: targetRole, error: roleError } = await supabase
      .from('roles')
      .select('id, name, level, is_active')
      .eq('id', roleId)
      .single();

    if (roleError || !targetRole) {
      return errorResponse(res, 404, 'Role not found');
    }

    // Check if role is active
    if (!targetRole.is_active) {
      return errorResponse(res, 400, 'Cannot assign inactive role');
    }

    // 🔥 VALIDATION: Cannot assign role higher than your own level
    if (targetRole.level > auth.userRole.level) {
      return errorResponse(
        res,
        403,
        `Cannot assign role with level ${targetRole.level} (your level: ${auth.userRole.level})`
      );
    }

    // Verify target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return errorResponse(res, 404, 'User not found');
    }

    // 🔥 VALIDATION: Cannot modify your own role
    if (userId === auth.userId) {
      return errorResponse(res, 400, 'Cannot modify your own role');
    }

    // Check if user already has a role
    const { data: existingRole, error: existingError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      console.error('[assign-role] Error checking existing role:', existingError);
      return errorResponse(res, 500, 'Database error');
    }

    let operation: 'updated' | 'assigned';

    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({
          role_id: roleId,
          assigned_by: auth.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('[assign-role] Error updating role:', updateError);
        return errorResponse(res, 500, 'Failed to update role');
      }

      operation = 'updated';
    } else {
      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleId,
          assigned_by: auth.userId,
        });

      if (insertError) {
        console.error('[assign-role] Error inserting role:', insertError);
        return errorResponse(res, 500, 'Failed to assign role');
      }

      operation = 'assigned';
    }

    // 📝 AUDIT LOG
    await createAuditLog(
      auth.userId,
      'ASSIGN_ROLE',
      'user_role',
      userId,
      {
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.full_name,
        roleId: targetRole.id,
        roleName: targetRole.name,
        roleLevel: targetRole.level,
        operation,
      },
      true
    );

    console.log(`[assign-role] Success: ${operation} role ${targetRole.name} to user ${targetUser.email}`);

    return successResponse(
      res,
      {
        userId,
        roleId,
        roleName: targetRole.name,
        operation,
      },
      `Role "${targetRole.name}" ${operation} successfully for ${targetUser.full_name}`
    );
  } catch (error) {
    console.error('[assign-role] Unexpected error:', error);
    return errorResponse(res, 500, 'Internal server error');
  }
}
