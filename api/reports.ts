// api/reports.ts - Inspection reports for users and admins
import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, supabase, successResponse, errorResponse } from './middleware/role-guard.js';

// ===== ANALYTICS TYPES =====
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

interface InspectionRecord {
  id: string;
  inspection_date: string;
  inspection_time: string;
  responses: any;
  location_id: string;
  user_id: string;
  locations: {
    id: string;
    name: string;
    building?: string;
    floor?: string;
  } | null;
}

// Score calculation helper
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
    console.warn('[analytics] Error calculating score:', error);
    return 0;
  }
};

// Analytics handler function
async function handleAnalytics(
  req: VercelRequest,
  res: VercelResponse,
  auth: any,
  isAdmin: boolean,
  currentUserId: string,
  targetUserId: string | undefined,
  periodStr: string | undefined
): Promise<VercelResponse> {
  if (!supabase) {
    return errorResponse(res, 500, 'Database not initialized');
  }

  // Validate period
  if (!periodStr || !['week', 'month', 'year'].includes(periodStr)) {
    return errorResponse(res, 400, 'Invalid period. Must be week, month, or year');
  }

  console.log('[analytics] Request:', {
    currentUserId,
    isAdmin,
    period: periodStr,
    targetUserId: targetUserId || 'ALL',
  });

  try {
    // Calculate date range
    const now = new Date();
    let startDate: string;
    const endDate: string = now.toISOString().split('T')[0];

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

    const records = inspections as InspectionRecord[] || [];

    // Daily trend calculation
    const dailyMap = new Map<string, { count: number; totalScore: number }>();
    records.forEach((insp: InspectionRecord) => {
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
        console.warn('[analytics] Error processing inspection for daily trend:', error);
      }
    });

    const dailyTrend = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0
    }));

    // Hourly distribution
    const hourlyMap = new Map<number, number>();
    records.forEach((insp: InspectionRecord) => {
      try {
        if (insp.inspection_time && typeof insp.inspection_time === 'string') {
          const timeParts = insp.inspection_time.split(':');
          if (timeParts.length > 0) {
            const hour = parseInt(timeParts[0]);
            if (!isNaN(hour) && hour >= 0 && hour <= 23) {
              hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
            }
          }
        }
      } catch (error) {
        console.warn('[analytics] Error processing inspection time:', error);
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

    records.forEach((insp: InspectionRecord) => {
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
        console.warn('[analytics] Error processing location performance:', error);
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
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    records.forEach((insp: InspectionRecord) => {
      try {
        const score = calculateScore(insp.responses);
        if (score >= 85) scoreRanges.excellent++;
        else if (score >= 70) scoreRanges.good++;
        else if (score >= 50) scoreRanges.fair++;
        else scoreRanges.poor++;
      } catch (error) {
        console.warn('[analytics] Error calculating score range:', error);
      }
    });

    // Overall stats
    const totalInspections = records.length;
    const avgScore = totalInspections > 0
      ? Math.round(records.reduce((sum: number, i: InspectionRecord) => sum + calculateScore(i.responses), 0) / totalInspections)
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
      const prevRecords = prevInspections as InspectionRecord[] || [];

      const prevTotalInspections = prevRecords.length;
      const prevAvgScore = prevTotalInspections > 0
        ? Math.round(prevRecords.reduce((sum: number, i: InspectionRecord) => sum + calculateScore(i.responses), 0) / prevTotalInspections)
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
      console.warn('[analytics] Error calculating period comparison:', comparisonError);
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

/**
 * GET /api/reports?month=yyyy-MM - Get monthly inspections
 * GET /api/reports?date=yyyy-MM-dd - Get inspections for specific date
 * GET /api/reports?userId=xxx&month=yyyy-MM - Admin: Get specific user's monthly inspections
 * GET /api/reports?analytics=true&period=week|month|year - Get analytics data
 *
 * Requirements:
 * - Authenticated user (level 0+)
 * - Regular users: see only their own inspections
 * - Admin+ (level 80+): see all inspections (can filter by userId)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only GET allowed
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  const auth = await validateAuth(req, 0); // Any authenticated user

  if (!auth || !supabase) {
    return errorResponse(res, 401, 'Authentication required');
  }

  const { month, date, userId, analytics, period } = req.query;
  const monthStr = Array.isArray(month) ? month[0] : month;
  const dateStr = Array.isArray(date) ? date[0] : date;
  const userIdStr = Array.isArray(userId) ? userId[0] : userId;
  const analyticsStr = Array.isArray(analytics) ? analytics[0] : analytics;
  const periodStr = Array.isArray(period) ? period[0] : period;

  const isAdmin = auth.userRole.level >= 80;
  const currentUserId = auth.userId;

  // 🔍 DEBUG: Log auth details with detailed role check
  console.log('[reports] 🔐 Auth details:', {
    userId: currentUserId,
    role: auth.userRole.name,
    level: auth.userRole.level,
    'level >= 80': auth.userRole.level >= 80,
    isAdmin,
    monthParam: monthStr,
    dateParam: dateStr,
    userIdParam: userIdStr,
  });

  // 🔍 DEBUG: Extra check for level 80 specifically
  if (auth.userRole.level === 80) {
    console.log('[reports] 🎯 LEVEL 80 USER DETECTED:', {
      userId: currentUserId,
      role: auth.userRole.name,
      level: auth.userRole.level,
      isAdmin,
      shouldSeeAllData: isAdmin,
    });
  }

  try {
    // Determine which user's data to fetch
    let targetUserId: string | undefined = undefined;

    if (!isAdmin) {
      // Non-admin: ALWAYS filter to their own data
      targetUserId = currentUserId;
      console.log(`[reports] ❌ Non-admin user ${currentUserId} (level ${auth.userRole.level}) - filtering to own data`);
    } else if (userIdStr) {
      // Admin with userId param: filter to specific user
      targetUserId = userIdStr;
      console.log(`[reports] ✅ Admin ${currentUserId} (level ${auth.userRole.level}) requesting data for user ${targetUserId}`);
    } else {
      // Admin without userId param: get ALL users' data
      targetUserId = undefined;
      console.log(`[reports] ✅ Admin ${currentUserId} (level ${auth.userRole.level}) requesting ALL users' data`);
    }

    // 🔍 DEBUG: Show final decision
    console.log('[reports] 📊 Final filter decision:', {
      isAdmin,
      level: auth.userRole.level,
      targetUserId: targetUserId || 'NONE (fetching ALL users)',
      willFetchAllUsers: targetUserId === undefined,
    });

    // Security check: prevent non-admin from requesting other user's data
    if (!isAdmin && userIdStr && userIdStr !== currentUserId) {
      return errorResponse(res, 403, 'Access denied - you can only view your own data');
    }

    // ===== ANALYTICS MODE =====
    if (analyticsStr === 'true') {
      return handleAnalytics(req, res, auth, isAdmin, currentUserId, targetUserId, periodStr);
    }

    // ===== REPORTS MODE (existing logic) =====

    // Build base query
    let query = supabase
      .from('inspection_records')
      .select(`
        id,
        inspection_date,
        inspection_time,
        overall_status,
        responses,
        photo_urls,
        notes,
        location:locations!inner(id, name, building, floor),
        user:users!inspection_records_user_id_fkey(
          id,
          full_name,
          email,
          occupation_id,
          occupation:user_occupations(id, display_name, description, color, icon)
        )
      `)
      .order('inspection_date', { ascending: false })
      .order('inspection_time', { ascending: false });

    // Apply user filter if targetUserId is set
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }
    // else: no filter = ALL users (admin only)

    // Filter by month or date
    if (monthStr) {
      // Month format: yyyy-MM
      const [year, monthNum] = monthStr.split('-');
      const startDate = `${year}-${monthNum}-01`;

      // Calculate last day of month
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`;

      console.log(`[reports] Filtering by month: ${startDate} to ${endDate}`);
      query = query.gte('inspection_date', startDate).lte('inspection_date', endDate);
    } else if (dateStr) {
      // Specific date: yyyy-MM-dd
      console.log(`[reports] Filtering by date: ${dateStr}`);
      query = query.eq('inspection_date', dateStr);
    } else {
      return errorResponse(res, 400, 'Missing required parameter: month or date');
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('[reports] Error fetching inspections:', error);
      throw error;
    }

    // 🔍 DEBUG: Show what we fetched
    const uniqueUserIds = [...new Set((data || []).map((item: any) => item.user?.id))].filter(Boolean);
    console.log(`[reports] ✅ Fetched ${data?.length || 0} inspections from ${uniqueUserIds.length} unique users:`, uniqueUserIds);
    console.log(`[reports] 📊 Applied filter: targetUserId=${targetUserId || 'NONE (ALL users)'}, isAdmin=${isAdmin}`);

    // Transform data to match frontend format
    const inspections = (data || []).map((item: any) => ({
      id: item.id,
      inspection_date: item.inspection_date,
      inspection_time: item.inspection_time,
      overall_status: item.overall_status,
      responses: item.responses,
      location: item.location,
      user: {
        id: item.user.id,
        full_name: item.user.full_name,
        email: item.user.email,
        occupation_id: item.user.occupation_id,
      },
      occupation: item.user.occupation || null,
      photo_urls: item.photo_urls || [],
      notes: item.notes,
    }));

    // Group by date if fetching monthly data
    if (monthStr) {
      const groupedByDate: Record<string, any[]> = {};

      inspections.forEach((inspection: any) => {
        const date = inspection.inspection_date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = [];
        }
        groupedByDate[date].push(inspection);
      });

      // Calculate average score per date
      const dateInspections = Object.entries(groupedByDate).map(([date, inspList]) => {
        // Calculate scores
        const scores = inspList.map(ins => {
          const responses = ins.responses;
          if (!responses) return 0;

          // Direct score field
          if (typeof responses.score === 'number') {
            return responses.score;
          }

          // Calculate from ratings array
          if (Array.isArray(responses.ratings) && responses.ratings.length > 0) {
            const totalWeight = responses.ratings.reduce((sum: number, r: any) => sum + (r.weight || 1), 0);
            const weightedSum = responses.ratings.reduce((sum: number, r: any) => {
              const score = r.score || 0;
              const weight = r.weight || 1;
              return sum + (score * weight);
            }, 0);
            return Math.round(weightedSum / totalWeight);
          }

          // Old format - count good responses
          const values = Object.values(responses).filter(v =>
            typeof v === 'string' || typeof v === 'boolean'
          );

          if (values.length === 0) return 0;

          const goodCount = values.filter(v =>
            v === true ||
            v === 'good' ||
            v === 'excellent' ||
            v === 'baik' ||
            v === 'bersih'
          ).length;

          return Math.round((goodCount / values.length) * 100);
        });

        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        return {
          date,
          inspections: inspList,
          averageScore,
          count: inspList.length,
        };
      });

      return successResponse(res, dateInspections, 'Monthly inspections retrieved');
    } else {
      // Return inspections for specific date
      return successResponse(res, inspections, 'Date inspections retrieved');
    }

  } catch (error: any) {
    console.error('[reports] Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve reports: ' + error.message);
  }
}
