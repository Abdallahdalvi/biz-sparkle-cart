import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Server-only helper to verify a user's Supabase access token
 * and enforce role-based access control (e.g., admin) securely on the server.
 */
export async function requireSupabaseAuth(token: string, requiredRole?: "admin" | "staff" | "customer") {
  if (!token) throw new Error("Unauthorized: Missing auth token");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new Error(`Unauthorized: ${error?.message ?? "Invalid token"}`);

  if (requiredRole) {
    const { data: roleData, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", requiredRole)
      .single();
    if (roleErr || !roleData) {
      throw new Error(`Forbidden: Requires ${requiredRole} role`);
    }
  }

  return user;
}
