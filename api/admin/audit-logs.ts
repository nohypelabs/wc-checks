// api/admin/audit-logs.ts - View audit logs (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
} from '../middleware/role-guard';

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
    return res.status(405).json(errorResponse('Method not allowed'));
  }

  // Validate authentication and require admin (level 80+)
  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    console.error('[audit-logs] Auth failed or Supabase not initialized');
    return res.status(403).json(errorResponse('Access denied - Admin privileges required'));
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

    // Validate limit
    const parsedLimit = Math.min(parseInt(limit as string, 10) || 50, 500);

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parsedLimit);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (success !== undefined) {
      const isSuccess = success === 'true' || success === true;
      query = query.eq('success', isSuccess);
    }

    if (since) {
      query = query.gte('created_at', since);
    }

    // Execute query
    const { data: logs, error } = await query;

    if (error) {
      console.error('[audit-logs] Error fetching audit logs:', error);
      throw error;
    }

    console.log('[audit-logs] Success - returning', logs?.length || 0, 'audit logs');

    return res.status(200).json(
      successResponse(
        {
          logs: logs || [],
          count: logs?.length || 0,
          filters: {
            limit: parsedLimit,
            userId: userId || null,
            action: action || null,
            success: success !== undefined ? (success === 'true' || success === true) : null,
            since: since || null,
          },
        },
        'Audit logs retrieved successfully'
      )
    );
  } catch (error: any) {
    console.error('[audit-logs] Error:', error);
    return res.status(500).json(errorResponse('Failed to retrieve audit logs: ' + error.message));
  }
}
