// api/admin/users.ts - User management (SUPERADMIN/ADMIN)
// Consolidates: list-users, list-roles, assign-role, toggle-user-status
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { validateAuth, createAuditLog, errorResponse, successResponse } from '../middleware/role-guard.js';
import type { Database } from '../../src/types/database.types';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * GET /api/admin/users - List all users with roles (superadmin only)
 * GET /api/admin/users?roles=true - List all roles (admin+)
 * POST /api/admin/users?action=assign-role - Assign role to user (superadmin only)
 * POST /api/admin/users?action=toggle-status - Toggle user active status (admin+)
 * POST /api/admin/users?action=toggle-submit - Toggle user can_submit (superadmin only)
 * POST /api/admin/users?action=block-all-submit - Block ALL users except superadmin (superadmin only)
 * POST /api/admin/users?action=unblock-all-submit - Unblock ALL users (superadmin only)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[admin/users] 🔍 Request received:', { method: req.method, query: req.query });

  const { roles, action } = req.query;
  const rolesParam = Array.isArray(roles) ? roles[0] : roles;
  const actionParam = Array.isArray(action) ? action[0] : action;

    // GET /api/admin/users?roles=true - List all roles
    if (req.method === 'GET' && rolesParam === 'true') {
      console.log('[admin/users] 📋 Fetching roles list...');
      const auth = await validateAuth(req, 80); // Admin+

      if (!auth || !supabase) {
        console.error('[admin/users] ❌ Auth failed or supabase not initialized');
        return errorResponse(res, 403, 'Access denied - Admin privileges required');
      }

      console.log('[admin/users] ✅ Auth validated:', { userId: auth.userId, level: auth.userRole.level });

    try {
      const { data: rolesList, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: false });

      if (error) throw error;

      return successResponse(res, rolesList || [], 'Roles retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, 500, 'Failed to retrieve roles: ' + error.message);
    }
  }

  // GET /api/admin/users - List all users
  if (req.method === 'GET') {
    console.log('[admin/users] 👥 Fetching users list...');
    const auth = await validateAuth(req, 90); // Superadmin

    if (!auth || !supabase) {
      console.error('[admin/users] ❌ Auth failed or supabase not initialized');
      return errorResponse(res, 403, 'Access denied - Superadmin privileges required');
    }

    console.log('[admin/users] ✅ Auth validated:', { userId: auth.userId, level: auth.userRole.level });

    try {
      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, phone, is_active, can_submit, organization_id, approval_status, created_at, last_login_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

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

      if (rolesError) throw rolesError;

      // Fetch organizations for org names
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, short_code');

      // Combine the data
      const combined = users.map((user: any) => {
        const userRole = userRoles?.find((ur: any) => ur.user_id === user.id);
        const org = orgs?.find((o: any) => o.id === user.organization_id);
        return {
          ...user,
          role: userRole?.roles || null,
          organization: org || null,
        };
      });

      await createAuditLog(
        auth.userId,
        'LIST_USERS',
        'user',
        undefined,
        { userCount: combined.length },
        true
      );

      return successResponse(res, combined, 'Users retrieved successfully');
    } catch (error: any) {
      return errorResponse(res, 500, 'Failed to retrieve users: ' + error.message);
    }
  }

  // POST /api/admin/users?action=assign-role - Assign role
  if (req.method === 'POST' && actionParam === 'assign-role') {
    const auth = await validateAuth(req, 100); // Superadmin

    if (!auth || !supabase) {
      return errorResponse(res, 403, 'Forbidden: Only superadmin can assign roles');
    }

    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return errorResponse(res, 400, 'Missing required fields: userId and roleId');
    }

    try {
      // Get target role details
      const { data: targetRole, error: roleError } = await supabase
        .from('roles')
        .select('id, name, level, is_active')
        .eq('id', roleId)
        .single();

      if (roleError || !targetRole) {
        return errorResponse(res, 404, 'Role not found');
      }

      if (!targetRole.is_active) {
        return errorResponse(res, 400, 'Cannot assign inactive role');
      }

      if (targetRole.level > auth.userRole.level) {
        return errorResponse(res, 403, `Cannot assign role with level ${targetRole.level} (your level: ${auth.userRole.level})`);
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

      if (userId === auth.userId) {
        return errorResponse(res, 400, 'Cannot modify your own role');
      }

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let operation: 'updated' | 'assigned';

      if (existingRole) {
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({
            role_id: roleId,
            assigned_by: auth.userId,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;
        operation = 'updated';
      } else {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: roleId,
            assigned_by: auth.userId,
          });

        if (insertError) throw insertError;
        operation = 'assigned';
      }

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

      return successResponse(
        res,
        { userId, roleId, roleName: targetRole.name, operation },
        `Role "${targetRole.name}" ${operation} successfully for ${targetUser.full_name}`
      );
    } catch (error: any) {
      return errorResponse(res, 500, 'Internal server error: ' + error.message);
    }
  }

  // POST /api/admin/users?action=toggle-status - Toggle user status
  if (req.method === 'POST' && actionParam === 'toggle-status') {
    const auth = await validateAuth(req, 80); // Admin+

    if (!auth || !supabase) {
      return errorResponse(res, 403, 'Forbidden: Admin access required');
    }

    const { userId, isActive } = req.body;

    if (!userId || typeof isActive !== 'boolean') {
      return errorResponse(res, 400, 'Missing or invalid fields: userId (string) and isActive (boolean) required');
    }

    if (userId === auth.userId) {
      return errorResponse(res, 400, 'Cannot modify your own status');
    }

    try {
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
      const { data: targetUserRole } = await supabase
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

      const targetRoleData = targetUserRole?.roles as { id: string; name: string; level: number } | null;
      const targetLevel = targetRoleData?.level || 0;
      const targetRoleName = targetRoleData?.name || 'user';

      // Cannot modify user with equal or higher role level
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
          { userId, isActive, unchanged: true },
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

      if (updateError) throw updateError;

      await createAuditLog(
        auth.userId,
        'TOGGLE_USER_STATUS',
        'user',
        userId,
        {
          targetUserEmail: targetUser.email,
          targetUserName: targetUser.full_name,
          targetRole: targetRoleName,
          previousStatus: targetUser.is_active,
          newStatus: isActive,
        },
        true
      );

      return successResponse(
        res,
        { userId, isActive, userName: targetUser.full_name },
        `User "${targetUser.full_name}" ${isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error: any) {
      return errorResponse(res, 500, 'Internal server error: ' + error.message);
    }
  }

  // POST /api/admin/users?action=toggle-submit - Toggle user can_submit (superadmin only)
  if (req.method === 'POST' && actionParam === 'toggle-submit') {
    const auth = await validateAuth(req, 100); // Superadmin only

    if (!auth || !supabase) {
      return errorResponse(res, 403, 'Forbidden: Superadmin access required');
    }

    const { userId, canSubmit } = req.body;

    if (!userId || typeof canSubmit !== 'boolean') {
      return errorResponse(res, 400, 'Missing or invalid fields: userId (string) and canSubmit (boolean) required');
    }

    try {
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, can_submit')
        .eq('id', userId)
        .single();

      if (userError || !targetUser) {
        return errorResponse(res, 404, 'User not found');
      }

      if (targetUser.can_submit === canSubmit) {
        return successResponse(
          res,
          { userId, canSubmit, unchanged: true },
          `User submit status is already ${canSubmit ? 'enabled' : 'disabled'}`
        );
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          can_submit: canSubmit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      await createAuditLog(
        auth.userId,
        'TOGGLE_SUBMIT',
        'user',
        userId,
        {
          targetUserEmail: targetUser.email,
          targetUserName: targetUser.full_name,
          previousStatus: targetUser.can_submit,
          newStatus: canSubmit,
        },
        true
      );

      return successResponse(
        res,
        { userId, canSubmit, userName: targetUser.full_name },
        `Submit ${canSubmit ? 'enabled' : 'disabled'} for "${targetUser.full_name}"`
      );
    } catch (error: any) {
      return errorResponse(res, 500, 'Internal server error: ' + error.message);
    }
  }

  // POST /api/admin/users?action=block-all-submit - Block ALL users except superadmin (superadmin only)
  if (req.method === 'POST' && actionParam === 'block-all-submit') {
    const auth = await validateAuth(req, 100); // Superadmin only

    if (!auth || !supabase) {
      return errorResponse(res, 403, 'Forbidden: Superadmin access required');
    }

    try {
      // Get superadmin email to preserve
      const { data: superadminUser, error: superadminError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', auth.userId)
        .single();

      if (superadminError || !superadminUser) {
        return errorResponse(res, 404, 'Superadmin user not found');
      }

      // Block all users except current superadmin
      const { count, error: updateError } = await supabase
        .from('users')
        .update({ can_submit: false, updated_at: new Date().toISOString() })
        .neq('id', auth.userId)
        .select('id', { count: 'exact', head: true });

      if (updateError) throw updateError;

      await createAuditLog(
        auth.userId,
        'BLOCK_ALL_SUBMIT',
        'user',
        undefined,
        {
          superadminEmail: superadminUser.email,
          blockedCount: count || 0,
          action: 'block-all',
        },
        true
      );

      return successResponse(
        res,
        { blockedCount: count || 0, preservedEmail: superadminUser.email },
        `Submit diblokir untuk ${count || 0} user. Hanya superadmin yang bisa submit.`
      );
    } catch (error: any) {
      return errorResponse(res, 500, 'Internal server error: ' + error.message);
    }
  }

  // POST /api/admin/users?action=unblock-all-submit - Unblock ALL users (superadmin only)
  if (req.method === 'POST' && actionParam === 'unblock-all-submit') {
    const auth = await validateAuth(req, 100); // Superadmin only

    if (!auth || !supabase) {
      return errorResponse(res, 403, 'Forbidden: Superadmin access required');
    }

    try {
      const { count, error: updateError } = await supabase
        .from('users')
        .update({ can_submit: true, updated_at: new Date().toISOString() })
        .neq('can_submit', true)
        .select('id', { count: 'exact', head: true });

      if (updateError) throw updateError;

      await createAuditLog(
        auth.userId,
        'UNBLOCK_ALL_SUBMIT',
        'user',
        undefined,
        {
          unblockedCount: count || 0,
          action: 'unblock-all',
        },
        true
      );

      return successResponse(
        res,
        { unblockedCount: count || 0 },
        `Submit diaktifkan kembali untuk ${count || 0} user.`
      );
    } catch (error: any) {
      return errorResponse(res, 500, 'Internal server error: ' + error.message);
    }
  }

  // POST /api/admin/users?action=update-org - Assign user to organization (superadmin only)
  if (req.method === 'POST' && actionParam === 'update-org') {
    const auth = await validateAuth(req, 100);

    if (!auth || !supabase) {
      return errorResponse(res, 403, 'Forbidden: Superadmin access required');
    }

    const { userId, organizationId } = req.body;

    if (!userId) {
      return errorResponse(res, 400, 'Missing required field: userId');
    }

    try {
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, organization_id')
        .eq('id', userId)
        .single();

      if (userError || !targetUser) {
        return errorResponse(res, 404, 'User not found');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          organization_id: organizationId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      let orgName = 'None';
      if (organizationId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', organizationId)
          .single();
        orgName = org?.name || 'Unknown';
      }

      await createAuditLog(
        auth.userId,
        'UPDATE_USER_ORG',
        'user',
        userId,
        {
          targetUserEmail: targetUser.email,
          previousOrg: targetUser.organization_id,
          newOrg: organizationId,
          orgName,
        },
        true
      );

      return successResponse(
        res,
        { userId, organizationId, orgName },
        `User "${targetUser.full_name}" assigned to "${orgName}"`
      );
    } catch (error: any) {
      return errorResponse(res, 500, 'Internal server error: ' + error.message);
    }
  }

  // POST /api/admin/users?action=update-approval - Update approval status (superadmin only)
  if (req.method === 'POST' && actionParam === 'update-approval') {
    const auth = await validateAuth(req, 100);

    if (!auth || !supabase) {
      return errorResponse(res, 403, 'Forbidden: Superadmin access required');
    }

    const { userId, approvalStatus } = req.body;

    if (!userId || !approvalStatus) {
      return errorResponse(res, 400, 'Missing required fields: userId and approvalStatus');
    }

    if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      return errorResponse(res, 400, 'Invalid approvalStatus. Must be: pending, approved, rejected');
    }

    try {
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, approval_status')
        .eq('id', userId)
        .single();

      if (userError || !targetUser) {
        return errorResponse(res, 404, 'User not found');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          approval_status: approvalStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      await createAuditLog(
        auth.userId,
        'UPDATE_APPROVAL_STATUS',
        'user',
        userId,
        {
          targetUserEmail: targetUser.email,
          previousStatus: targetUser.approval_status,
          newStatus: approvalStatus,
        },
        true
      );

      return successResponse(
        res,
        { userId, approvalStatus, userName: targetUser.full_name },
        `User "${targetUser.full_name}" status changed to "${approvalStatus}"`
      );
    } catch (error: any) {
      return errorResponse(res, 500, 'Internal server error: ' + error.message);
    }
  }

  // POST /api/admin/users?action=set-all-pending - Set all non-admin users to pending (superadmin only)
  if (req.method === 'POST' && actionParam === 'set-all-pending') {
    const auth = await validateAuth(req, 100);

    if (!auth || !supabase) {
      return errorResponse(res, 403, 'Forbidden: Superadmin access required');
    }

    try {
      // Get all admin+ user IDs to exclude
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id, roles!user_roles_role_id_fkey(level)')
        .gte('roles.level', 80);

      const adminIds = (adminRoles || [])
        .map((ur: any) => ur.user_id)
        .filter(Boolean);

      // Set all non-admin users to pending
      let query = supabase
        .from('users')
        .update({ approval_status: 'pending', updated_at: new Date().toISOString() })
        .eq('approval_status', 'approved');

      if (adminIds.length > 0) {
        query = query.not('id', 'in', `(${adminIds.join(',')})`);
      }

      const { count, error: updateError } = await query.select('id', { count: 'exact', head: true });

      if (updateError) throw updateError;

      await createAuditLog(
        auth.userId,
        'SET_ALL_PENDING',
        'user',
        undefined,
        { affectedCount: count || 0 },
        true
      );

      return successResponse(
        res,
        { affectedCount: count || 0 },
        `${count || 0} user diubah ke pending.`
      );
    } catch (error: any) {
      return errorResponse(res, 500, 'Internal server error: ' + error.message);
    }
  }

  return errorResponse(res, 405, 'Method not allowed');
}
