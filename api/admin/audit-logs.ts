// api/admin/audit-logs.ts - View audit logs (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
} from '../middleware/role-guard.js';

/**
 * GET /api/admin/audit-logs
 *
 * Retrieves audit logs with optional filters
 *
 * Query Parameters:
 * - limit: Number of records to return (default: 50, max: 500)
 * - userId: Filter by specific user ID
 * - action: Filter by action type
 * - success: Filter by success status (true/false)
 * - since: ISO timestamp - only logs after this time
 *
 * Requirements:
 * - User must be level 80+ (admin or above)
 *
 * Security:
 * - Validates requester is admin+
 * - Uses backend service key for reliable access
 * - Returns audit trail for compliance
 *
 * Examples:
 * - GET /api/admin/audit-logs?limit=100
 * - GET /api/admin/audit-logs?userId=xxx&action=assign_role
 * - GET /api/admin/audit-logs?success=false
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  // Validate authentication and require admin (level 80+)
  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    console.error('[audit-logs] Auth failed or Supabase not initialized');
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  console.log('[audit-logs] Admin access granted:', {
    userId: auth.userId,
    role: auth.userRole.name,
    level: auth.userRole.level,
  });

  try {
    // Parse query parameters
    const {
      limit = '50',
      userId,
      action,
      success,
      since,
    } = req.query;

    // Convert query params to strings
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;
    const actionStr = Array.isArray(action) ? action[0] : action;
    const sinceStr = Array.isArray(since) ? since[0] : since;
    const limitStr = Array.isArray(limit) ? limit[0] : limit;

    // Validate limit
    const parsedLimit = Math.min(parseInt(limitStr, 10) || 50, 500);

    // Build query (cast to any to bypass type checking for audit_logs table)
    let query = (supabase as any)
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parsedLimit);

    // Apply filters
    if (userIdStr) {
      query = query.eq('user_id', userIdStr);
    }

    if (actionStr) {
      query = query.eq('action', actionStr);
    }

    if (success !== undefined) {
      const successValue = Array.isArray(success) ? success[0] : success;
      const isSuccess = typeof successValue === 'string' ? successValue === 'true' : Boolean(successValue);
      query = query.eq('success', isSuccess);
    }

    if (sinceStr) {
      query = query.gte('created_at', sinceStr);
    }

    // Execute query
    const { data: logs, error } = await query;

    if (error) {
      console.error('[audit-logs] Error fetching audit logs:', error);
      throw error;
    }

    console.log('[audit-logs] Success - returning', logs?.length || 0, 'audit logs');

    return successResponse(
      res,
      {
        logs: logs || [],
        count: logs?.length || 0,
        filters: {
          limit: parsedLimit,
          userId: userIdStr || null,
          action: actionStr || null,
          success: success !== undefined ? (typeof (Array.isArray(success) ? success[0] : success) === 'string' ? (Array.isArray(success) ? success[0] : success) === 'true' : Boolean(Array.isArray(success) ? success[0] : success)) : null,
          since: sinceStr || null,
        },
      },
      'Audit logs retrieved successfully'
    );
  } catch (error: any) {
    console.error('[audit-logs] Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve audit logs: ' + error.message);
  }
}
