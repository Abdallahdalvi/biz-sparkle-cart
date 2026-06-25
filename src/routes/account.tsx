import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { useAuth, signOut } from "@/lib/use-auth";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — TECHLAB" }, { name: "robots", content: "noindex" }] }),
  component: AccountLayout,
});

const TABS: { to: "/account" | "/account/orders"; label: string; exact?: boolean }[] = [
  { to: "/account", label: "Profile", exact: true },
  { to: "/account/orders", label: "Orders" },
];

function AccountLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/account";
  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">Your Account</h1>
        <div className="flex gap-6 border-b border-outline-variant/40 mb-8">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={
                  "pb-3 text-[11px] font-bold uppercase tracking-widest " +
                  (active
                    ? "border-b-2 border-primary text-primary"
                    : "text-on-surface-variant hover:text-primary")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        {isIndex ? <ProfileStub /> : <Outlet />}
      </section>
    </SiteShell>
  );
}

function ProfileStub() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="bg-white shopify-border p-8 text-on-surface-variant animate-pulse">
        Loading profile details…
      </div>
    );
  if (!user) {
    return (
      <div className="bg-white shopify-border p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
        <h2 className="text-2xl font-bold text-primary mb-2">Access Your Dashboard</h2>
        <p className="text-on-surface-variant mb-6 text-sm">
          Sign in to track your shipments, view payment receipts, and manage your account.
        </p>
        <Link
          to="/auth"
          className="inline-block bg-primary text-on-primary px-8 py-3.5 font-bold text-xs uppercase tracking-widest shadow-md hover:opacity-90 transition-opacity"
        >
          Sign In / Create Account
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div className="bg-white shopify-border p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-surface-container-low px-4 py-1 border-l border-b border-outline-variant/40 text-[10px] font-bold uppercase tracking-widest text-primary">
          Verified Account
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
          Signed in as
        </p>
        <p className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
          {user.email}
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 py-6 border-y border-outline-variant/40">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Security
            </p>
            <p className="text-sm font-medium text-primary">GoTrue Auth / Google OAuth</p>
            <p className="text-xs text-emerald-600 mt-0.5">Active & Protected</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Single Sign-On
            </p>
            <p className="text-sm font-medium text-primary">dalvi.cloud ecosystem</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Synced with Cards & YT Scheduler
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Database Schema
            </p>
            <p className="text-sm font-medium text-primary">electronic_shop</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Self-hosted Supabase</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/account/orders"
            className="bg-primary text-on-primary px-6 py-3 font-bold text-xs uppercase tracking-widest shadow hover:opacity-90 transition-all"
          >
            View Orders & Shipment Tracking
          </Link>
          <button
            onClick={() => signOut()}
            className="border border-outline px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low shopify-border p-6 border-l-4 border-l-primary flex items-start gap-4">
        <div>
          <h3 className="font-bold text-sm text-primary mb-1">Seamless Cross-Site Authorization</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your credentials securely authorize you across all connected apps in the dalvi.cloud
            ecosystem including <strong>ytscheduler.dalvi.cloud</strong>,{" "}
            <strong>cards.dalvi.cloud</strong>, <strong>links.dalvi.cloud</strong>, and local
            development environments.
          </p>
        </div>
      </div>
    </div>
  );
}
