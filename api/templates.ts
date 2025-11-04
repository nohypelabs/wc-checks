// api/templates.ts - Inspection templates read access for all users
import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, supabase, successResponse, errorResponse } from './middleware/role-guard.js';

/**
 * GET /api/templates - Get default inspection template
 * GET /api/templates?id=xxx - Get specific template
 *
 * Requirements: Authenticated user (level 0+)
 * Users need templates to complete inspections
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
  const templateId = Array.isArray(id) ? id[0] : id;

  try {
    // Get specific template by ID
    if (templateId) {
      const { data: template, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('[templates] Error fetching template:', error);
        throw error;
      }

      if (!template) {
        return errorResponse(res, 404, 'Template not found or inactive');
      }

      return successResponse(res, template, 'Template retrieved');
    }

    // Get default template
    const { data: defaultTemplate, error } = await supabase
      .from('inspection_templates')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[templates] Error fetching default template:', error);
      throw error;
    }

    // If no default template found, auto-create one
    if (!defaultTemplate) {
      console.warn('[templates] No default template found, creating one...');

      const newTemplate = {
        name: 'Comprehensive Inspection',
        description: 'Default comprehensive inspection template',
        fields: {
          components: [],
          requiredPhotos: 0,
          maxPhotos: 10,
          allowNotes: true
        },
        estimated_time: 300,
        is_active: true,
        is_default: true,
        created_by: auth.userId,
      };

      const { data: createdTemplate, error: createError } = await supabase
        .from('inspection_templates')
        .insert([newTemplate])
        .select()
        .single();

      if (createError) {
        console.error('[templates] Failed to create default template:', createError);
        throw createError;
      }

      console.log('[templates] Default template created:', createdTemplate.id);
      return successResponse(res, createdTemplate, 'Default template created');
    }

    return successResponse(res, defaultTemplate, 'Default template retrieved');
  } catch (error: any) {
    console.error('[templates] Error:', error);
    return errorResponse(res, 500, 'Failed to retrieve template: ' + error.message);
  }
}
