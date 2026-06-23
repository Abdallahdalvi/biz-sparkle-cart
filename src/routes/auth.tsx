import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — TECHLAB" }, { name: "robots", content: "noindex" }] }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in across all dalvi.cloud sites.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <section className="max-w-md mx-auto py-16 px-margin-mobile">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {mode === "signin" ? "Sign in to TECHLAB" : "Create your account"}
        </h1>
        <p className="text-sm text-on-surface-variant mb-8">
          One account across every dalvi.cloud site — sign in once, you're in everywhere.
        </p>
        <div className="bg-white shopify-border p-8 space-y-4">
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full border border-outline py-3 font-bold text-sm uppercase tracking-widest hover:bg-surface-container transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">login</span>
            Continue with Google
          </button>
          <div className="text-center text-[11px] text-on-surface-variant uppercase tracking-widest">or</div>
          <form onSubmit={handleEmail} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-surface-container-low border border-outline-variant/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              className="w-full bg-surface-container-low border border-outline-variant/40 px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button
              disabled={busy}
              className="w-full bg-primary text-on-primary py-3 font-bold text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-[11px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary"
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
        <p className="text-xs text-on-surface-variant text-center mt-6">
          By continuing you agree to our <Link to="/legal/terms" className="underline">Terms</Link> and{" "}
          <Link to="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </section>
    </SiteShell>
  );
}