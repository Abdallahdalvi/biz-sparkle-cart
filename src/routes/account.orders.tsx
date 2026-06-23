import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatINR } from "@/lib/format";

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_paise: number;
  created_at: string;
  tracking_url: string | null;
}

export const Route = createFileRoute("/account/orders")({
  component: Orders,
});

function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, order_number, status, total_paise, created_at, tracking_url")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        else setOrders((data as OrderRow[]) ?? []);
      });
  }, [user]);

  if (authLoading) return <p className="text-on-surface-variant">Loading…</p>;
  if (!user) {
    return (
      <div className="bg-white shopify-border p-12 text-center">
        <p className="text-on-surface-variant mb-2">Sign in to see your orders.</p>
        <Link to="/auth" className="text-primary underline text-sm">Sign In</Link>
      </div>
    );
  }
  if (err) return <p className="text-destructive text-sm">{err}</p>;
  if (!orders) return <p className="text-on-surface-variant">Loading orders…</p>;
  if (orders.length === 0)
    return (
      <div className="bg-white shopify-border p-12 text-center">
        <p className="text-on-surface-variant mb-4">No orders yet.</p>
        <Link to="/catalog" className="text-primary underline text-sm">Browse the catalog</Link>
      </div>
    );

  return (
    <div className="bg-white shopify-border divide-y divide-outline-variant/40">
      {orders.map((o) => (
        <div key={o.id} className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">{o.order_number}</p>
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">
              {new Date(o.created_at).toLocaleDateString()} · {o.status}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold">{formatINR(o.total_paise)}</p>
            {o.tracking_url && (
              <a href={o.tracking_url} target="_blank" rel="noopener" className="text-[11px] text-primary underline">
                Track
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}