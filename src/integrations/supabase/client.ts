import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
const anonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);

if (!url || !anonKey) {
  // Don't crash SSR — surface a clear console error and lazy-fail on use.
  console.warn("[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
}

/**
 * Browser-safe Supabase client.
 * Targets the shared `electronic_shop` schema for all product/order tables.
 * Auth lives in the global `auth.users` table — so signing up here logs the
 * user into every dalvi.cloud site sharing this Supabase instance.
 */
export const supabase: SupabaseClient = createClient(url ?? "http://invalid", anonKey ?? "invalid", {
  db: { schema: "electronic_shop" },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "dalvi-auth-token",
  },
});