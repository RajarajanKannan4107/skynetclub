import { supabaseAdmin } from '../config/supabase.js';

/**
 * Authentication Middleware
 * Extracts and verifies the Supabase Auth JWT access token from the Authorization header.
 * Attaches the verified user object to req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or malformed Bearer authorization token.',
      });
    }

    const token = authHeader.split(' ')[1].trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Access token is empty.',
      });
    }

    // Verify token with Supabase Auth
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or expired authentication token.',
        details: error?.message,
      });
    }

    // Attach verified user to request
    req.user = user;
    req.token = token;
    return next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Authentication verification failed.',
      details: err.message,
    });
  }
}

/**
 * Optional Authentication Middleware
 * If a valid token is present, populates req.user. If not, continues without error.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1].trim();
    if (!token) {
      return next();
    }

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);

    if (user) {
      req.user = user;
      req.token = token;
    }

    return next();
  } catch {
    return next();
  }
}
