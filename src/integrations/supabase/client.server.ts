import { createClient } from "@supabase/supabase-js";

/**
 * Server-only admin client (service role). NEVER import this from a
 * component or a client-reachable module at top level — load it lazily
 * inside server-fn / server-route handlers via dynamic import.
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: "electronic_shop" },
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
