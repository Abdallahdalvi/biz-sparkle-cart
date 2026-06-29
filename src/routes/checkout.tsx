import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { verifyRazorpayPayment } from "@/lib/razorpay.functions";
import { createSecureOrder } from "@/lib/orders.functions";
import { getStorefrontCms } from "@/lib/products";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export const Route = createFileRoute("/checkout")({
  loader: async () => {
    const cms = await getStorefrontCms();
    return { cms };
  },
  head: () => ({ meta: [{ title: "Checkout — TECHLAB" }, { name: "robots", content: "noindex" }] }),
  component: Checkout,
});

function Checkout() {
  const { cms } = Route.useLoaderData();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.totalPaise());
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [payMode, setPayMode] = useState<"prepaid" | "cod">("prepaid");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPaise: number } | null>(null);
  const { user } = useAuth();
  const createOrderFn = useServerFn(createSecureOrder);
  const verifyRzp = useServerFn(verifyRazorpayPayment);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="max-w-xl mx-auto py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Link to="/catalog" className="text-primary underline">
            Browse catalog
          </Link>
        </div>
      </SiteShell>
    );
  }

  // Calculate prepaid discount in paise
  let prepaidDiscountPaise = 0;
  if (cms.prepaid_discount_type === "flat") {
    prepaidDiscountPaise = cms.prepaid_discount_amount * 100;
  } else if (cms.prepaid_discount_type === "percent") {
    prepaidDiscountPaise = Math.round((total * cms.prepaid_discount_amount) / 100);
  }

  // Calculate COD charge in paise
  let codChargePaise = 0;
  if (cms.cod_charge_type !== "none") {
    codChargePaise = cms.cod_charge_amount * 100;
  }

  let baseEffective =
    payMode === "prepaid"
      ? Math.max(0, total - prepaidDiscountPaise)
      : cms.cod_charge_type === "additional"
        ? total + codChargePaise
        : total;

  if (appliedPromo) {
    baseEffective = Math.max(0, baseEffective - appliedPromo.discountPaise);
  }

  const effectiveTotal = baseEffective;

  const rzpAmountPaise = payMode === "cod" ? codChargePaise : effectiveTotal;

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12">
        <h1 className="text-4xl font-bold text-primary mb-6">Checkout</h1>
        
        {/* Abandoned Cart Recovery & Price Freeze Banner */}
        <div className="bg-amber-50 border border-amber-500/30 p-4 rounded mb-8 flex items-center justify-between text-xs text-amber-950 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-xl animate-pulse">lock_clock</span>
            <div>
              <p className="font-bold uppercase tracking-wider">Cart Reserved & Price Freeze Active</p>
              <p className="text-on-surface-variant text-[11px]">Your boutique items are locked in high-demand queue for 30 minutes. If disconnected, your cart recovery discount will be sent via WhatsApp.</p>
            </div>
          </div>
          <span className="hidden sm:inline-block bg-amber-600 text-white font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">HIGH DEMAND</span>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setBusy(true);
            try {
              const shipping_address = {
                first_name: String(fd.get("firstName") || ""),
                last_name: String(fd.get("lastName") || ""),
                line1: String(fd.get("line1") || ""),
                line2: String(fd.get("line2") || ""),
                city: String(fd.get("city") || ""),
                state: String(fd.get("state") || ""),
                pincode: String(fd.get("pincode") || ""),
                country: "IN",
                gstin: String(fd.get("gstin") || ""),
              };

              const { data: sessionData } = await supabase.auth.getSession();
              const token = sessionData.session?.access_token;

              const orderPayload = {
                token,
                items: items.map((i) => ({
                  slug: i.slug,
                  variantId: i.variantId,
                  qty: i.qty,
                })),
                shippingAddress: shipping_address,
                payMode: payMode,
                email: String(fd.get("email") ?? ""),
                phone: String(fd.get("phone") ?? ""),
              };

              const res = await createOrderFn({ data: orderPayload });

              if (!res.rzpRequired) {
                clear();
                toast.success(`Order ${res.orderNumber} confirmed with Cash on Delivery.`);
                if (!token) {
                  navigate({ to: "/track", search: { orderId: res.orderNumber } });
                } else {
                  navigate({ to: "/account/orders" });
                }
                return;
              }

              const ok = await loadRazorpayScript();
              if (!ok || !window.Razorpay) throw new Error("Razorpay SDK failed to load");

              const checkout = new window.Razorpay({
                key: res.keyId,
                amount: res.amountPaise,
                currency: res.currency,
                name: "TECHLAB",
                description:
                  payMode === "cod"
                    ? `COD ${cms.cod_charge_type === "advance" ? "Advance" : "Fee"} Order ${res.orderNumber}`
                    : `Order ${res.orderNumber}`,
                order_id: res.rzpOrderId,
                prefill: {
                  email: res.email,
                  contact: String(fd.get("phone") ?? ""),
                  name: `${fd.get("firstName")} ${fd.get("lastName")}`.trim(),
                },
                theme: { color: "#000000" },
                handler: async (resp: {
                  razorpay_order_id: string;
                  razorpay_payment_id: string;
                  razorpay_signature: string;
                }) => {
                  try {
                    await verifyRzp({ data: { orderId: res.orderId, ...resp } });
                    clear();
                    toast.success(
                      payMode === "cod"
                        ? `COD ${cms.cod_charge_type === "advance" ? "Advance" : "Fee"} received. Order ${res.orderNumber} confirmed.`
                        : `Payment received. Order ${res.orderNumber} confirmed.`,
                    );
                    if (!token) {
                      navigate({ to: "/track", search: { orderId: res.orderNumber } });
                    } else {
                      navigate({ to: "/account/orders" });
                    }
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Verification failed");
                  }
                },
                modal: {
                  ondismiss: () => {
                    toast.message(
                      `Order ${res.orderNumber} saved as pending — you can complete payment from your account.`,
                    );
                    setBusy(false);
                  },
                },
              });
              checkout.open();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Checkout failed");
              setBusy(false);
            }
          }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 space-y-6">
            <fieldset className="bg-white shopify-border p-6 space-y-4">
              <legend className="px-2 text-[11px] font-bold uppercase tracking-widest">
                Contact
              </legend>
              <Input name="email" type="email" required placeholder="Email address" />
              <Input
                name="phone"
                type="tel"
                required
                placeholder="Phone (+91)"
                pattern="[0-9+\\-\\s]{10,15}"
              />
            </fieldset>
            <fieldset className="bg-white shopify-border p-6 space-y-4">
              <legend className="px-2 text-[11px] font-bold uppercase tracking-widest">
                Shipping Address
              </legend>
              <div className="grid grid-cols-2 gap-4">
                <Input name="firstName" required placeholder="First name" />
                <Input name="lastName" required placeholder="Last name" />
              </div>
              <Input name="line1" required placeholder="Address line 1" />
              <Input name="line2" placeholder="Address line 2 (optional)" />
              <div className="grid grid-cols-3 gap-4">
                <Input name="city" required placeholder="City" />
                <Input name="state" required placeholder="State" />
                <Input name="pincode" required placeholder="PIN code" pattern="[0-9]{6}" />
              </div>
              <div className="pt-2 border-t border-outline-variant/30">
                <label className="text-[11px] font-bold uppercase tracking-widest text-primary block mb-1">
                  Business GSTIN (Optional for 18% ITC)
                </label>
                <Input
                  name="gstin"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                  title="Enter a valid 15-digit GSTIN"
                />
              </div>
            </fieldset>
            <fieldset className="bg-white shopify-border p-6 space-y-4">
              <legend className="px-2 text-[11px] font-bold uppercase tracking-widest">
                Payment Mode
              </legend>
              <label
                className={`flex items-start gap-3 p-4 border rounded cursor-pointer transition-colors ${payMode === "prepaid" ? "border-primary bg-primary/5" : "border-outline-variant/40 bg-white"}`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={payMode === "prepaid"}
                  onChange={() => setPayMode("prepaid")}
                  className="mt-1 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-primary">
                      Razorpay (UPI / Cards / Net Banking)
                    </p>
                    {cms.prepaid_discount_type !== "none" && cms.prepaid_discount_amount > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {cms.prepaid_discount_type === "flat"
                          ? `₹${cms.prepaid_discount_amount} OFF`
                          : `${cms.prepaid_discount_amount}% OFF`}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-1">
                    {cms.prepaid_discount_type === "none" || cms.prepaid_discount_amount === 0
                      ? "Instant secure payment via Razorpay"
                      : `Instant ${cms.prepaid_discount_type === "flat" ? `₹${cms.prepaid_discount_amount}` : `${cms.prepaid_discount_amount}%`} Discount on Prepaid Orders`}
                  </p>
                </div>
              </label>
              <label
                className={`flex items-start gap-3 p-4 border rounded cursor-pointer transition-colors ${payMode === "cod" ? "border-primary bg-primary/5" : "border-outline-variant/40 bg-white"}`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={payMode === "cod"}
                  onChange={() => setPayMode("cod")}
                  className="mt-1 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-primary">Cash on Delivery (COD)</p>
                    {cms.cod_charge_type === "advance" && cms.cod_charge_amount > 0 && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        ₹{cms.cod_charge_amount} Advance
                      </span>
                    )}
                    {cms.cod_charge_type === "additional" && cms.cod_charge_amount > 0 && (
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        +₹{cms.cod_charge_amount} Fee
                      </span>
                    )}
                    {(cms.cod_charge_type === "none" || cms.cod_charge_amount === 0) && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        FREE COD
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-1">
                    {cms.cod_charge_type === "advance" && cms.cod_charge_amount > 0
                      ? `Requires ₹${cms.cod_charge_amount} advance payment via Razorpay to prevent order cancellations`
                      : cms.cod_charge_type === "additional" && cms.cod_charge_amount > 0
                        ? `Includes ₹${cms.cod_charge_amount} additional COD handling fee (collected now via Razorpay)`
                        : "Pay via cash or UPI when your package arrives at your doorstep"}
                  </p>
                </div>
              </label>
            </fieldset>
          </div>
          <aside className="bg-white shopify-border p-6 h-fit space-y-4">
            <h2 className="font-bold uppercase tracking-widest text-sm">Summary</h2>
            {items.map((i) => (
              <div key={i.slug + (i.variantId ?? "")} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">
                  {i.name} × {i.qty}
                </span>
                <span className="font-bold">{formatINR(i.pricePaise * i.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-bold">{formatINR(total)}</span>
            </div>
            {payMode === "prepaid" && prepaidDiscountPaise > 0 && (
              <div className="flex justify-between text-sm text-emerald-700 font-medium">
                <span>Prepaid Instant Discount</span>
                <span>-{formatINR(prepaidDiscountPaise)}</span>
              </div>
            )}
            {payMode === "cod" && cms.cod_charge_type === "additional" && codChargePaise > 0 && (
              <div className="flex justify-between text-sm text-purple-800 font-medium">
                <span>COD Additional Fee</span>
                <span>+{formatINR(codChargePaise)}</span>
              </div>
            )}
            {payMode === "cod" && cms.cod_charge_type === "advance" && codChargePaise > 0 && (
              <div className="flex justify-between text-sm text-amber-800 font-medium">
                <span>COD Advance Booking Fee</span>
                <span>+{formatINR(codChargePaise)}</span>
              </div>
            )}
            {appliedPromo && (
              <div className="flex justify-between text-sm text-emerald-700 font-medium border-t border-outline-variant/30 pt-2">
                <span className="flex items-center gap-1">
                  <span>Promo ({appliedPromo.code})</span>
                  <button type="button" onClick={() => { setAppliedPromo(null); toast.message("Promo code removed"); }} className="text-xs text-destructive hover:underline">(remove)</button>
                </span>
                <span>-{formatINR(appliedPromo.discountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Shipping</span>
              <span className="font-bold">FREE</span>
            </div>
            <div className="flex justify-between text-base border-t pt-3">
              <span className="font-bold">Total</span>
              <span className="font-bold">{formatINR(effectiveTotal)}</span>
            </div>

            {/* Promo Code Engine Input Box */}
            <div className="pt-2 border-t border-outline-variant/30 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-primary block">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TECH10 / DROP20"
                  className="bg-surface-container-low border border-outline-variant/40 px-3 py-2 text-xs focus:outline-none focus:border-primary flex-1 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const code = promoCode.trim();
                    if (!code) return;
                    if (code === "TECH10") {
                      setAppliedPromo({ code, discountPaise: Math.round(total * 0.10) });
                      toast.success("TECH10 applied: 10% OFF!");
                    } else if (code === "DROP20") {
                      setAppliedPromo({ code, discountPaise: Math.round(total * 0.20) });
                      toast.success("DROP20 applied: 20% OFF!");
                    } else if (code === "FREESHIP") {
                      setAppliedPromo({ code, discountPaise: 10000 });
                      toast.success("FREESHIP applied: Free Express Delivery priority!");
                    } else {
                      toast.error("Invalid promo code. Try TECH10 or DROP20");
                    }
                    setPromoCode("");
                  }}
                  className="bg-surface-container text-primary border border-outline px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
            <button
              disabled={busy}
              className="w-full bg-primary text-on-primary py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-50 shadow-sm"
            >
              {busy
                ? "Processing…"
                : payMode === "prepaid"
                  ? `Pay ${formatINR(effectiveTotal)}`
                  : rzpAmountPaise > 0
                    ? `Pay COD ${cms.cod_charge_type === "advance" ? "Advance" : "Fee"} ${formatINR(rzpAmountPaise)}`
                    : `Confirm Order (Pay on Delivery)`}
            </button>
            <p className="text-[10px] text-on-surface-variant text-center">
              By placing this order you agree to our{" "}
              <Link to="/legal/terms" className="underline">
                Terms
              </Link>
              ,{" "}
              <Link to="/legal/returns" className="underline">
                Returns
              </Link>
              , and{" "}
              <Link to="/legal/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </aside>
        </form>
      </section>
    </SiteShell>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-surface-container-low border border-outline-variant/40 px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
    />
  );
}
