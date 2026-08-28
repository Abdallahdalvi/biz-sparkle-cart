import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatINR } from "@/lib/format";

interface OrderItemRow {
  name: string;
  qty: number;
  unit_price_paise: number;
  variant_label?: string | null;
  image_url?: string | null;
}

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

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  subtotal_paise: number;
  shipping_paise: number;
  tax_paise: number;
  total_paise: number;
  created_at: string;
  tracking_url: string | null;
  notes?: string | null;
  cashfree_payment_id?: string | null;
  cashfree_refund_status?: string | null;
  refund_amount_paise?: number | null;
  razorpay_payment_id?: string | null;
  shiprocket_order_id?: string | null;
  shiprocket_shipment_id?: string | null;
  shipping_address?: ShippingAddress | null;
  order_items?: OrderItemRow[];
}

export const Route = createFileRoute("/account/orders")({
  component: Orders,
});

const ORDER_STEPS = [
  { status: "pending", label: "Pending" },
  { status: "paid", label: "Paid" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

function getStepIndex(status: string) {
  const s = status.toLowerCase();
  if (s === "cancelled" || s === "refunded") return -1;
  const idx = ORDER_STEPS.findIndex((step) => step.status === s);
  return idx === -1 ? 0 : idx;
}

function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select(
        "id, order_number, status, subtotal_paise, shipping_paise, tax_paise, total_paise, created_at, tracking_url, notes, cashfree_payment_id, cashfree_refund_status, refund_amount_paise, razorpay_payment_id, shiprocket_order_id, shiprocket_shipment_id, shipping_address, order_items(name, qty, unit_price_paise, variant_label, image_url)",
      )
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        else setOrders((data as OrderRow[]) ?? []);
      });
  }, [user]);

  if (authLoading)
    return <p className="text-on-surface-variant animate-pulse">Loading your order history…</p>;
  if (!user) {
    return (
      <div className="bg-white shopify-border p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
        <h2 className="text-2xl font-bold text-primary mb-2">View Your Orders & Shipments</h2>
        <p className="text-on-surface-variant mb-6 text-sm">
          Sign in to track your active shipments and review your order history.
        </p>
        <Link
          to="/auth"
          className="inline-block bg-primary text-on-primary px-8 py-3.5 font-bold text-xs uppercase tracking-widest shadow-md hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
      </div>
    );
  }
  if (err)
    return (
      <p className="text-destructive text-sm bg-destructive/10 p-4 border border-destructive/20">
        {err}
      </p>
    );
  if (!orders)
    return (
      <p className="text-on-surface-variant animate-pulse">Loading orders and tracking data…</p>
    );
  if (orders.length === 0)
    return (
      <div className="bg-white shopify-border p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
        <p className="text-on-surface-variant mb-6">You don't have any orders yet.</p>
        <Link
          to="/catalog"
          className="inline-block bg-primary text-on-primary px-8 py-3.5 font-bold text-xs uppercase tracking-widest shadow hover:opacity-90 transition-all"
        >
          Browse the Catalog
        </Link>
      </div>
    );

  return (
    <div className="space-y-8">
      {orders.map((o) => {
        const stepIdx = getStepIndex(o.status);
        const isCancelled =
          o.status.toLowerCase() === "cancelled" || o.status.toLowerCase() === "refunded";
        const estimatedDays =
          o.status === "delivered" ? "Delivered successfully" : "3-5 business days via Shiprocket";
        const isCod = o.notes === "cod";
        const onlinePaymentVerified = Boolean(o.cashfree_payment_id || o.razorpay_payment_id);
        const refundStatus = o.cashfree_refund_status?.toUpperCase();
        const merchandiseSubtotal =
          Number(o.subtotal_paise) ||
          (o.order_items ?? []).reduce((sum, item) => sum + item.unit_price_paise * item.qty, 0);
        const pricingAdjustment =
          Number(o.total_paise) -
          (merchandiseSubtotal + Number(o.shipping_paise || 0) + Number(o.tax_paise || 0));
        const addr = o.shipping_address || {};

        return (
          <div
            key={o.id}
            className="bg-white shopify-border overflow-hidden shadow-sm hover:shadow transition-shadow"
          >
            {/* Header section */}
            <div className="bg-surface-container-low p-6 border-b border-outline-variant/40 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-1">
                  Order Identifier
                </p>
                <p className="font-bold text-lg text-primary">{o.order_number}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Placed on {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-1">
                  Final Order Total
                </p>
                <p className="font-bold text-xl text-primary">{formatINR(o.total_paise)}</p>
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded mt-1 ${isCod ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}
                >
                  {isCod ? "Cash on Delivery (COD)" : "Online payment"}
                </span>
              </div>
            </div>

            {/* Order Items List */}
            <div className="p-6 border-b border-outline-variant/40 bg-white space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Order Items
              </h4>
              <div className="divide-y divide-outline-variant/30">
                {(o.order_items || []).map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 object-cover border border-outline-variant/40 rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-surface-container flex items-center justify-center text-xs font-bold text-on-surface-variant rounded">
                          IMG
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-primary">{item.name}</p>
                        {item.variant_label && (
                          <p className="text-xs text-on-surface-variant">
                            Variant: {item.variant_label}
                          </p>
                        )}
                        <p className="text-xs text-on-surface-variant">Qty: {item.qty}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">
                        {formatINR(item.unit_price_paise * item.qty)}
                      </p>
                      <p className="text-[9px] uppercase tracking-wider text-on-surface-variant">
                        Line amount
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="max-w-sm ml-auto border-t border-outline-variant/40 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Merchandise subtotal</span>
                  <span>{formatINR(merchandiseSubtotal)}</span>
                </div>
                {Number(o.shipping_paise || 0) > 0 ? (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Shipping</span>
                    <span>{formatINR(o.shipping_paise)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Shipping</span>
                    <span>FREE</span>
                  </div>
                )}
                {Number(o.tax_paise || 0) > 0 && (
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Tax</span>
                    <span>{formatINR(o.tax_paise)}</span>
                  </div>
                )}
                {pricingAdjustment < 0 && (
                  <div className="flex justify-between font-medium text-emerald-700">
                    <span>Prepaid discount</span>
                    <span>-{formatINR(Math.abs(pricingAdjustment))}</span>
                  </div>
                )}
                {pricingAdjustment > 0 && (
                  <div className="flex justify-between font-medium text-purple-800">
                    <span>COD fee</span>
                    <span>+{formatINR(pricingAdjustment)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-primary pt-2 text-sm font-black text-primary">
                  <span>FINAL PAYABLE TOTAL</span>
                  <span>{formatINR(o.total_paise)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address & GSTIN */}
            <div className="p-6 border-b border-outline-variant/40 bg-surface-container-lowest grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                  Delivery Address
                </span>
                <p className="font-bold text-primary">
                  {addr.first_name} {addr.last_name}
                </p>
                <p className="text-on-surface-variant mt-1">
                  {addr.line1} {addr.line2 ? `, ${addr.line2}` : ""}
                </p>
                <p className="text-on-surface-variant">
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="text-on-surface-variant mt-1">Country: {addr.country || "IN"}</p>
              </div>
              <div>
                <span className="font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                  Billing & Compliance
                </span>
                {addr.gstin ? (
                  <div className="bg-white p-3 border border-outline-variant/40 rounded space-y-1">
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                      B2B GST Registered
                    </span>
                    <p className="text-xs font-bold text-primary pt-1">GSTIN: {addr.gstin}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      Eligible for Input Tax Credit (ITC)
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-3 border border-outline-variant/40 rounded space-y-1">
                    <span className="text-[10px] bg-surface-container-high text-on-surface-variant font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                      B2C Retail Customer
                    </span>
                    <p className="text-xs text-on-surface-variant pt-1">
                      No GSTIN provided. Standard retail bill generated.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Timeline / Progress Bar */}
            <div className="p-6 border-b border-outline-variant/40 bg-white">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Fulfilment Status
                </p>
                <span
                  className={
                    "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded " +
                    (isCancelled
                      ? "bg-destructive/10 text-destructive"
                      : o.status === "delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-primary/10 text-primary")
                  }
                >
                  {o.status}
                </span>
              </div>

              {!isCancelled ? (
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-0 right-0 h-1 bg-outline-variant/40 z-0"></div>
                  <div
                    className="absolute top-4 left-0 h-1 bg-primary z-0 transition-all duration-500"
                    style={{ width: `${(stepIdx / (ORDER_STEPS.length - 1)) * 100}%` }}
                  ></div>

                  {/* Step Indicators */}
                  <div className="flex justify-between relative z-10">
                    {ORDER_STEPS.map((step, idx) => {
                      const completed = idx <= stepIdx;
                      return (
                        <div key={step.status} className="flex flex-col items-center group">
                          <div
                            className={
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all " +
                              (completed
                                ? "bg-primary text-on-primary shadow"
                                : "bg-surface-container text-on-surface-variant border border-outline-variant/40")
                            }
                          >
                            {idx + 1}
                          </div>
                          <span
                            className={
                              "text-[11px] mt-2 font-bold uppercase tracking-wider " +
                              (completed ? "text-primary" : "text-on-surface-variant")
                            }
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-destructive font-semibold">This order was {o.status}.</p>
              )}
            </div>

            {/* Shipment & Payment Tracking Info */}
            <div className="p-6 bg-surface-container-lowest grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipment Tracking Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Shipment Tracking
                  </h4>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    Shiprocket / Bluedart
                  </span>
                </div>
                <div className="bg-white p-4 border border-outline-variant/40 rounded space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">AWB Number:</span>
                    <span className="font-mono font-bold text-primary">
                      {o.tracking_url
                        ? o.tracking_url.split("/").pop() || "SRK-" + o.order_number
                        : o.shiprocket_shipment_id
                          ? "AWB-" + o.shiprocket_shipment_id
                          : "SRK-" + o.order_number}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Est. Delivery:</span>
                    <span className="font-medium text-primary">{estimatedDays}</span>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between">
                    <span className="text-[11px] text-on-surface-variant">
                      Status:{" "}
                      {o.status === "pending"
                        ? "Queued for pickup"
                        : o.status === "shipped"
                          ? "In Transit"
                          : o.status}
                    </span>
                    <Link
                      to="/track"
                      search={{ orderId: o.order_number }}
                      className="inline-block bg-primary text-on-primary px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
                    >
                      Track Package ↗
                    </Link>
                  </div>
                </div>
              </div>

              {/* Payment Tracking Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-primary flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${refundStatus === "SUCCESS" ? "bg-rose-500" : isCod || onlinePaymentVerified ? "bg-emerald-500" : "bg-amber-500"}`}
                    ></span>
                    Payment Tracking
                  </h4>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {isCod ? "Cash on Delivery" : "Cashfree online payment"}
                  </span>
                </div>
                <div className="bg-white p-4 border border-outline-variant/40 rounded space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Transaction ID:</span>
                    <span className="font-mono font-bold text-primary">
                      {o.cashfree_payment_id ||
                        o.razorpay_payment_id ||
                        (isCod ? "Collected on delivery" : "Pending")}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Payment Method:</span>
                    <span className="font-medium text-primary">
                      {isCod ? "Cash on Delivery (COD)" : "UPI / Card / NetBanking"}
                    </span>
                  </div>
                  {refundStatus && (
                    <div className="flex justify-between text-xs">
                      <span className="text-on-surface-variant">Refund:</span>
                      <span
                        className={`font-bold ${refundStatus === "SUCCESS" ? "text-emerald-700" : "text-amber-700"}`}
                      >
                        {refundStatus}
                        {o.refund_amount_paise ? ` · ${formatINR(o.refund_amount_paise)}` : ""}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between">
                    <span className="text-[11px] text-on-surface-variant">
                      Verification:{" "}
                      {isCod
                        ? "COD confirmed"
                        : onlinePaymentVerified
                          ? "Cashfree API + Webhook"
                          : "Awaiting Cashfree payment"}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-widest ${isCod || onlinePaymentVerified ? "text-emerald-600" : "text-amber-700"}`}
                    >
                      {refundStatus === "SUCCESS"
                        ? "Refunded"
                        : refundStatus === "PENDING"
                          ? "Refund Pending"
                          : isCod
                            ? "Confirmed"
                            : onlinePaymentVerified
                              ? "Paid & Verified"
                              : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
