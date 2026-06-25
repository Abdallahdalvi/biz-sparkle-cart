import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

interface ShippingAddress {
  first_name?: string;
  last_name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
}

interface Order {
  id: string;
  order_number: string;
  email: string;
  phone?: string | null;
  shipping_address?: ShippingAddress | null;
  status: string;
  total_paise: number;
  created_at: string;
  tracking_url: string | null;
  seller_notes?: string;
}

const STATUSES = [
  "pending",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sellerNotes, setSellerNotes] = useState<Record<string, string>>({});
  const [pkgWeight, setPkgWeight] = useState("0.5");
  const [pkgDims, setPkgDims] = useState("20x15x10");

  async function load() {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, email, phone, shipping_address, status, total_paise, created_at, tracking_url",
      )
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const loaded = (data as Order[]) ?? [];
    setOrders(loaded);
    // Load local mock notes if any
    const notes: Record<string, string> = {};
    loaded.forEach((o) => {
      notes[o.id] = localStorage.getItem(`seller_notes_${o.id}`) || "";
    });
    setSellerNotes(notes);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order status updated to ${status}`);
    load();
  }

  async function generateAWB(id: string, orderNumber: string) {
    setSimulatingId(id);
    const mockTrackingUrl = `https://shiprocket.co/tracking/SRK-${orderNumber}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { error } = await supabase
      .from("orders")
      .update({ tracking_url: mockTrackingUrl, status: "shipped" })
      .eq("id", id);
    setSimulatingId(null);
    if (error) return toast.error(error.message);
    toast.success("Shiprocket AWB generated & order marked as Shipped!");
    load();
  }

  async function simulateRazorpayWebhook(id: string) {
    const { error } = await supabase.from("orders").update({ status: "paid" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Razorpay order.paid webhook simulated successfully!");
    load();
  }

  async function handleBulkStatus(newStatus: string) {
    if (selectedIds.length === 0) return toast.error("Select at least one order");
    for (const id of selectedIds) {
      await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    }
    toast.success(`Bulk updated ${selectedIds.length} orders to ${newStatus}`);
    setSelectedIds([]);
    load();
  }

  function saveSellerNote(id: string) {
    localStorage.setItem(`seller_notes_${id}`, sellerNotes[id] || "");
    toast.success("Seller internal notes saved successfully!");
  }

  function printPackingSlip(o: Order) {
    const addr = o.shipping_address || {};
    const content = `
      <html>
        <head>
          <title>Packing Slip - ${o.order_number}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .store-name { font-size: 28px; font-weight: bold; letter-spacing: 2px; }
            .title { font-size: 20px; font-weight: bold; color: #555; }
            .details-grid { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 14px; }
            .box { border: 1px solid #ccc; padding: 20px; width: 45%; background: #fafafa; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
            .table th { background-color: #f5f5f5; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">TECHLAB</div>
            <div class="title">PACKING SLIP / INVOICE</div>
          </div>
          <div class="details-grid">
            <div class="box">
              <h3><strong>Ship To:</strong></h3>
              <p><strong>${addr.first_name || "Customer"} ${addr.last_name || ""}</strong></p>
              <p>${addr.line1 || "No address provided"}</p>
              ${addr.line2 ? `<p>${addr.line2}</p>` : ""}
              <p>${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}</p>
              <p><strong>Phone:</strong> ${o.phone || "N/A"}</p>
              ${addr.gstin ? `<p><strong>Buyer GSTIN:</strong> ${addr.gstin}</p>` : ""}
            </div>
            <div class="box">
              <h3><strong>Order Details:</strong></h3>
              <p><strong>Order ID:</strong> ${o.order_number}</p>
              <p><strong>Order Date:</strong> ${new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              <p><strong>Payment Status:</strong> ${o.status.toUpperCase()}</p>
              <p><strong>Grand Total:</strong> ${formatINR(o.total_paise)}</p>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Total Price (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Techlab High-Fidelity Gadget / Accessory (${o.order_number})</td>
                <td>1</td>
                <td>${formatINR(o.total_paise)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Thank you for shopping with TECHLAB! If you have any questions about your order, please contact support.</p>
            <p>Powered by Shiprocket & Razorpay Integration</p>
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(content);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 500);
    }
  }

  if (!orders)
    return (
      <p className="text-on-surface-variant animate-pulse">Loading orders and fulfilment logs…</p>
    );

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && (
        <div className="bg-primary text-on-primary p-4 rounded shadow-sm flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
          <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_box</span>
            {selectedIds.length} Orders Selected
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Bulk Change Status:</span>
            <div className="flex flex-wrap gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleBulkStatus(s)}
                  className="bg-white text-primary hover:bg-surface-container-low px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-surface-container-low shopify-border p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <span>Filter Status:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilter("all")}
              className={
                "px-3 py-1 " +
                (filter === "all"
                  ? "bg-primary text-on-primary"
                  : "bg-white border border-outline-variant/40 hover:bg-surface-container")
              }
            >
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={
                  "px-3 py-1 " +
                  (filter === s
                    ? "bg-primary text-on-primary"
                    : "bg-white border border-outline-variant/40 hover:bg-surface-container")
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-on-surface-variant font-medium">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white shopify-border p-12 text-center text-on-surface-variant">
          No orders yet.
        </div>
      ) : (
        <div className="bg-white shopify-border overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/40">
              <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 && selectedIds.length === filteredOrders.length
                    }
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? filteredOrders.map((o) => o.id) : [])
                    }
                    className="cursor-pointer"
                  />
                </th>
                <th className="p-4">Order Info</th>
                <th className="p-4">Customer & Phone</th>
                <th className="p-4">Payment Tracking</th>
                <th className="p-4">Shipment Tracking</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {filteredOrders.map((o) => {
                const isExpanded = expandedId === o.id;
                const isSelected = selectedIds.includes(o.id);
                const addr = o.shipping_address || {};

                return (
                  <React.Fragment key={o.id}>
                    <tr
                      className={`hover:bg-surface-container-lowest transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            setSelectedIds(
                              e.target.checked
                                ? [...selectedIds, o.id]
                                : selectedIds.filter((id) => id !== o.id),
                            )
                          }
                          className="cursor-pointer"
                        />
                      </td>
                      <td
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : o.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-on-surface-variant">
                            {isExpanded ? "expand_less" : "expand_more"}
                          </span>
                          <div>
                            <p className="font-bold text-primary hover:underline">
                              {o.order_number}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">
                              {new Date(o.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : o.id)}
                      >
                        <p className="font-medium text-primary">{o.email}</p>
                        <p className="text-xs text-on-surface-variant">
                          {o.phone || "No phone provided"}
                        </p>
                        {addr.gstin && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            GSTIN: {addr.gstin}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-primary">{formatINR(o.total_paise)}</p>
                        <p className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          pay_{o.id.substring(0, 10)}
                        </p>
                      </td>
                      <td className="p-4">
                        {o.tracking_url ? (
                          <div className="space-y-1">
                            <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded block w-max">
                              {o.tracking_url.split("/").pop()}
                            </span>
                            <a
                              href={o.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary underline hover:text-primary/80 block"
                            >
                              Test Live Link ↗
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block font-medium">
                            Pending AWB Assignment
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="border border-outline-variant/40 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest shadow-sm focus:border-primary"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right space-y-1.5">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : o.id)}
                          className="border border-outline-variant/40 bg-white text-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest block w-full text-center hover:bg-surface-container-lowest transition-colors shadow-sm"
                        >
                          {isExpanded ? "Close Panel" : "Expand OMS ⚙️"}
                        </button>
                        {!o.tracking_url && o.status !== "cancelled" && (
                          <button
                            disabled={simulatingId === o.id}
                            onClick={() => generateAWB(o.id, o.order_number)}
                            className="bg-blue-600 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest block w-full text-center hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                          >
                            {simulatingId === o.id ? "Assigning…" : "+ Shiprocket AWB"}
                          </button>
                        )}
                        {o.status === "pending" && (
                          <button
                            onClick={() => simulateRazorpayWebhook(o.id)}
                            className="bg-emerald-600 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest block w-full text-center hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            Simulate Paid Webhook
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded OMS Details Panel */}
                    {isExpanded && (
                      <tr className="bg-surface-container-lowest border-b border-outline-variant/40">
                        <td colSpan={7} className="p-6 md:p-8">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Shipping Address & Details */}
                            <div className="bg-white p-6 border border-outline-variant/40 rounded shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                                <h4 className="font-bold text-sm text-primary uppercase tracking-tight flex items-center gap-2">
                                  <span className="material-symbols-outlined text-base text-primary">
                                    local_shipping
                                  </span>
                                  Customer Shipping Address
                                </h4>
                                <button
                                  onClick={() => printPackingSlip(o)}
                                  className="bg-primary text-on-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm hover:opacity-90 flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-xs">print</span>
                                  Print Slip
                                </button>
                              </div>
                              <div className="text-xs text-on-surface-variant space-y-1.5 leading-relaxed font-medium">
                                <p className="font-bold text-primary text-sm">
                                  {addr.first_name || "Customer"} {addr.last_name || ""}
                                </p>
                                <p>{addr.line1 || "No address line 1 provided"}</p>
                                {addr.line2 && <p>{addr.line2}</p>}
                                <p>
                                  {addr.city || "City"}, {addr.state || "State"} -{" "}
                                  <span className="font-bold text-primary">
                                    {addr.pincode || "PIN"}
                                  </span>
                                </p>
                                <p className="pt-2 border-t border-outline-variant/20">
                                  <strong>Phone:</strong> {o.phone || "N/A"}
                                </p>
                                <p>
                                  <strong>Email:</strong> {o.email}
                                </p>
                                {addr.gstin && (
                                  <p className="text-purple-700 font-bold">
                                    <strong>Business GSTIN:</strong> {addr.gstin}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Shiprocket AWB Preparation */}
                            <div className="bg-white p-6 border border-outline-variant/40 rounded shadow-sm space-y-4">
                              <h4 className="font-bold text-sm text-primary uppercase tracking-tight border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-blue-600">
                                  inventory_2
                                </span>
                                Shiprocket Package Prep
                              </h4>
                              <div className="space-y-3 text-xs">
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                                    Package Weight (KG)
                                  </label>
                                  <input
                                    type="text"
                                    value={pkgWeight}
                                    onChange={(e) => setPkgWeight(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant/40 p-2 font-medium focus:outline-none focus:border-primary"
                                    placeholder="e.g. 0.5"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                                    Dimensions L×W×H (CM)
                                  </label>
                                  <input
                                    type="text"
                                    value={pkgDims}
                                    onChange={(e) => setPkgDims(e.target.value)}
                                    className="w-full bg-surface-container-low border border-outline-variant/40 p-2 font-medium focus:outline-none focus:border-primary"
                                    placeholder="e.g. 20x15x10"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                                    Pickup Location
                                  </label>
                                  <select className="w-full bg-surface-container-low border border-outline-variant/40 p-2 font-medium focus:outline-none focus:border-primary">
                                    <option>Primary Warehouse (Mumbai)</option>
                                    <option>Secondary Hub (Bengaluru)</option>
                                  </select>
                                </div>
                                <button
                                  disabled={simulatingId === o.id || !!o.tracking_url}
                                  onClick={() => generateAWB(o.id, o.order_number)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-bold text-[11px] uppercase tracking-widest rounded shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <span className="material-symbols-outlined text-sm">send</span>
                                  {o.tracking_url
                                    ? "AWB Already Generated"
                                    : "Generate Shiprocket AWB"}
                                </button>
                              </div>
                            </div>

                            {/* Internal Seller Notes */}
                            <div className="bg-white p-6 border border-outline-variant/40 rounded shadow-sm space-y-4">
                              <h4 className="font-bold text-sm text-primary uppercase tracking-tight border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-amber-600">
                                  note_alt
                                </span>
                                Seller Operational Notes
                              </h4>
                              <div className="space-y-3 text-xs">
                                <p className="text-[11px] text-on-surface-variant">
                                  Add internal reminders about customer requests, packaging
                                  preferences, or verification calls.
                                </p>
                                <textarea
                                  value={sellerNotes[o.id] || ""}
                                  onChange={(e) =>
                                    setSellerNotes({ ...sellerNotes, [o.id]: e.target.value })
                                  }
                                  rows={4}
                                  className="w-full bg-surface-container-low border border-outline-variant/40 p-3 font-medium focus:outline-none focus:border-primary resize-none"
                                  placeholder="e.g. Customer called to confirm express delivery before Friday..."
                                />
                                <button
                                  onClick={() => saveSellerNote(o.id)}
                                  className="w-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary border border-outline-variant/40 py-2.5 font-bold text-[11px] uppercase tracking-widest rounded shadow-sm transition-all flex items-center justify-center gap-1.5"
                                >
                                  <span className="material-symbols-outlined text-sm">save</span>
                                  Save Internal Notes
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
