import { createClient } from "@supabase/supabase-js";

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
export const supabase = createClient(
  url ?? "https://supabase.dalvi.cloud",
  anonKey ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgwNTE2MDU5LCJleHAiOjQxMDI0NDQ4MDB9.pnle16TS5HXFkORp9nrU5GMbTU3BaNf8XzLfguweAUg",
  {
    db: { schema: "electronic_shop" },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "dalvi-auth-token",
    },
  },
);
