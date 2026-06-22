import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — TECHLAB" }, { name: "robots", content: "noindex" }] }),
  component: AccountLayout,
});

const TABS = [
  { to: "/account", label: "Profile", exact: true },
  { to: "/account/orders", label: "Orders" },
] as const;

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
              <Link key={t.to} to={t.to} className={"pb-3 text-[11px] font-bold uppercase tracking-widest " + (active ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-primary")}>
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
  return (
    <div className="bg-white shopify-border p-8">
      <p className="text-on-surface-variant mb-4">You're not signed in.</p>
      <Link to="/auth" className="inline-block bg-primary text-on-primary px-6 py-3 font-bold text-sm uppercase tracking-widest">
        Sign In / Create Account
      </Link>
      <p className="text-[11px] text-on-surface-variant mt-6 uppercase tracking-widest">
        Account, addresses & order tracking will activate when Lovable Cloud is wired up in Phase 2.
      </p>
    </div>
  );
}