import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  email: string;
  status: string;
  total_paise: number;
  created_at: string;
}

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, email, status, total_paise, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setOrders((data as Order[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  if (!orders) return <p className="text-on-surface-variant">Loading…</p>;
  if (orders.length === 0) return <p className="text-on-surface-variant">No orders yet.</p>;

  return (
    <div className="bg-white shopify-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-container-low">
          <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant">
            <th className="p-3">Order</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Date</th>
            <th className="p-3">Total</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-outline-variant/40">
              <td className="p-3 font-bold">{o.order_number}</td>
              <td className="p-3">{o.email}</td>
              <td className="p-3 text-on-surface-variant">{new Date(o.created_at).toLocaleString()}</td>
              <td className="p-3 font-bold">{formatINR(o.total_paise)}</td>
              <td className="p-3">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="border border-outline-variant/40 px-2 py-1 text-[11px] font-bold uppercase tracking-widest"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}