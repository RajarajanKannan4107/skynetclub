import { supabaseAdmin } from '../config/supabase.js';

/**
 * Authorization Middleware: requireAdmin
 * Must run AFTER requireAuth middleware.
 * Verifies that the authenticated user has an entry in public.admin_roles.
 * Prevents unauthorized task modifications and access to member submissions.
 */
export async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User authentication required.',
      });
    }

    // Query admin_roles using service-role client (server-side authorization)
    const { data: adminRecord, error } = await supabaseAdmin
      .from('admin_roles')
      .select('id, user_id, role')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('[ADMIN AUTHORIZATION QUERY ERROR]:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify administrative privileges.',
      });
    }

    if (!adminRecord || !['admin', 'super_admin'].includes(adminRecord.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Restricted to SkyNet administrators only.',
      });
    }

    // Attach verified admin role to request
    req.adminRole = adminRecord.role;
    return next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Authorization check encountered an internal error.',
      details: err.message,
    });
  }
}
