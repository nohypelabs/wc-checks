// api/admin/stats.ts - Admin Dashboard Statistics (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
} from '../middleware/role-guard.js';

interface AdminStats {
  totalUsers: number;
  totalLocations: number;
  totalInspections: number;
  todayInspections: number;
  activeUsers: number;
  avgScore: number;
  userGrowth: number;
  inspectionGrowth: number;
}

/**
 * GET /api/admin/stats
 *
 * Retrieves comprehensive admin dashboard statistics
 *
 * Requirements:
 * - User must be level 80+ (admin or above)
 *
 * Response:
 * {
 *   totalUsers: number,
 *   totalLocations: number,
 *   totalInspections: number,
 *   todayInspections: number,
 *   activeUsers: number (logged in last 7 days),
 *   avgScore: number (0-100),
 *   userGrowth: number (percentage),
 *   inspectionGrowth: number (percentage vs yesterday)
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  // Validate authentication and require admin (level 80+)
  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    console.error('[stats] Auth failed or Supabase not initialized');
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  console.log('[stats] Admin access granted:', {
    userId: auth.userId,
    role: auth.userRole.name,
    level: auth.userRole.level,
  });

  try {
    // Calculate dates
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Parallel queries for better performance
    const [
      usersCount,
      locationsCount,
      inspectionsCount,
      todayInspectionsCount,
      yesterdayInspectionsCount,
      activeUsersCount,
      recentInspections,
    ] = await Promise.all([
      // Total active users
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      // Total active locations
      supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      // Total inspections
      supabase
        .from('inspection_records')
        .select('*', { count: 'exact', head: true }),

      // Today's inspections
      supabase
        .from('inspection_records')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_date', today),

      // Yesterday's inspections
      supabase
        .from('inspection_records')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_date', yesterday),

      // Active users (logged in last 7 days)
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', weekAgo)
        .eq('is_active', true),

      // Recent inspections for score calculation
      supabase
        .from('inspection_records')
        .select('responses')
        .limit(100),
    ]);

    // Calculate average score
    const calculateScore = (responses: any): number => {
      const values = Object.values(responses || {});
      if (values.length === 0) return 0;
      const goodCount = values.filter((v) =>
        v === true || v === 'good' || v === 'excellent' ||
        v === 'baik' || v === 'bersih' || v === 'ada'
      ).length;
      return Math.round((goodCount / values.length) * 100);
    };

    const inspections = recentInspections.data || [];
    const avgScore = inspections.length > 0
      ? Math.round(
          inspections.reduce((sum: number, i: any) => sum + calculateScore(i.responses), 0) /
            inspections.length
        )
      : 0;

    // Calculate growth metrics
    const todayCount = todayInspectionsCount.count || 0;
    const yesterdayCount = yesterdayInspectionsCount.count || 0;
    const inspectionGrowth =
      yesterdayCount > 0
        ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
        : 0;

    const stats: AdminStats = {
      totalUsers: usersCount.count || 0,
      totalLocations: locationsCount.count || 0,
      totalInspections: inspectionsCount.count || 0,
      todayInspections: todayCount,
      activeUsers: activeUsersCount.count || 0,
      avgScore,
      userGrowth: 0, // Can be calculated with historical data
      inspectionGrowth,
    };

    console.log('[stats] Success - returning dashboard statistics');

    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error: any) {
    console.error('[stats] Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve statistics: ' + error.message);
  }
}
