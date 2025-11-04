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
  // Only allow GET requests
  if (req.method !== 'GET') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  // Validate authentication (no minimum level required - just verify)
  const auth = await validateAuth(req, 0);

  if (!auth) {
    return errorResponse(res, 401, 'Unauthorized');
  }

  // Return role information
  return successResponse(res, {
    userId: auth.userId,
    role: auth.userRole,
    isAdmin: auth.userRole.level >= 80, // Admin level: 80+
    isSuperAdmin: auth.userRole.level >= 100, // Super admin level: 100
  });
}
