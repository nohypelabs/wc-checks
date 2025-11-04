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

    // Decode JWT to get user ID and verify token
    let userId: string;
    try {
      // JWT format: header.payload.signature
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;

      if (!userId) {
        console.error('[validateAuth] No user ID in token');
        return null;
      }

      // Check token expiration
      const exp = payload.exp;
      if (exp && Date.now() >= exp * 1000) {
        console.error('[validateAuth] Token expired');
        return null;
      }
    } catch (error: any) {
      console.error('[validateAuth] Token decode failed:', error.message);
      return null;
    }

    // Verify user exists in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, is_active')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[validateAuth] User not found:', userError?.message);
      return null;
    }

    if (!user.is_active) {
      console.error('[validateAuth] User is not active');
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
      console.warn('[createAuditLog] Supabase client not initialized - skipping audit log');
      return;
    }

    // Try using RPC function first
    const { error: rpcError } = await (supabase as any).rpc('create_audit_log', {
      p_user_id: userId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_details: details || {},
      p_success: success,
      p_error_message: errorMessage || null,
    });

    if (rpcError) {
      // If RPC function doesn't exist, try direct insert as fallback
      if (rpcError.code === 'PGRST202' || rpcError.message?.includes('Could not find')) {
        console.warn('[createAuditLog] RPC function not found - trying direct insert');

        const { error: insertError } = await (supabase as any)
          .from('audit_logs')
          .insert({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId || null,
            details: details || {},
            success,
            error_message: errorMessage || null,
          });

        if (insertError) {
          console.warn('[createAuditLog] Direct insert also failed - audit logging disabled:', insertError.message);
        } else {
          console.log('[createAuditLog] Audit log created via direct insert:', { userId, action, resourceType });
        }
      } else {
        console.warn('[createAuditLog] Error creating audit log:', rpcError.message);
      }
    } else {
      console.log('[createAuditLog] Audit log created via RPC:', { userId, action, resourceType });
    }
  } catch (error: any) {
    // Silently fail - audit log failure shouldn't break the main operation
    console.warn('[createAuditLog] Audit logging skipped:', error.message);
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
