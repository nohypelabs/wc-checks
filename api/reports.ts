// api/reports.ts - Inspection reports for users and admins
import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, supabase, successResponse, errorResponse } from './middleware/role-guard.js';

/**
 * GET /api/reports?month=yyyy-MM - Get monthly inspections
 * GET /api/reports?date=yyyy-MM-dd - Get inspections for specific date
 * GET /api/reports?userId=xxx&month=yyyy-MM - Admin: Get specific user's monthly inspections
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

  const { month, date, userId } = req.query;
  const monthStr = Array.isArray(month) ? month[0] : month;
  const dateStr = Array.isArray(date) ? date[0] : date;
  const userIdStr = Array.isArray(userId) ? userId[0] : userId;

  const isAdmin = auth.userRole.level >= 80;
  const currentUserId = auth.userId;

  // 🔍 DEBUG: Log auth details
  console.log('[reports] 🔐 Auth details:', {
    userId: currentUserId,
    role: auth.userRole.name,
    level: auth.userRole.level,
    isAdmin,
    monthParam: monthStr,
    dateParam: dateStr,
    userIdParam: userIdStr,
  });

  try {
    // Determine which user's data to fetch
    let targetUserId: string | undefined = undefined;

    if (!isAdmin) {
      // Non-admin: ALWAYS filter to their own data
      targetUserId = currentUserId;
      console.log(`[reports] Non-admin user ${currentUserId} - filtering to own data`);
    } else if (userIdStr) {
      // Admin with userId param: filter to specific user
      targetUserId = userIdStr;
      console.log(`[reports] Admin ${currentUserId} requesting data for user ${targetUserId}`);
    } else {
      // Admin without userId param: get ALL users' data
      targetUserId = undefined;
      console.log(`[reports] Admin ${currentUserId} requesting ALL users' data`);
    }

    // Security check: prevent non-admin from requesting other user's data
    if (!isAdmin && userIdStr && userIdStr !== currentUserId) {
      return errorResponse(res, 403, 'Access denied - you can only view your own data');
    }

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
