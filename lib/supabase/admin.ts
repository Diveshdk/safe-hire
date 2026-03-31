import { createClient } from "@supabase/supabase-js"

/**
 * Admin Supabase client using the service role key.
 * Bypasses RLS — use only in server-side API routes where
 * the caller has already been authenticated and authorized.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })
}
