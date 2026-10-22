import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { load as loadCashfree } from "@cashfreepayments/cashfree-js";
import { z } from "zod";
import { SiteShell } from "@/components/layout/SiteShell";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { verifyCashfreePayment } from "@/lib/cashfree.functions";
import { createSecureOrder, getCheckoutCapabilities } from "@/lib/orders.functions";
import { getAllProducts, getStorefrontCms } from "@/lib/products";
import { rememberOrderReceipt } from "@/lib/order-receipt-client";
import { readTrackingConsent, trackCommerceEvent } from "@/lib/tracking";
import { SITE_URL } from "@/lib/site";
import {
  calculateGiftOrderAmounts,
  GIFT_CARD_MESSAGES,
  GIFT_CARD_PRICE_PAISE,
} from "@/lib/gift-card";
import { GiftCardSummary } from "@/components/GiftCardSummary";
import { previewCoupon } from "@/lib/coupons.functions";
import { checkoutDiscount, couponDiscountForMerchandise } from "@/lib/coupons";

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

function readBrowserCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const part = document.cookie.split(";").find((item) => item.trim().startsWith(prefix));
  if (!part) return undefined;
  const rawValue = part.trim().slice(prefix.length);
  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

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
  const createOrderFn = useServerFn(createSecureOrder);
  const previewCouponFn = useServerFn(previewCoupon);
  const [couponInput, setCouponInput] = useState("");
  const [couponEmail, setCouponEmail] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    amountPaise: number;
    email: string;
  } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");
  const couponRequestVersion = useRef(0);
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [giftTo, setGiftTo] = useState("");
  const [giftFrom, setGiftFrom] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const verifyCashfree = useServerFn(verifyCashfreePayment);
  const returnVerificationStarted = useRef(false);
  const beginCheckoutTracked = useRef(false);
  const paymentMethodsTracked = useRef(new Set<string>());
  const trackingItems = useMemo(
    () =>
      items.map((item) => ({
        item_id: item.slug,
        item_name: item.name,
        item_variant: item.variantLabel,
        price: item.pricePaise / 100,
        quantity: item.qty,
      })),
    [items],
  );

  useEffect(() => {
    const canonical = new URL(SITE_URL);
    const isStorefrontAlias = ["aghanimsphones.in", "www.aghanimsphones.in"].includes(
      window.location.hostname,
    );
    if (isStorefrontAlias && window.location.origin !== canonical.origin) {
      window.location.replace(
        `${canonical.origin}${window.location.pathname}${window.location.search}${window.location.hash}`,
      );
    }
  }, []);

  useEffect(() => {
    if (beginCheckoutTracked.current || items.length === 0) return;
    beginCheckoutTracked.current = true;
    trackCommerceEvent("begin_checkout", {
      currency: "INR",
      value: total / 100,
      items: trackingItems,
    });
  }, [items.length, total, trackingItems]);

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
        rememberOrderReceipt(result.orderId, result.receiptToken);
        trackCommerceEvent("purchase", {
          currency: "INR",
          value: result.totalPaise / 100,
          transactionId: result.orderNumber,
          items: trackingItems,
        });
        clear();
        toast.success(`Payment received. Order ${result.orderNumber} confirmed.`);
        navigate({
          to: "/order/thank-you/$orderId",
          params: { orderId: result.orderId },
          replace: true,
        });
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Cashfree payment is not complete");
        setBusy(false);
      });
  }, [
    clear,
    navigate,
    search.cashfree_order_id,
    search.store_order_id,
    total,
    trackingItems,
    verifyCashfree,
  ]);

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="max-w-xl mx-auto py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Link to="/products" className="text-primary underline">
            Browse products
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
  const activeCoupon =
    payMode === "prepaid" &&
    appliedCoupon?.email === couponEmail.trim().toLowerCase() &&
    appliedCoupon.code === couponInput.trim().toUpperCase()
      ? appliedCoupon
      : null;
  prepaidDiscountPaise = checkoutDiscount(
    payMode,
    prepaidDiscountPaise,
    activeCoupon ? couponDiscountForMerchandise(activeCoupon.amountPaise, total) : undefined,
  );

  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  const codAdvancePaise = items.reduce(
    (sum, item) =>
      sum +
      Math.min(item.pricePaise, productsBySlug.get(item.slug)?.codAdvancePaise || 0) * item.qty,
    0,
  );

  const amounts = calculateGiftOrderAmounts({
    merchandisePaise: total,
    prepaidDiscountPaise,
    codAdvancePaise,
    payMode,
    hasGiftCard: giftEnabled,
  });
  const effectiveTotal = amounts.totalPaise;

  const paymentAmountPaise = payMode === "cod" ? codAdvancePaise : effectiveTotal;
  const codAdvanceUnavailable = codAdvancePaise > 0 && !capabilities.onlinePaymentsConfigured;
  const deliveryEstimateItems = items
    .map((item) => ({
      name: item.name,
      estimate: productsBySlug.get(item.slug)?.deliveryEstimate,
    }))
    .filter((item): item is { name: string; estimate: string } => Boolean(item.estimate));

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

              const marketingConsent = readTrackingConsent()?.marketing === true;
              if (!paymentMethodsTracked.current.has(payMode)) {
                trackCommerceEvent("add_payment_info", {
                  currency: "INR",
                  value: effectiveTotal / 100,
                  items: trackingItems,
                  paymentMethod: payMode === "cod" ? "Cash on Delivery" : "Cashfree online",
                });
                paymentMethodsTracked.current.add(payMode);
              }
              const orderPayload = {
                token,
                items: items.map((i) => ({
                  slug: i.slug,
                  variantId: i.variantId,
                  qty: i.qty,
                })),
                shippingAddress: shipping_address,
                giftCard: giftEnabled
                  ? { to: giftTo, from: giftFrom, message: giftMessage }
                  : undefined,
                payMode: payMode,
                couponCode: activeCoupon?.code,
                email: String(fd.get("email") ?? ""),
                phone: String(fd.get("phone") ?? ""),
                // Cashfree checks the page origin against its HTTPS whitelist.
                // Use the one canonical production origin, not a possible HTTP
                // or alias URL supplied by the visitor's browser.
                returnOrigin: SITE_URL,
                marketingConsent,
                metaFbp: marketingConsent ? readBrowserCookie("_fbp") : undefined,
                metaFbc: marketingConsent ? readBrowserCookie("_fbc") : undefined,
              };

              const res = await createOrderFn({ data: orderPayload });
              rememberOrderReceipt(res.orderId, res.receiptToken);

              if (!res.cashfreeRequired) {
                trackCommerceEvent("purchase", {
                  currency: "INR",
                  value: res.totalPaise / 100,
                  transactionId: res.orderNumber,
                  items: trackingItems,
                });
                clear();
                toast.success(`Order ${res.orderNumber} confirmed with Cash on Delivery.`);
                navigate({
                  to: "/order/thank-you/$orderId",
                  params: { orderId: res.orderId },
                  replace: true,
                });
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
              rememberOrderReceipt(verified.orderId, verified.receiptToken);
              trackCommerceEvent("purchase", {
                currency: "INR",
                value: verified.totalPaise / 100,
                transactionId: verified.orderNumber,
                items: trackingItems,
              });
              clear();
              toast.success(
                payMode === "cod"
                  ? `COD advance received. ${formatINR(total - paymentAmountPaise)} remains payable on delivery for order ${verified.orderNumber}.`
                  : `Payment received. Order ${verified.orderNumber} confirmed.`,
              );
              navigate({
                to: "/order/thank-you/$orderId",
                params: { orderId: verified.orderId },
                replace: true,
              });
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
              <Input
                name="email"
                type="email"
                required
                placeholder="Email address"
                value={couponEmail}
                onChange={(event) => {
                  setCouponEmail(event.target.value);
                  couponRequestVersion.current++;
                  setAppliedCoupon(null);
                  setCouponError("");
                }}
              />
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
            <fieldset disabled={busy} className="bg-white shopify-border p-6 space-y-4">
              <legend className="px-2 text-[11px] font-bold uppercase tracking-widest">
                Sending a gift?
              </legend>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={giftEnabled}
                  onChange={(event) => setGiftEnabled(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <strong>
                    Gift wrap this order + greeting card · {formatINR(GIFT_CARD_PRICE_PAISE)}
                  </strong>
                  <span className="mt-1 block text-xs text-on-surface-variant">
                    We’ll gift-wrap your order and include a physical greeting card with your
                    personal message. ₹299 for both, once per order. Optional.
                  </span>
                </span>
              </label>
              {giftEnabled && (
                <div className="space-y-4">
                  <p className="text-xs text-on-surface-variant">
                    Use the recipient’s delivery details above. Choose a suggestion below or write
                    your own wishes.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm">
                      To (optional)
                      <input
                        maxLength={80}
                        value={giftTo}
                        onChange={(e) => setGiftTo(e.target.value)}
                        className="mt-1 w-full border border-outline-variant/40 px-3 py-2"
                        placeholder="Recipient’s name"
                      />
                    </label>
                    <label className="text-sm">
                      From (optional)
                      <input
                        maxLength={80}
                        value={giftFrom}
                        onChange={(e) => setGiftFrom(e.target.value)}
                        className="mt-1 w-full border border-outline-variant/40 px-3 py-2"
                        placeholder="Your name"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GIFT_CARD_MESSAGES.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion.label}
                        onClick={() => setGiftMessage(suggestion.message)}
                        className="border border-outline-variant/40 px-3 py-2 text-xs font-bold"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                  <label className="block text-sm font-bold">
                    What should we write on the greeting card?
                    <textarea
                      required
                      maxLength={300}
                      rows={4}
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="mt-2 w-full border border-outline-variant/40 px-3 py-2 text-sm font-normal"
                      placeholder="Write your personal message…"
                    />
                  </label>
                  <p className="text-right text-xs text-on-surface-variant">
                    {giftMessage.length}/300 characters
                  </p>
                  <GiftCardSummary
                    address={{
                      gift_card: {
                        to: giftTo,
                        from: giftFrom,
                        message: giftMessage,
                        fee_paise: GIFT_CARD_PRICE_PAISE,
                      },
                    }}
                  />
                  {payMode === "cod" && (
                    <p className="text-xs leading-relaxed text-on-surface-variant">
                      With COD, the recipient pays the remaining balance, including the ₹299
                      gift-wrapping and greeting-card fee, on delivery. Choose prepaid if you do not
                      want the recipient to pay.
                    </p>
                  )}
                </div>
              )}
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
                      !activeCoupon &&
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
                      : activeCoupon
                        ? "Your coupon replaces the prepaid discount"
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
                  onChange={() => {
                    setPayMode("cod");
                    couponRequestVersion.current++;
                    setAppliedCoupon(null);
                    setCouponError("");
                  }}
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
                  <p className="text-xs leading-relaxed text-on-surface-variant mt-1">
                    {codAdvancePaise > 0
                      ? `Pay ${formatINR(codAdvancePaise)} now—deducted from your total. Pay the balance of ${formatINR(Math.max(0, amounts.subtotalPaise - codAdvancePaise))} on delivery. This is not an extra fee. Online payment is processed by Cashfree.`
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
            {deliveryEstimateItems.map((item) => (
              <div
                key={`${item.name}-${item.estimate}`}
                className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-950"
              >
                <strong>{item.name}:</strong> estimated delivery {item.estimate}
              </div>
            ))}
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-bold">{formatINR(total)}</span>
            </div>
            {giftEnabled && (
              <div className="flex justify-between gap-3 text-sm">
                <span>Gift wrapping + greeting card</span>
                <span className="font-bold">{formatINR(amounts.giftFeePaise)}</span>
              </div>
            )}
            {payMode === "prepaid" ? (
              <div className="space-y-2 border-t border-outline-variant/30 pt-4">
                <label htmlFor="coupon-code" className="block text-sm font-bold">
                  Have a coupon?
                </label>
                <p className="text-xs text-on-surface-variant">
                  Single use. Replaces the prepaid discount; offers cannot be combined.
                </p>
                {!couponEmail.trim() && (
                  <p className="text-xs text-on-surface-variant">
                    Enter your email in the contact section before applying a coupon.
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    id="coupon-code"
                    value={couponInput}
                    maxLength={40}
                    onChange={(event) => {
                      setCouponInput(event.target.value.toUpperCase());
                      couponRequestVersion.current++;
                      setAppliedCoupon(null);
                      setCouponError("");
                    }}
                    placeholder="Enter coupon code"
                    className="min-w-0 flex-1 rounded border border-outline-variant/50 px-3 py-2 text-sm uppercase"
                  />
                  <button
                    type="button"
                    disabled={couponBusy || busy || !couponInput.trim() || !couponEmail.trim()}
                    onClick={async () => {
                      const requestVersion = ++couponRequestVersion.current;
                      setCouponBusy(true);
                      setCouponError("");
                      try {
                        const result = await previewCouponFn({
                          data: { code: couponInput, email: couponEmail.trim(), payMode },
                        });
                        if (requestVersion === couponRequestVersion.current)
                          setAppliedCoupon({ ...result, email: couponEmail.trim().toLowerCase() });
                      } catch (error) {
                        if (requestVersion !== couponRequestVersion.current) return;
                        setAppliedCoupon(null);
                        setCouponError(
                          error instanceof Error ? error.message : "Could not apply coupon.",
                        );
                      } finally {
                        setCouponBusy(false);
                      }
                    }}
                    className="rounded bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
                  >
                    {couponBusy ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p role="alert" className="text-xs text-red-700">
                    {couponError}
                  </p>
                )}
                {activeCoupon && (
                  <div className="text-xs text-emerald-800" role="status">
                    <p>{activeCoupon.code} applied. Only this coupon discount will be used.</p>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      className="min-h-11 underline"
                    >
                      Remove coupon
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-on-surface-variant">
                  Applies to products only, with at least ₹1 payable online. Unused coupon value is
                  forfeited. Retry an interrupted payment with the same cart and delivery details.
                </p>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant">
                Coupons are available for prepaid orders only.
              </p>
            )}
            {payMode === "prepaid" && amounts.discountPaise > 0 && (
              <div className="flex justify-between text-sm text-emerald-700 font-medium">
                <span>
                  {activeCoupon ? `Coupon (${activeCoupon.code})` : "Prepaid Instant Discount"}
                </span>
                <span>-{formatINR(amounts.discountPaise)}</span>
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
                <span>{formatINR(amounts.codCollectablePaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-base border-t pt-3">
              <span className="font-bold">Order Total</span>
              <span className="font-bold">{formatINR(effectiveTotal)}</span>
            </div>

            <button
              disabled={busy || couponBusy || codAdvanceUnavailable}
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
              ,{" "}
              <Link to="/legal/cancellation" className="underline">
                Cancellation
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
