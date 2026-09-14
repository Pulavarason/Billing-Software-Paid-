import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security.
 *
 * NEVER import this into any file that ships to the browser. It is only
 * safe to use inside:
 *  - Route Handlers under app/api/** (e.g. the Razorpay webhook)
 *  - Server Actions guarded by an is_admin check (app/admin/actions.ts)
 *
 * SUPABASE_SERVICE_ROLE_KEY must stay out of NEXT_PUBLIC_* env vars.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
