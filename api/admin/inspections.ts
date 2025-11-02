// api/admin/inspections.ts - View all inspections (ADMIN+ ONLY)
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  validateAuth,
  supabase,
  successResponse,
  errorResponse,
} from '../middleware/role-guard';

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
    return res.status(403).json(errorResponse('Access denied - Admin privileges required'));
  }

  const { id, user_id, location_id, date, limit = '100' } = req.query;

  try {
    // GET only - admins can view, not modify
    if (req.method !== 'GET') {
      return res.status(405).json(errorResponse('Method not allowed - use /api/inspections for modifications'));
    }

    // Get specific inspection
    if (id) {
      const { data: inspection, error } = await supabase
        .from('inspection_records')
        .select('*, locations(name, floor, buildings(name)), users(full_name, email)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return res.status(200).json(successResponse(inspection, 'Inspection retrieved'));
    }

    // List inspections with filters
    let query = supabase
      .from('inspection_records')
      .select('*, locations(name, floor), users(full_name, email)')
      .order('inspection_date', { ascending: false })
      .limit(parseInt(limit as string, 10));

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (location_id) {
      query = query.eq('location_id', location_id);
    }

    if (date) {
      query = query.eq('inspection_date', date);
    }

    const { data: inspections, error } = await query;
    if (error) throw error;

    return res.status(200).json(
      successResponse(
        {
          inspections: inspections || [],
          count: inspections?.length || 0,
          filters: { user_id, location_id, date, limit },
        },
        'Inspections retrieved'
      )
    );
  } catch (error: any) {
    console.error('[admin/inspections] Error:', error);
    return res.status(500).json(errorResponse('Operation failed: ' + error.message));
  }
}
