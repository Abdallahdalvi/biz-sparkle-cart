import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TECHLAB" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <SiteShell>
        <div className="max-w-3xl mx-auto py-32 text-center text-on-surface-variant">Loading…</div>
      </SiteShell>
    );
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <SiteShell>
        <div className="max-w-xl mx-auto py-32 text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Access denied</h1>
          <p className="text-on-surface-variant mb-6">
            Your account isn't an admin. Run this in your Supabase SQL editor to promote it:
          </p>
          <pre className="bg-white shopify-border p-4 text-left text-xs overflow-auto">
{`insert into electronic_shop.user_roles (user_id, role)
values ('${user.id}', 'admin');`}
          </pre>
        </div>
      </SiteShell>
    );
  }

  const isIndex = pathname === "/admin";
  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">Admin Dashboard</h1>
        <div className="flex gap-6 border-b border-outline-variant/40 mb-8">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={
                  "pb-3 text-[11px] font-bold uppercase tracking-widest " +
                  (active ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-primary")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        {isIndex ? <AdminOverview /> : <Outlet />}
      </section>
    </SiteShell>
  );
}

function AdminOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Link to="/admin/products" className="bg-white shopify-border p-6 hover:shopify-shadow transition-all">
        <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">Catalog</p>
        <h2 className="text-2xl font-bold mt-2">Products</h2>
        <p className="text-sm text-on-surface-variant mt-2">Add, edit and toggle visibility.</p>
      </Link>
      <Link to="/admin/orders" className="bg-white shopify-border p-6 hover:shopify-shadow transition-all">
        <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">Fulfilment</p>
        <h2 className="text-2xl font-bold mt-2">Orders</h2>
        <p className="text-sm text-on-surface-variant mt-2">Track payments and shipments.</p>
      </Link>
      <div className="bg-white shopify-border p-6 opacity-60">
        <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">Coming next</p>
        <h2 className="text-2xl font-bold mt-2">Razorpay & Shiprocket</h2>
        <p className="text-sm text-on-surface-variant mt-2">Wire keys in Phases 4 & 5.</p>
      </div>
    </div>
  );
}