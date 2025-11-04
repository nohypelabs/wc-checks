// api/profile.ts - User Profile Management
import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth } from './middleware/role-guard.js';
import { supabase } from './middleware/role-guard.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Validate authentication (no specific role required, minLevel = 0)
    const authContext = await validateAuth(req, 0);
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = authContext.userId;

    // Check if supabase client is available
    if (!supabase) {
      console.error('[profile] Supabase client not initialized');
      return res.status(500).json({ error: 'Internal server error' });
    }

    // GET - Get user profile
    if (req.method === 'GET') {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, full_name, phone, occupation_id, profile_photo_url, created_at, last_login_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[profile] Error fetching profile:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(user);
    }

    // PUT - Update user profile
    if (req.method === 'PUT') {
      const { full_name, phone, occupation_id } = req.body;

      // Validation
      if (!full_name || full_name.trim().length < 2) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters' });
      }

      // Prepare update data
      const updateData: any = {
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        occupation_id: occupation_id || null,
        updated_at: new Date().toISOString(),
      };

      // Update user profile (only their own)
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[profile] Error updating profile:', error);
        return res.status(500).json({ error: error.message });
      }

      console.log(`[profile] User ${userId} updated profile successfully`);
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[profile] Unexpected error:', error);
    return res.status(500).json({ error: error.message });
  }
}
