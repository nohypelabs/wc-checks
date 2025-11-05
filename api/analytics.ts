// api/analytics.ts - User Analytics Endpoint
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
} from './middleware/role-guard.js';

interface AnalyticsData {
  totalInspections: number;
  avgScore: number;
  scoreChange: number;
  countChange: number;
  dailyTrend: Array<{ date: string; count: number; avgScore: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
  peakHour: { hour: number; count: number } | null;
  locationPerformance: Array<{
    id: string;
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    count: number;
    trend: number;
  }>;
  scoreRanges: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  topPerformer: {
    id: string;
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    count: number;
    trend: number;
  } | null;
  needsAttention: Array<{
    id: string;
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    count: number;
    trend: number;
  }>;
}

/**
 * GET /api/analytics?period=week|month|year&userId=xxx
 *
 * Retrieves analytics for inspections
 *
 * Query params:
 * - period: 'week' | 'month' | 'year' (required)
 * - userId: string (optional - admin only)
 *
 * Authorization:
 * - Regular users: can only fetch their own analytics
 * - Admin (level 80+): can fetch any user's analytics or all users
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  // Validate authentication
  const auth = await validateAuth(req, 0);

  if (!auth || !supabase) {
    console.error('[analytics] Auth failed or Supabase not initialized');
    return errorResponse(res, 401, 'Unauthorized');
  }

  const currentUserId = auth.userId;
  const isAdmin = auth.userRole.level >= 80;

  // Parse query params
  const { period = 'week', userId: userIdParam } = req.query;
  const periodStr = Array.isArray(period) ? period[0] : period;
  const userIdStr = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

  console.log('[analytics] Request:', {
    currentUserId,
    isAdmin,
    period: periodStr,
    requestedUserId: userIdStr || 'ALL',
  });

  // Validate period
  if (!['week', 'month', 'year'].includes(periodStr)) {
    return errorResponse(res, 400, 'Invalid period. Must be week, month, or year');
  }

  // Determine target user
  let targetUserId: string | undefined;

  if (!isAdmin) {
    // Regular user can only see their own data
    targetUserId = currentUserId;
    console.log('[analytics] Regular user - filtering to own data only');
  } else if (userIdStr) {
    // Admin requesting specific user
    targetUserId = userIdStr;
    console.log('[analytics] Admin - fetching specific user data:', userIdStr);
  } else {
    // Admin requesting all users
    targetUserId = undefined;
    console.log('[analytics] Admin - fetching ALL users data');
  }

  try {
    // Calculate date range
    const now = new Date();
    let startDate: string;
    let endDate: string = now.toISOString().split('T')[0];

    switch (periodStr) {
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }

    console.log('[analytics] Date range:', { startDate, endDate });

    // Build query
    let query = supabase
      .from('inspection_records')
      .select(`
        id,
        inspection_date,
        inspection_time,
        responses,
        location_id,
        user_id,
        locations (
          id,
          name,
          building,
          floor
        )
      `)
      .gte('inspection_date', startDate)
      .lte('inspection_date', endDate)
      .order('inspection_date', { ascending: true });

    // Filter by user if specified
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: inspections, error: fetchError } = await query;

    if (fetchError) {
      console.error('[analytics] Query error:', fetchError);
      throw fetchError;
    }

    console.log('[analytics] Fetched inspections:', inspections?.length || 0);

    // Score calculation function
    const calculateScore = (responses: any): number => {
      try {
        if (!responses || typeof responses !== 'object') return 0;

        const values = Object.values(responses);
        if (values.length === 0) return 0;

        const goodCount = values.filter(v => {
          if (typeof v === 'boolean') return v;
          if (typeof v === 'string') {
            const lowerVal = v.toLowerCase().trim();
            return ['good', 'excellent', 'baik', 'bersih', 'ada', 'yes', 'true', 'ok', 'lengkap'].includes(lowerVal);
          }
          if (typeof v === 'number') return v > 0;
          return false;
        }).length;

        return Math.round((goodCount / values.length) * 100);
      } catch (error) {
        console.warn('Error calculating score:', error);
        return 0;
      }
    };

    // Daily trend calculation
    const dailyMap = new Map<string, { count: number; totalScore: number }>();
    inspections?.forEach(insp => {
      try {
        const date = insp.inspection_date;
        const score = calculateScore(insp.responses);
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { count: 0, totalScore: 0 });
        }
        const data = dailyMap.get(date)!;
        data.count++;
        data.totalScore += score;
      } catch (error) {
        console.warn('Error processing inspection for daily trend:', error);
      }
    });

    const dailyTrend = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0
    }));

    // Hourly distribution
    const hourlyMap = new Map<number, number>();
    inspections?.forEach(insp => {
      try {
        if (insp.inspection_time && typeof insp.inspection_time === 'string') {
          const timeParts = insp.inspection_time.split(':');
          if (timeParts.length > 0) {
            const hourStr = timeParts[0];
            const hour = parseInt(hourStr);
            if (!isNaN(hour) && hour >= 0 && hour <= 23) {
              hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
            }
          }
        }
      } catch (error) {
        console.warn('Error processing inspection time:', error);
      }
    });

    const hourlyDistribution = Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    // Peak hour
    const peakHour = hourlyDistribution.length > 0
      ? hourlyDistribution.reduce((max, curr) => curr.count > max.count ? curr : max)
      : null;

    // Location performance
    const locationMap = new Map<string, {
      name: string;
      scores: number[];
      building?: string;
      floor?: string;
      count: number;
    }>();

    inspections?.forEach(insp => {
      try {
        if (!insp.locations) return;
        const locId = insp.location_id;
        const score = calculateScore(insp.responses);

        if (!locationMap.has(locId)) {
          locationMap.set(locId, {
            name: insp.locations.name || 'Unknown Location',
            building: insp.locations.building || undefined,
            floor: insp.locations.floor || undefined,
            scores: [],
            count: 0
          });
        }
        const locationData = locationMap.get(locId)!;
        locationData.scores.push(score);
        locationData.count++;
      } catch (error) {
        console.warn('Error processing location performance:', error);
      }
    });

    const locationPerformance = Array.from(locationMap.entries())
      .map(([id, data]) => {
        const avgScore = data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0;

        const trend = data.scores.length >= 2
          ? data.scores[data.scores.length - 1] - data.scores[0]
          : 0;

        return {
          id,
          name: data.name,
          building: data.building,
          floor: data.floor,
          avgScore,
          count: data.count,
          trend
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);

    // Score distribution
    const scoreRanges = {
      excellent: 0, // 85-100
      good: 0,      // 70-84
      fair: 0,      // 50-69
      poor: 0       // 0-49
    };

    inspections?.forEach(insp => {
      try {
        const score = calculateScore(insp.responses);
        if (score >= 85) scoreRanges.excellent++;
        else if (score >= 70) scoreRanges.good++;
        else if (score >= 50) scoreRanges.fair++;
        else scoreRanges.poor++;
      } catch (error) {
        console.warn('Error calculating score range:', error);
      }
    });

    // Overall stats
    const totalInspections = inspections?.length || 0;
    const avgScore = totalInspections > 0
      ? Math.round(inspections!.reduce((sum, i) => sum + calculateScore(i.responses), 0) / totalInspections)
      : 0;

    // Previous period comparison
    let prevStart: string;
    let prevEnd: string;

    try {
      switch (periodStr) {
        case 'week':
          const prevWeekStart = new Date(now);
          prevWeekStart.setDate(now.getDate() - now.getDay() - 7);
          prevStart = prevWeekStart.toISOString().split('T')[0];
          const prevWeekEnd = new Date(prevWeekStart);
          prevWeekEnd.setDate(prevWeekStart.getDate() + 6);
          prevEnd = prevWeekEnd.toISOString().split('T')[0];
          break;
        case 'month':
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          prevStart = prevMonth.toISOString().split('T')[0];
          const prevMonthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
          prevEnd = prevMonthEnd.toISOString().split('T')[0];
          break;
        case 'year':
          prevStart = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
          prevEnd = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
          break;
        default:
          prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
          prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      }

      let prevQuery = supabase
        .from('inspection_records')
        .select('id, responses')
        .gte('inspection_date', prevStart)
        .lte('inspection_date', prevEnd);

      if (targetUserId) {
        prevQuery = prevQuery.eq('user_id', targetUserId);
      }

      const { data: prevInspections } = await prevQuery;

      const prevTotalInspections = prevInspections?.length || 0;
      const prevAvgScore = prevTotalInspections > 0
        ? Math.round(prevInspections!.reduce((sum, i) => sum + calculateScore(i.responses), 0) / prevTotalInspections)
        : 0;

      const scoreChange = avgScore - prevAvgScore;
      const countChange = totalInspections - prevTotalInspections;

      const analyticsData: AnalyticsData = {
        totalInspections,
        avgScore,
        scoreChange,
        countChange,
        dailyTrend,
        hourlyDistribution,
        peakHour,
        locationPerformance,
        scoreRanges,
        topPerformer: locationPerformance[0] || null,
        needsAttention: locationPerformance.filter(l => l.avgScore < 70)
      };

      console.log('[analytics] Success - returning analytics data');
      return successResponse(res, analyticsData, 'Analytics retrieved successfully');

    } catch (comparisonError) {
      console.warn('Error calculating period comparison:', comparisonError);
      // Return data without comparison if there's an error
      const analyticsData: AnalyticsData = {
        totalInspections,
        avgScore,
        scoreChange: 0,
        countChange: 0,
        dailyTrend,
        hourlyDistribution,
        peakHour,
        locationPerformance,
        scoreRanges,
        topPerformer: locationPerformance[0] || null,
        needsAttention: locationPerformance.filter(l => l.avgScore < 70)
      };

      console.log('[analytics] Success - returning analytics data (without comparison)');
      return successResponse(res, analyticsData, 'Analytics retrieved successfully');
    }

  } catch (error: any) {
    console.error('[analytics] Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve analytics: ' + error.message);
  }
}
