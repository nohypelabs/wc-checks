// api/locations.ts - Locations read access for all users
import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, supabase, successResponse, errorResponse } from './middleware/role-guard.js';

/**
 * GET /api/locations?id=xxx - Get specific location details
 *
 * Requirements: Authenticated user (level 0+)
 * Users can view active locations to complete inspections
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

  const { id } = req.query;
  const locationId = Array.isArray(id) ? id[0] : id;

  try {
    if (!locationId) {
      return errorResponse(res, 400, 'Location ID required');
    }

    // Get location with building details
    const { data: location, error } = await supabase
      .from('locations')
      .select(`
        id,
        name,
        floor,
        area,
        code,
        building_id,
        organization_id,
        qr_code,
        is_active,
        buildings!building_id (
          name
        )
      `)
      .eq('id', locationId)
      .eq('is_active', true) // Only active locations
      .single();

    if (error) {
      console.error('[locations] Error fetching location:', error);
      throw error;
    }

    if (!location) {
      return errorResponse(res, 404, 'Location not found or inactive');
    }

    // Transform data to flatten building name
    const transformed = {
      id: location.id,
      name: location.name,
      floor: location.floor,
      area: location.area,
      code: location.code,
      building_id: location.building_id,
      organization_id: location.organization_id,
      qr_code: location.qr_code,
      is_active: location.is_active,
      building: (location as any).buildings?.name || null,
    };

    return successResponse(res, transformed, 'Location retrieved');
  } catch (error: any) {
    console.error('[locations] Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve location: ' + error.message);
  }
}
