import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { useAuth, signOut } from "@/lib/use-auth";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — Aghanims Phones and Gadgets" }, { name: "robots", content: "noindex" }] }),
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
        {isIndex ? <AccountProfile /> : <Outlet />}
      </section>
    </SiteShell>
  );
}

function AccountProfile() {
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
    <div className="bg-white shopify-border p-8 shadow-sm">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-primary mb-2">Account Details</h2>
        <p className="text-sm text-on-surface-variant mb-8">
          View your orders, follow shipment progress, or sign out of your account.
        </p>
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
          Email address
        </p>
        <p className="text-xl font-bold text-primary mb-8 break-all">{user.email}</p>

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
    </div>
  );
}
