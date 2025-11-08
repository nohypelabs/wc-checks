// api/admin/inspections.ts - View all inspections (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
} from '../middleware/role-guard.js';

/**
 * GET /api/admin/inspections - List all inspections (admin view)
 * GET /api/admin/inspections?id=xxx - Get specific inspection
 * GET /api/admin/inspections?user_id=xxx - Filter by user
 * GET /api/admin/inspections?location_id=xxx - Filter by location
 * GET /api/admin/inspections?date=yyyy-mm-dd - Filter by date
 *
 * Requirements: Admin+ (level 80+)
 * Admins can view all inspections across all users
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await validateAuth(req, 80);

  if (!auth || !supabase) {
    return errorResponse(res, 403, 'Access denied - Admin privileges required');
  }

  const { id, user_id, location_id, date, limit = '100' } = req.query;
  const inspectionId = Array.isArray(id) ? id[0] : id;
  const userId = Array.isArray(user_id) ? user_id[0] : user_id;
  const locationId = Array.isArray(location_id) ? location_id[0] : location_id;
  const filterDate = Array.isArray(date) ? date[0] : date;
  const resultLimit = Array.isArray(limit) ? limit[0] : limit;

  try {
    // GET only - admins can view, not modify
    if (req.method !== 'GET') {
      return errorResponse(res, 405, 'Method not allowed - use /api/inspections for modifications');
    }

    // Get specific inspection
    if (inspectionId) {
      const { data: inspection, error } = await supabase
        .from('inspection_records')
        .select('*, locations!inner(id, name, floor, buildings(name)), users!inspection_records_user_id_fkey(full_name, email)')
        .eq('id', inspectionId)
        .single();

      if (error) throw error;
      return successResponse(res, inspection, 'Inspection retrieved');
    }

    // List inspections with filters
    let query = supabase
      .from('inspection_records')
      .select('*, locations!inner(id, name, floor, buildings(name)), users!inspection_records_user_id_fkey(full_name, email)')
      .order('inspection_date', { ascending: false })
      .limit(parseInt(resultLimit, 10));

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    if (filterDate) {
      query = query.eq('inspection_date', filterDate);
    }

    const { data: inspections, error } = await query;
    if (error) throw error;

    return successResponse(
      res,
      {
        inspections: inspections || [],
        count: inspections?.length || 0,
        filters: { user_id: userId, location_id: locationId, date: filterDate, limit: resultLimit },
      },
      'Inspections retrieved'
    );
  } catch (error: any) {
    console.error('[admin/inspections] Error:', error);
    return errorResponse(res, 500, 'Operation failed: ' + error.message);
  }
}
