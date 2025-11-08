// api/reports.ts - Inspection reports for users and admins
import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, supabase, successResponse, errorResponse } from './middleware/role-guard.js';

// ===== ANALYTICS TYPES (SIMPLIFIED) =====
interface SimpleAnalytics {
  // Overview
  totalInspections: number;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;

  // Status Breakdown
  statusBreakdown: {
    excellent: { count: number; percentage: number };
    good: { count: number; percentage: number };
    fair: { count: number; percentage: number };
    poor: { count: number; percentage: number };
  };

  // Top 3 best locations
  topLocations: Array<{
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    inspectionCount: number;
  }>;

  // Top 3 worst locations (need attention)
  worstLocations: Array<{
    name: string;
    building?: string;
    floor?: string;
    avgScore: number;
    inspectionCount: number;
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

// Score calculation helper - matches the format used in inspection submissions
const calculateScore = (responses: any): number => {
  try {
    if (!responses || typeof responses !== 'object') return 0;

    // ✅ FIX: Check for direct score field first (new format)
    if (typeof responses.score === 'number') {
      return responses.score;
    }

    // ✅ FIX: Calculate from ratings array (new format with weights)
    if (Array.isArray(responses.ratings) && responses.ratings.length > 0) {
      const totalWeight = responses.ratings.reduce((sum: number, r: any) => sum + (r.weight || 1), 0);
      const weightedSum = responses.ratings.reduce((sum: number, r: any) => {
        const score = r.score || 0;
        const weight = r.weight || 1;
        return sum + (score * weight);
      }, 0);
      return Math.round(weightedSum / totalWeight);
    }

    // Fallback: Old format - count good responses
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
  } catch (error) {
    console.warn('[analytics] Error calculating score:', error);
    return 0;
  }
};

// Analytics handler function (SIMPLIFIED)
async function handleAnalytics(
  res: VercelResponse,
  isAdmin: boolean,
  currentUserId: string,
  targetUserId: string | undefined,
  monthStr: string | undefined
): Promise<void> {
  if (!supabase) {
    errorResponse(res, 500, 'Database not initialized');
    return;
  }

  // Validate month format (yyyy-MM)
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    errorResponse(res, 400, 'Invalid month format. Must be yyyy-MM (e.g., 2024-11)');
    return;
  }

  console.log('[analytics] Request:', {
    currentUserId,
    isAdmin,
    month: monthStr,
    targetUserId: targetUserId || 'ALL',
  });

  try {
    // Calculate date range for selected month
    const [year, month] = monthStr.split('-');
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;

    console.log('[analytics] Date range:', { startDate, endDate });

    // Build query - fetch inspections for selected month
    let query = supabase
      .from('inspection_records')
      .select(`
        id,
        inspection_date,
        responses,
        location_id,
        locations (
          id,
          name,
          building,
          floor
        )
      `)
      .gte('inspection_date', startDate)
      .lte('inspection_date', endDate);

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

    // ===== 1. OVERVIEW STATS =====
    const totalInspections = records.length;
    const avgScore = totalInspections > 0
      ? Math.round(records.reduce((sum: number, i: InspectionRecord) => sum + calculateScore(i.responses), 0) / totalInspections)
      : 0;

    // Get previous month for trend comparison
    const prevMonthNum = parseInt(month) - 1;
    const prevYear = prevMonthNum === 0 ? (parseInt(year) - 1).toString() : year;
    const prevMonthStr = prevMonthNum === 0 ? '12' : prevMonthNum.toString().padStart(2, '0');
    const prevStartDate = `${prevYear}-${prevMonthStr}-01`;
    const prevLastDay = new Date(parseInt(prevYear), parseInt(prevMonthStr), 0).getDate();
    const prevEndDate = `${prevYear}-${prevMonthStr}-${prevLastDay.toString().padStart(2, '0')}`;

    let prevQuery = supabase
      .from('inspection_records')
      .select('id, responses')
      .gte('inspection_date', prevStartDate)
      .lte('inspection_date', prevEndDate);

    if (targetUserId) {
      prevQuery = prevQuery.eq('user_id', targetUserId);
    }

    const { data: prevInspections } = await prevQuery;
    const prevRecords = prevInspections as InspectionRecord[] || [];
    const prevTotalInspections = prevRecords.length;
    const prevAvgScore = prevTotalInspections > 0
      ? Math.round(prevRecords.reduce((sum: number, i: InspectionRecord) => sum + calculateScore(i.responses), 0) / prevTotalInspections)
      : 0;

    // Calculate trend
    const scoreDiff = avgScore - prevAvgScore;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (scoreDiff > 2) trend = 'up';
    else if (scoreDiff < -2) trend = 'down';

    const trendPercentage = prevAvgScore > 0
      ? Math.round((scoreDiff / prevAvgScore) * 100)
      : 0;

    // ===== 2. STATUS BREAKDOWN =====
    const statusCounts = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    records.forEach((insp: InspectionRecord) => {
      const score = calculateScore(insp.responses);
      if (score >= 85) statusCounts.excellent++;
      else if (score >= 70) statusCounts.good++;
      else if (score >= 50) statusCounts.fair++;
      else statusCounts.poor++;
    });

    const statusBreakdown = {
      excellent: {
        count: statusCounts.excellent,
        percentage: totalInspections > 0 ? Math.round((statusCounts.excellent / totalInspections) * 100) : 0
      },
      good: {
        count: statusCounts.good,
        percentage: totalInspections > 0 ? Math.round((statusCounts.good / totalInspections) * 100) : 0
      },
      fair: {
        count: statusCounts.fair,
        percentage: totalInspections > 0 ? Math.round((statusCounts.fair / totalInspections) * 100) : 0
      },
      poor: {
        count: statusCounts.poor,
        percentage: totalInspections > 0 ? Math.round((statusCounts.poor / totalInspections) * 100) : 0
      }
    };

    // ===== 3. LOCATION PERFORMANCE (TOP & WORST) =====
    const locationMap = new Map<string, {
      name: string;
      building?: string;
      floor?: string;
      scores: number[];
    }>();

    records.forEach((insp: InspectionRecord) => {
      if (!insp.locations) return;
      const locId = insp.location_id;
      const score = calculateScore(insp.responses);

      if (!locationMap.has(locId)) {
        locationMap.set(locId, {
          name: insp.locations.name || 'Unknown',
          building: insp.locations.building,
          floor: insp.locations.floor,
          scores: []
        });
      }
      locationMap.get(locId)!.scores.push(score);
    });

    const locationScores = Array.from(locationMap.entries())
      .map(([_id, data]) => ({
        name: data.name,
        building: data.building,
        floor: data.floor,
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        inspectionCount: data.scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Top 3 best locations
    const topLocations = locationScores.slice(0, 3);

    // Top 3 worst locations
    const worstLocations = locationScores.slice(-3).reverse();

    // ===== RESPONSE =====
    const analyticsData: SimpleAnalytics = {
      totalInspections,
      avgScore,
      trend,
      trendPercentage,
      statusBreakdown,
      topLocations,
      worstLocations
    };

    console.log('[analytics] Success - returning simplified analytics');
    successResponse(res, analyticsData, 'Analytics retrieved successfully');

  } catch (error: any) {
    console.error('[analytics] Error:', error);
    errorResponse(res, 500, 'Failed to retrieve analytics: ' + error.message);
  }
}

/**
 * GET /api/reports?month=yyyy-MM - Get monthly inspections
 * GET /api/reports?date=yyyy-MM-dd - Get inspections for specific date
 * GET /api/reports?userId=xxx&month=yyyy-MM - Admin: Get specific user's monthly inspections
 * GET /api/reports?analytics=true&month=yyyy-MM - Get analytics data for specific month
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

  const { month, date, userId, analytics } = req.query;
  const monthStr = Array.isArray(month) ? month[0] : month;
  const dateStr = Array.isArray(date) ? date[0] : date;
  const userIdStr = Array.isArray(userId) ? userId[0] : userId;
  const analyticsStr = Array.isArray(analytics) ? analytics[0] : analytics;

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
      await handleAnalytics(res, isAdmin, currentUserId, targetUserId, monthStr);
      return; // handleAnalytics handles response
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
