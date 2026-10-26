import { supabase } from "@/integrations/supabase/client";
import { readTrackingConsent } from "@/lib/tracking";

const sent = new Set<string>();

export function recordProductEngagement(slug: string, event: "view" | "click" | "cart") {
  if (typeof window === "undefined" || !readTrackingConsent()?.analytics) return;
  if (window.location.pathname.startsWith("/admin")) return;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const key = `${day}:${event}:${slug}`;
    if (sent.has(key)) return;
    const sessionKey = `aghanims-engagement:${day}`;
    let session = window.sessionStorage.getItem(sessionKey);
    if (!session) {
      session = crypto.randomUUID();
      window.sessionStorage.setItem(sessionKey, session);
    }
    sent.add(key);
    void Promise.resolve(
      supabase.rpc("record_product_engagement", {
        p_slug: slug,
        p_event: event,
        p_session: session,
      }),
    )
      .then(({ error }) => {
        if (error) sent.delete(key);
      })
      .catch(() => sent.delete(key));
  } catch {
    // Storage restrictions and analytics failures must never interrupt shopping.
  }
}
