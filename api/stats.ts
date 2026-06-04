// api/stats.ts - Dashboard Statistics (ALL AUTHENTICATED USERS)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
} from './middleware/role-guard.js';

interface DashboardStats {
  totalUsers: number;
  totalLocations: number;
  totalInspections: number;
  todayInspections: number;
  inspections7d: number;
  inspections30d: number;
  activeUsers: number;
  avgScore: number;
  userGrowth: number;
  inspectionGrowth: number;
  dailyTrend: Array<{ date: string; count: number }>;
}

/**
 * GET /api/stats
 *
 * Retrieves comprehensive dashboard statistics
 *
 * Requirements:
 * - User must be authenticated (any role)
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

  // Validate authentication (level 0 = any authenticated user)
  const auth = await validateAuth(req, 0);

  if (!auth || !supabase) {
    console.error('[stats] Auth failed or Supabase not initialized');
    return errorResponse(res, 401, 'Authentication required');
  }

  console.log('[stats] Access granted:', {
    userId: auth.userId,
    role: auth.userRole.name,
    level: auth.userRole.level,
  });

  try {
    // Calculate dates (UTC to match Supabase date storage)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = (() => { const d = new Date(now); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const weekAgo = (() => { const d = new Date(now); d.setDate(d.getDate() - 7); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const monthAgo = (() => { const d = new Date(now); d.setDate(d.getDate() - 30); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

    console.log('[stats] Date filters:', { today, yesterday, weekAgo, monthAgo });

    // Trend period (supports ?days=7, 30, 90, or default 30)
    const trendDays = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const trendStartDate = (() => { const d = new Date(now); d.setDate(d.getDate() - trendDays); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

    // Parallel queries for better performance
    const [
      usersCount,
      locationsCount,
      inspectionsCount,
      todayInspectionsCount,
      yesterdayInspectionsCount,
      inspections7dCount,
      inspections30dCount,
      activeUsersCount,
      recentInspections,
      dailyTrendData,
    ] = await Promise.all([
      // Total active users
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Total active locations
      supabase
        .from('locations')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Total inspections
      supabase
        .from('inspection_records')
        .select('id', { count: 'exact', head: true }),

      // Today's inspections
      supabase
        .from('inspection_records')
        .select('id', { count: 'exact', head: true })
        .eq('inspection_date', today),

      // Yesterday's inspections
      supabase
        .from('inspection_records')
        .select('id', { count: 'exact', head: true })
        .eq('inspection_date', yesterday),

      // 7-day inspections
      supabase
        .from('inspection_records')
        .select('id', { count: 'exact', head: true })
        .gte('inspection_date', weekAgo),

      // 30-day inspections
      supabase
        .from('inspection_records')
        .select('id', { count: 'exact', head: true })
        .gte('inspection_date', monthAgo),

      // Active users (logged in last 7 days)
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('last_login_at', weekAgo)
        .eq('is_active', true),

      // Recent inspections for score calculation (sample only)
      supabase
        .from('inspection_records')
        .select('responses')
        .limit(20),

      // Daily trend — configurable period
      supabase
        .from('inspection_records')
        .select('inspection_date')
        .gte('inspection_date', trendStartDate)
        .order('inspection_date', { ascending: true })
        .range(0, 9999),
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

    console.log('[stats] Query results:', {
      totalInspections: inspectionsCount.count,
      today: todayCount,
      yesterday: yesterdayCount,
      '7d': inspections7dCount.count,
      '30d': inspections30dCount.count,
      '7d_error': inspections7dCount.error?.message,
      '30d_error': inspections30dCount.error?.message,
    });
    const inspectionGrowth =
      yesterdayCount > 0
        ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)
        : 0;

    // Aggregate daily trend
    const trendMap = new Map<string, number>();
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      trendMap.set(key, 0);
    }
    (dailyTrendData.data || []).forEach((row: any) => {
      const date = row.inspection_date;
      if (trendMap.has(date)) {
        trendMap.set(date, (trendMap.get(date) || 0) + 1);
      }
    });
    const dailyTrend = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));

    const stats: DashboardStats = {
      totalUsers: usersCount.count || 0,
      totalLocations: locationsCount.count || 0,
      totalInspections: inspectionsCount.count || 0,
      todayInspections: todayCount,
      inspections7d: inspections7dCount.count || 0,
      inspections30d: inspections30dCount.count || 0,
      activeUsers: activeUsersCount.count || 0,
      avgScore,
      userGrowth: 0,
      inspectionGrowth,
      dailyTrend,
    };

    console.log('[stats] Success - returning dashboard statistics for user:', auth.userId);

    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error: any) {
    console.error('[stats] Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve statistics: ' + error.message);
  }
}
