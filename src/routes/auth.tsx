import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — TECHLAB" }, { name: "robots", content: "noindex" }] }),
  component: Auth,
});

function Auth() {
  return (
    <SiteShell>
      <section className="max-w-md mx-auto py-16 px-margin-mobile">
        <h1 className="text-3xl font-bold text-primary mb-2">Sign in to TECHLAB</h1>
        <p className="text-sm text-on-surface-variant mb-8">Track orders, save addresses, and unlock early-access drops.</p>
        <div className="bg-white shopify-border p-8 space-y-4">
          <button disabled className="w-full border border-outline py-3 font-bold text-sm uppercase tracking-widest opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">login</span>
            Continue with Google
          </button>
          <div className="text-center text-[11px] text-on-surface-variant uppercase tracking-widest">or</div>
          <input type="email" placeholder="Email" className="w-full bg-surface-container-low border border-outline-variant/40 px-4 py-3 text-sm focus:outline-none focus:border-primary" disabled />
          <input type="password" placeholder="Password" className="w-full bg-surface-container-low border border-outline-variant/40 px-4 py-3 text-sm focus:outline-none focus:border-primary" disabled />
          <button disabled className="w-full bg-primary text-on-primary py-3 font-bold text-sm uppercase tracking-widest opacity-50 cursor-not-allowed">
            Sign In
          </button>
          <p className="text-[11px] text-on-surface-variant text-center uppercase tracking-widest">
            Auth activates in Phase 2 (Lovable Cloud wiring).
          </p>
        </div>
        <p className="text-xs text-on-surface-variant text-center mt-6">
          By continuing you agree to our <Link to="/legal/terms" className="underline">Terms</Link> and <Link to="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </section>
    </SiteShell>
  );
}