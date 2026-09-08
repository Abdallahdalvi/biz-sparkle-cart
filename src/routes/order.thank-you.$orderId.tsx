import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Facebook, Instagram, MessageCircle, Youtube } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { getOrderConfirmation } from "@/lib/order-confirmation.functions";
import { orderReceiptStorageKey } from "@/lib/order-receipt-client";
import { OFFICIAL_SOCIAL_LINKS, whatsappChatUrl } from "@/lib/social-links";
import { useAuth } from "@/lib/use-auth";
import { useServerFn } from "@tanstack/react-start";

interface Address {
  first_name?: string;
  last_name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

type Confirmation = Awaited<
  ReturnType<ReturnType<typeof useServerFn<typeof getOrderConfirmation>>>
>;

export const Route = createFileRoute("/order/thank-you/$orderId")({
  component: OrderThankYou,
  head: () => ({
    meta: [
      { title: "Thank You for Your Order — Aghanims Phones and Gadgets" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function displayStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function OrderThankYou() {
  const { orderId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const fetchConfirmation = useServerFn(getOrderConfirmation);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let active = true;

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const receiptToken = window.sessionStorage.getItem(orderReceiptStorageKey(orderId));
        const result = await fetchConfirmation({
          data: {
            orderId,
            authToken: data.session?.access_token,
            receiptToken: receiptToken || undefined,
          },
        });
        if (active) setConfirmation(result);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load this order receipt");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, fetchConfirmation, orderId, user?.id]);

  if (authLoading || (!confirmation && !error)) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-3xl px-margin-mobile py-24 text-center md:px-margin-desktop">
          <span className="material-symbols-outlined animate-pulse text-5xl text-primary">
            receipt_long
          </span>
          <p className="mt-4 text-sm text-on-surface-variant">Preparing your order receipt…</p>
        </main>
      </SiteShell>
    );
  }

  if (!confirmation || error) {
    return (
      <SiteShell>
        <main className="mx-auto max-w-2xl px-margin-mobile py-20 text-center md:px-margin-desktop">
          <span className="material-symbols-outlined text-5xl text-amber-600">lock</span>
          <h1 className="mt-4 text-3xl font-black">Private order confirmation</h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            {error || "This receipt could not be loaded."} Sign in with the account used to place
            the order, or track it using the order number sent to you.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="bg-primary px-7 py-3 text-xs font-bold uppercase tracking-widest text-on-primary"
            >
              Sign in
            </Link>
            <Link
              to="/track"
              search={{ orderId: "" }}
              className="border border-primary px-7 py-3 text-xs font-bold uppercase tracking-widest"
            >
              Track an order
            </Link>
          </div>
        </main>
      </SiteShell>
    );
  }

  const address = (confirmation.shippingAddress || {}) as Address;
  const isCod = confirmation.paymentMethod === "cod";
  const merchandiseSubtotal = confirmation.subtotalPaise;
  const pricingAdjustment = confirmation.totalPaise - (merchandiseSubtotal + confirmation.taxPaise);
  const estimatePending = /available after|awaiting/i.test(confirmation.tracking.estimatedDelivery);

  return (
    <SiteShell>
      <main className="bg-surface-container-low px-margin-mobile py-10 md:px-margin-desktop md:py-16">
        <div className="mx-auto max-w-[1180px] space-y-6">
          <section className="overflow-hidden border border-outline-variant/50 bg-white shadow-sm">
            <div className="border-b border-outline-variant/40 bg-emerald-50 px-5 py-8 text-center sm:px-8 md:py-10">
              <span className="material-symbols-outlined rounded-full bg-emerald-600 p-3 text-4xl text-white">
                check
              </span>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-800">
                Order received
              </p>
              <h1 className="mt-2 text-3xl font-black text-primary md:text-5xl">Thank you!</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant md:text-base">
                Your order <strong className="text-primary">{confirmation.orderNumber}</strong> has
                been confirmed. We’ll send order and shipment updates to {confirmation.email}.
              </p>
            </div>

            <div className="grid gap-px bg-outline-variant/40 sm:grid-cols-3">
              <ReceiptStat label="Order status" value={displayStatus(confirmation.status)} />
              <ReceiptStat label="Payment" value={isCod ? "Cash on Delivery" : "Paid online"} />
              <ReceiptStat
                label="Placed on"
                value={new Date(confirmation.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <section className="border border-outline-variant/50 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-3xl text-primary">
                    local_shipping
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Shiprocket delivery estimate
                    </p>
                    <h2 className="mt-1 text-xl font-black text-primary">
                      {confirmation.tracking.estimatedDelivery}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      {estimatePending
                        ? "We are preparing your parcel. The exact Shiprocket courier and delivery date will appear after courier assignment or the first scan."
                        : `${confirmation.tracking.carrier} is handling this shipment.`}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="bg-surface-container px-3 py-2 font-bold">
                        {confirmation.tracking.statusText}
                      </span>
                      {confirmation.tracking.awb && (
                        <span className="bg-surface-container px-3 py-2">
                          AWB: <strong>{confirmation.tracking.awb}</strong>
                        </span>
                      )}
                    </div>
                    {confirmation.tracking.trackingUrl && (
                      <a
                        href={confirmation.tracking.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-2 bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-on-primary"
                      >
                        Track shipment
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                      </a>
                    )}
                  </div>
                </div>
              </section>

              <section className="border border-outline-variant/50 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-black text-primary">Order details</h2>
                <div className="mt-5 divide-y divide-outline-variant/40">
                  {confirmation.items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex gap-4 py-4 first:pt-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-16 w-16 shrink-0 border border-outline-variant/40 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-surface-container">
                          <span className="material-symbols-outlined text-on-surface-variant">
                            smartphone
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-primary">{item.name}</p>
                        {item.variantLabel && (
                          <p className="text-xs text-on-surface-variant">{item.variantLabel}</p>
                        )}
                        <p className="mt-1 text-xs text-on-surface-variant">Quantity: {item.qty}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold">
                        {formatINR(item.unitPricePaise * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="ml-auto mt-4 max-w-sm space-y-2 border-t border-outline-variant/50 pt-4 text-sm">
                  <AmountRow label="Merchandise subtotal" value={formatINR(merchandiseSubtotal)} />
                  <AmountRow label="Customer shipping" value="Free" positive />
                  {confirmation.taxPaise > 0 && (
                    <AmountRow label="Tax" value={formatINR(confirmation.taxPaise)} />
                  )}
                  {pricingAdjustment < 0 && (
                    <AmountRow
                      label="Online payment discount"
                      value={`-${formatINR(Math.abs(pricingAdjustment))}`}
                      positive
                    />
                  )}
                  <div className="flex justify-between border-t-2 border-primary pt-3 text-base font-black">
                    <span>Order total</span>
                    <span>{formatINR(confirmation.totalPaise)}</span>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="border border-outline-variant/50 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-lg font-black text-primary">Payment summary</h2>
                <div className="mt-4 space-y-3 text-sm">
                  {isCod ? (
                    <>
                      <AmountRow
                        label="Advance paid online"
                        value={formatINR(confirmation.advancePaidPaise)}
                        positive={confirmation.advancePaidPaise > 0}
                      />
                      <div className="border-t border-outline-variant/50 pt-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                          Pay to the courier on delivery
                        </p>
                        <p className="mt-1 text-2xl font-black text-primary">
                          {formatINR(confirmation.codCollectablePaise)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded bg-emerald-50 p-4 text-emerald-900">
                      <p className="font-bold">Payment received</p>
                      <p className="mt-1 text-2xl font-black">
                        {formatINR(confirmation.totalPaise)}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="border border-outline-variant/50 bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-lg font-black text-primary">Delivering to</h2>
                <div className="mt-3 text-sm leading-6 text-on-surface-variant">
                  <p className="font-bold text-primary">
                    {address.first_name} {address.last_name}
                  </p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} {address.pincode}
                  </p>
                  <p className="mt-2">Phone: {confirmation.phone}</p>
                </div>
              </section>

              <section className="border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-7">
                <h2 className="text-lg font-black text-primary">Stay connected</h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  Join our official WhatsApp channel for product updates, or follow our verified
                  store pages.
                </p>
                <a
                  href={OFFICIAL_SOCIAL_LINKS.whatsappChannel}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 bg-emerald-600 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white"
                >
                  <MessageCircle className="h-5 w-5" /> Join WhatsApp channel
                </a>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <SocialLink href={OFFICIAL_SOCIAL_LINKS.instagram} label="Instagram">
                    <Instagram className="h-5 w-5" />
                  </SocialLink>
                  <SocialLink href={OFFICIAL_SOCIAL_LINKS.facebook} label="Facebook">
                    <Facebook className="h-5 w-5" />
                  </SocialLink>
                  <SocialLink href={OFFICIAL_SOCIAL_LINKS.youtube} label="YouTube">
                    <Youtube className="h-5 w-5" />
                  </SocialLink>
                </div>
                <a
                  href={whatsappChatUrl(
                    `Hi Aghanims Support, I need help with order ${confirmation.orderNumber}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block text-center text-xs font-bold underline"
                >
                  Need help? Chat with us
                </a>
              </section>
            </aside>
          </div>

          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <Link
              to="/"
              className="bg-primary px-7 py-3.5 text-center text-xs font-bold uppercase tracking-widest text-on-primary"
            >
              Continue shopping
            </Link>
            {user ? (
              <Link
                to="/account/orders"
                className="border border-primary px-7 py-3.5 text-center text-xs font-bold uppercase tracking-widest"
              >
                View all orders
              </Link>
            ) : (
              <Link
                to="/track"
                search={{ orderId: confirmation.orderNumber }}
                className="border border-primary px-7 py-3.5 text-center text-xs font-bold uppercase tracking-widest"
              >
                Track this order
              </Link>
            )}
          </div>
        </div>
      </main>
    </SiteShell>
  );
}

function ReceiptStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-5 py-4 text-center sm:text-left">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-primary">{value}</p>
    </div>
  );
}

function AmountRow({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${positive ? "font-medium text-emerald-700" : "text-on-surface-variant"}`}
    >
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="flex items-center justify-center border border-outline-variant/60 bg-white p-3 transition-colors hover:bg-surface-container"
    >
      {children}
    </a>
  );
}
