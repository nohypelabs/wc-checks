// api/health.ts - Health check endpoint for debugging
import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/health
 *
 * Simple health check to verify API is working
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY;

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      hasSupabaseUrl,
      hasServiceKey,
      supabaseUrlPrefix: process.env.SUPABASE_URL?.substring(0, 30) || 'missing',
    },
  });
}
