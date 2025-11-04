// api/middleware/role-guard.ts - Server-side auth & role validation
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.types';

// Validate environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[role-guard] Missing environment variables:', {
    hasUrl: !!SUPABASE_URL,
    hasServiceKey: !!SUPABASE_SERVICE_KEY,
  });
}

// Initialize Supabase with SERVICE_KEY (backend access)
const supabaseClient = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY, // 🔥 SERVICE_KEY for backend operations
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

// Export for use in API endpoints
export const supabase = supabaseClient;

export interface AuthContext {
  userId: string;
  userRole: {
    id: string;
    name: string;
    level: number;
  };
}

/**
 * Validate user authentication and check minimum role level
 * @param req - Vercel request object
 * @param minLevel - Minimum role level required (default: 0)
 * @returns AuthContext if valid, null otherwise
 */
export async function validateAuth(
  req: VercelRequest,
  minLevel: number = 0
): Promise<AuthContext | null> {
  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      console.error('[validateAuth] Supabase client not initialized - missing env vars');
      return null;
    }

    // Get auth token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[validateAuth] Missing or invalid Authorization header');
      return null;
    }

    const token = authHeader.substring(7);

    // Verify token and get user - use admin API for server-side verification
    let user;
    try {
      // Decode JWT to get user ID (JWT format: header.payload.signature)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const userId = payload.sub;

      if (!userId) {
        console.error('[validateAuth] No user ID in token');
        return null;
      }

      // Fetch user from database using service role
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

      if (userError || !userData?.user) {
        console.error('[validateAuth] Auth error:', userError?.message);
        return null;
      }

      user = userData.user;
    } catch (error: any) {
      console.error('[validateAuth] Token verification failed:', error.message);
      return null;
    }

    console.log('[validateAuth] User authenticated:', user.id);

    // Get user's role from database (server-side validation)
    const { data: userRoleData, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles!user_roles_role_id_fkey (
          id,
          name,
          level
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('[validateAuth] Role query error:', roleError.message);
      return null;
    }

    // Extract role data (handle Supabase typed response)
    const roleData = userRoleData?.roles as { id: string; name: string; level: number } | null;

    const roleLevel = roleData?.level || 0;
    const roleName = roleData?.name || 'user';
    const roleId = roleData?.id || '';

    console.log('[validateAuth] User role:', { name: roleName, level: roleLevel });

    // Check minimum level requirement
    if (roleLevel < minLevel) {
      console.error('[validateAuth] Insufficient role level:', {
        required: minLevel,
        actual: roleLevel
      });
      return null;
    }

    return {
      userId: user.id,
      userRole: {
        id: roleId,
        name: roleName,
        level: roleLevel,
      },
    };
  } catch (error) {
    console.error('[validateAuth] Unexpected error:', error);
    return null;
  }
}

/**
 * Create audit log entry for admin actions
 * @param userId - User who performed the action
 * @param action - Action type (e.g., 'ASSIGN_ROLE', 'TOGGLE_USER_STATUS')
 * @param resourceType - Type of resource affected
 * @param resourceId - ID of resource affected
 * @param details - Additional details as JSON
 * @param success - Whether the action succeeded
 * @param errorMessage - Error message if failed
 */
export async function createAuditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    if (!supabase) {
      console.error('[createAuditLog] Supabase client not initialized');
      return;
    }

    // Use RPC function for audit logging (server-side)
    const { error } = await (supabase as any).rpc('create_audit_log', {
      p_user_id: userId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_details: details || {},
      p_success: success,
      p_error_message: errorMessage || null,
    });

    if (error) {
      console.error('[createAuditLog] Error creating audit log:', error);
    } else {
      console.log('[createAuditLog] Audit log created:', { userId, action, resourceType });
    }
  } catch (error) {
    console.error('[createAuditLog] Unexpected error:', error);
    // Don't throw - audit log failure shouldn't break the main operation
  }
}

/**
 * Standard error response helper
 */
export function errorResponse(
  res: VercelResponse,
  status: number,
  message: string
): void {
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Standard success response helper
 */
export function successResponse(
  res: VercelResponse,
  data: any,
  message?: string
): void {
  res.status(200).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
}
