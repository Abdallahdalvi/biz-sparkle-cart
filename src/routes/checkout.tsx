import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { load as loadCashfree } from "@cashfreepayments/cashfree-js";
import { z } from "zod";
import { SiteShell } from "@/components/layout/SiteShell";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { verifyCashfreePayment } from "@/lib/cashfree.functions";
import { createSecureOrder, getCheckoutCapabilities } from "@/lib/orders.functions";
import { getAllProducts, getStorefrontCms } from "@/lib/products";

export const Route = createFileRoute("/checkout")({
  validateSearch: z.object({
    cashfree_order_id: z.string().optional(),
    store_order_id: z.string().uuid().optional(),
  }),
  loader: async () => {
    const [cms, capabilities, products] = await Promise.all([
      getStorefrontCms(),
      getCheckoutCapabilities(),
      getAllProducts(),
    ]);
    return { cms, capabilities, products };
  },
  head: () => ({
    meta: [
      { title: "Checkout — Aghanims Phones and Gadgets" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { cms, capabilities, products } = Route.useLoaderData();
  const search = Route.useSearch();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.totalPaise());
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [payMode, setPayMode] = useState<"prepaid" | "cod">(
    capabilities.onlinePaymentsConfigured ? "prepaid" : "cod",
  );
  const { user } = useAuth();
  const createOrderFn = useServerFn(createSecureOrder);
  const verifyCashfree = useServerFn(verifyCashfreePayment);
  const returnVerificationStarted = useRef(false);

  useEffect(() => {
    if (returnVerificationStarted.current || !search.cashfree_order_id || !search.store_order_id) {
      return;
    }
    returnVerificationStarted.current = true;
    setBusy(true);
    verifyCashfree({
      data: {
        orderId: search.store_order_id,
        cashfreeOrderId: search.cashfree_order_id,
      },
    })
      .then((result) => {
        clear();
        toast.success(`Payment received. Order ${result.orderNumber} confirmed.`);
        navigate({
          to: user ? "/account/orders" : "/track",
          search: user ? {} : { orderId: result.orderNumber },
        });
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Cashfree payment is not complete");
        setBusy(false);
      });
  }, [clear, navigate, search.cashfree_order_id, search.store_order_id, user, verifyCashfree]);

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

  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  const codAdvancePaise = items.reduce(
    (sum, item) =>
      sum +
      Math.min(item.pricePaise, productsBySlug.get(item.slug)?.codAdvancePaise || 0) * item.qty,
    0,
  );

  const baseEffective = payMode === "prepaid" ? Math.max(0, total - prepaidDiscountPaise) : total;

  const effectiveTotal = baseEffective;

  const paymentAmountPaise = payMode === "cod" ? codAdvancePaise : effectiveTotal;
  const codAdvanceUnavailable = codAdvancePaise > 0 && !capabilities.onlinePaymentsConfigured;

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12">
        <h1 className="text-4xl font-bold text-primary mb-6">Checkout</h1>

        {!capabilities.onlinePaymentsConfigured && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-8 flex items-start gap-3 text-xs text-blue-950">
            <span className="material-symbols-outlined text-blue-700 text-xl">payments</span>
            <div>
              <p className="font-bold uppercase tracking-wider">Cash on Delivery is active</p>
              <p className="text-blue-900/80 mt-1">
                Models with no advance can be ordered normally. A model that requires an advance
                cannot be confirmed until online payments are available.
              </p>
            </div>
          </div>
        )}

        {capabilities.onlinePaymentsConfigured &&
          capabilities.onlinePaymentEnvironment === "sandbox" && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded mb-8 flex items-start gap-3 text-xs text-amber-950">
              <span className="material-symbols-outlined text-amber-700 text-xl">science</span>
              <div>
                <p className="font-bold uppercase tracking-wider">Cashfree sandbox is active</p>
                <p className="text-amber-900/80 mt-1">
                  Checkout is connected to Cashfree test mode. No real payment will be collected.
                </p>
              </div>
            </div>
          )}

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
                returnOrigin: window.location.origin,
              };

              const res = await createOrderFn({ data: orderPayload });

              if (!res.cashfreeRequired) {
                clear();
                toast.success(`Order ${res.orderNumber} confirmed with Cash on Delivery.`);
                if (!token) {
                  navigate({ to: "/track", search: { orderId: res.orderNumber } });
                } else {
                  navigate({ to: "/account/orders" });
                }
                return;
              }

              const cashfree = await loadCashfree({ mode: res.cashfreeMode });
              if (!cashfree) throw new Error("Cashfree SDK failed to load");
              const checkoutResult = await cashfree.checkout({
                paymentSessionId: res.paymentSessionId,
                redirectTarget: "_modal",
              });
              if (checkoutResult.redirect) {
                setBusy(false);
                return;
              }
              if (checkoutResult.error || !checkoutResult.paymentDetails) {
                toast.message(`Payment was not completed for order ${res.orderNumber}.`);
                setBusy(false);
                return;
              }

              const verified = await verifyCashfree({
                data: { orderId: res.orderId, cashfreeOrderId: res.cashfreeOrderId },
              });
              clear();
              toast.success(
                payMode === "cod"
                  ? `COD advance received. ${formatINR(total - paymentAmountPaise)} remains payable on delivery for order ${verified.orderNumber}.`
                  : `Payment received. Order ${verified.orderNumber} confirmed.`,
              );
              if (!token) {
                navigate({ to: "/track", search: { orderId: verified.orderNumber } });
              } else {
                navigate({ to: "/account/orders" });
              }
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
                  Business GSTIN (Optional)
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
                className={`flex items-start gap-3 p-4 border rounded transition-colors ${capabilities.onlinePaymentsConfigured ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${payMode === "prepaid" ? "border-primary bg-primary/5" : "border-outline-variant/40 bg-white"}`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={payMode === "prepaid"}
                  disabled={!capabilities.onlinePaymentsConfigured}
                  onChange={() => setPayMode("prepaid")}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-primary">
                      Online payment (UPI / Cards / Net Banking)
                    </p>
                    {capabilities.onlinePaymentsConfigured &&
                      cms.prepaid_discount_type !== "none" &&
                      cms.prepaid_discount_amount > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {cms.prepaid_discount_type === "flat"
                            ? `₹${cms.prepaid_discount_amount} OFF`
                            : `${cms.prepaid_discount_amount}% OFF`}
                        </span>
                      )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-1">
                    {!capabilities.onlinePaymentsConfigured
                      ? "Available after business verification"
                      : cms.prepaid_discount_type === "none" || cms.prepaid_discount_amount === 0
                        ? "Secure online payment"
                        : `Instant ${cms.prepaid_discount_type === "flat" ? `₹${cms.prepaid_discount_amount}` : `${cms.prepaid_discount_amount}%`} Discount on Prepaid Orders`}
                  </p>
                  {capabilities.onlinePaymentsConfigured && (
                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mt-1">
                      Secure checkout powered by Cashfree
                    </p>
                  )}
                </div>
              </label>
              <label
                className={`flex items-start gap-3 p-4 border rounded transition-colors ${codAdvanceUnavailable ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${payMode === "cod" ? "border-primary bg-primary/5" : "border-outline-variant/40 bg-white"}`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={payMode === "cod"}
                  disabled={codAdvanceUnavailable}
                  onChange={() => setPayMode("cod")}
                  className="mt-1 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-primary">Cash on Delivery (COD)</p>
                    {codAdvancePaise > 0 ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {formatINR(codAdvancePaise)} Advance
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        No Advance
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-1">
                    {codAdvancePaise > 0
                      ? `Pay ${formatINR(codAdvancePaise)} securely now; Shiprocket collects the remaining ${formatINR(total - codAdvancePaise)} on delivery`
                      : `Shiprocket collects the full ${formatINR(total)} on delivery`}
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
            {payMode === "cod" && codAdvancePaise > 0 && (
              <div className="flex justify-between text-sm text-amber-800 font-medium">
                <span>Advance payable now</span>
                <span>{formatINR(codAdvancePaise)}</span>
              </div>
            )}
            {payMode === "cod" && (
              <div className="flex justify-between text-sm font-medium text-blue-800">
                <span>Remaining COD to courier</span>
                <span>{formatINR(total - codAdvancePaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-base border-t pt-3">
              <span className="font-bold">Product Total</span>
              <span className="font-bold">{formatINR(effectiveTotal)}</span>
            </div>

            <button
              disabled={busy || codAdvanceUnavailable}
              className="w-full bg-primary text-on-primary py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-50 shadow-sm"
            >
              {codAdvanceUnavailable
                ? "COD Advance Temporarily Unavailable"
                : busy
                  ? "Processing…"
                  : payMode === "prepaid"
                    ? `Pay ${formatINR(effectiveTotal)}`
                    : paymentAmountPaise > 0
                      ? `Pay COD Advance ${formatINR(paymentAmountPaise)}`
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
