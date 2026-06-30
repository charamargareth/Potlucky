import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client dengan service_role key — hanya dipakai di server (API routes / cron),
 * TIDAK PERNAH di-export ke browser. Bypass RLS, jadi hati-hati saat memakainya.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
