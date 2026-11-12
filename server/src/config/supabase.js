import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

/**
 * Service Role Supabase Client (SERVER-SIDE ONLY)
 * Bypasses RLS to perform administrative and verified background operations.
 * NEVER expose this client or its credentials to the frontend.
 */
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Anonymous / Public Supabase Client
 * Respects RLS policies for public operations.
 */
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create a Supabase client scoped to a specific authenticated user's JWT.
 * Queries made with this client execute within that user's RLS boundaries.
 * @param {string} token - The user's Bearer access token
 */
export const createUserClient = (token) => {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};
