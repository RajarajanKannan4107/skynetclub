import { supabaseAdmin, supabaseAnon } from '../config/supabase.js';

/**
 * Admin Login
 * Signs in via Supabase Auth and verifies admin role in public.admin_roles
 */
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    // Sign in using Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password.',
        details: authError?.message,
      });
    }

    const userId = authData.user.id;

    // Verify admin role mapping in public.admin_roles
    const { data: adminRecord, error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to verify administrative role.',
      });
    }

    if (!adminRecord || !['admin', 'super_admin'].includes(adminRecord.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Your account does not have administrative privileges.',
      });
    }

    // Fetch profile if exists
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .maybeSingle();

    return res.json({
      success: true,
      message: 'Admin authentication successful.',
      data: {
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
        },
        user: {
          id: userId,
          email: authData.user.email,
          full_name: profile?.full_name || '',
          role: adminRecord.role,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Get current authenticated user details and role status
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const { data: adminRecord } = await supabaseAdmin
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    return res.json({
      success: true,
      data: {
        id: userId,
        email: req.user.email,
        full_name: profile?.full_name || '',
        isAdmin: !!adminRecord,
        adminRole: adminRecord?.role || null,
        profile,
      },
    });
  } catch (err) {
    return next(err);
  }
}
