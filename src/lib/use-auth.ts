import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

let cachedAdmin: { userId: string; isAdmin: boolean } | null = null;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      cachedAdmin = null;
      return;
    }
    if (cachedAdmin?.userId === user.id) {
      setIsAdmin(cachedAdmin.isAdmin);
      return;
    }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      const ok = Boolean(data);
      cachedAdmin = { userId: user.id, isAdmin: ok };
      setIsAdmin(ok);
    });
  }, [user]);

  return { session, user, isAdmin, loading };
}

export async function signOut() {
  cachedAdmin = null;
  await supabase.auth.signOut();
}
