import "server-only";
import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

/**
 * Server-only client with the service role key — bypasses Row Level Security,
 * so this must never be imported into a client component or exposed to the
 * browser. Used only inside Server Actions to upload to Supabase Storage on
 * behalf of an already-authenticated user (auth is checked before this is
 * ever called).
 */
export function getSupabaseAdmin() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Check your .env file."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}
