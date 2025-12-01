// api/auth/verify-role.ts - Server-side role verification endpoint
import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, errorResponse, successResponse } from '../middleware/role-guard.js';

/**
 * GET /api/auth/verify-role
 *
 * Verify user's authentication and return their role information
 * This prevents frontend role spoofing
 *
 * Headers:
 *   Authorization: Bearer <token>
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       userId: string,
 *       role: { id: string, name: string, level: number },
 *       isAdmin: boolean,
 *       isSuperAdmin: boolean
 *     }
 *   }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[verify-role] 🔍 Request received');

  // Only allow GET requests
  if (req.method !== 'GET') {
    console.error('[verify-role] ❌ Method not allowed:', req.method);
    return errorResponse(res, 405, 'Method not allowed');
  }

  try {
    // Validate authentication (no minimum level required - just verify)
    console.log('[verify-role] 🔐 Validating auth...');
    const auth = await validateAuth(req, 0);

    if (!auth) {
      console.error('[verify-role] ❌ Auth validation failed');
      return errorResponse(res, 401, 'Unauthorized');
    }

    console.log('[verify-role] ✅ Auth validated:', {
      userId: auth.userId,
      role: auth.userRole.name,
      level: auth.userRole.level,
    });

    // Set cache headers for faster subsequent requests
    // Cache for 15 minutes since role changes are rare
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');

    // Return role information
    return successResponse(res, {
      userId: auth.userId,
      role: auth.userRole,
      isAdmin: auth.userRole.level >= 80, // Admin level: 80+
      isSuperAdmin: auth.userRole.level >= 90, // Super admin level: 90+ (superadmin & system_admin)
    });
  } catch (error: any) {
    console.error('[verify-role] ❌ Unexpected error:', error.message);
    console.error('[verify-role] Error stack:', error.stack);
    return errorResponse(res, 500, 'Internal server error: ' + error.message);
  }
}
