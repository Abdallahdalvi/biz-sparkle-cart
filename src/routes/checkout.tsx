import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — TECHLAB" }, { name: "robots", content: "noindex" }] }),
  component: Checkout,
});

function Checkout() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.totalPaise());
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="max-w-xl mx-auto py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Link to="/catalog" className="text-primary underline">Browse catalog</Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">Checkout</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setBusy(true);
            try {
              const shipping_address = {
                first_name: fd.get("firstName"),
                last_name: fd.get("lastName"),
                line1: fd.get("line1"),
                line2: fd.get("line2"),
                city: fd.get("city"),
                state: fd.get("state"),
                pincode: fd.get("pincode"),
                country: "IN",
              };
              const { data: order, error } = await supabase
                .from("orders")
                .insert({
                  user_id: user?.id ?? null,
                  email: String(fd.get("email") ?? ""),
                  phone: String(fd.get("phone") ?? ""),
                  shipping_address,
                  subtotal_paise: total,
                  total_paise: total,
                  status: "pending",
                })
                .select("id, order_number")
                .single();
              if (error) throw error;
              const orderItems = items.map((i) => ({
                order_id: order.id,
                name: i.name,
                variant_label: i.variantLabel ?? null,
                unit_price_paise: i.pricePaise,
                qty: i.qty,
                image_url: i.image,
              }));
              const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
              if (itemsErr) throw itemsErr;
              clear();
              toast.success(`Order ${order.order_number} placed. Razorpay payment opens in Phase 4.`);
              navigate({ to: "/account/orders" });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Checkout failed");
            } finally {
              setBusy(false);
            }
          }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 space-y-6">
            <fieldset className="bg-white shopify-border p-6 space-y-4">
              <legend className="px-2 text-[11px] font-bold uppercase tracking-widest">Contact</legend>
              <Input name="email" type="email" required placeholder="Email address" />
              <Input name="phone" type="tel" required placeholder="Phone (+91)" pattern="[0-9+\\-\\s]{10,15}" />
            </fieldset>
            <fieldset className="bg-white shopify-border p-6 space-y-4">
              <legend className="px-2 text-[11px] font-bold uppercase tracking-widest">Shipping Address</legend>
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
            </fieldset>
            <fieldset className="bg-white shopify-border p-6 space-y-3">
              <legend className="px-2 text-[11px] font-bold uppercase tracking-widest">Payment</legend>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="pay" defaultChecked className="mt-1" />
                <div>
                  <p className="font-bold text-sm">Razorpay (UPI / Cards / Net Banking)</p>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-widest">Secured by Razorpay — keys to be wired in Phase 4</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer opacity-50">
                <input type="radio" name="pay" disabled className="mt-1" />
                <div>
                  <p className="font-bold text-sm">Cash on Delivery</p>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-widest">Coming soon</p>
                </div>
              </label>
            </fieldset>
          </div>
          <aside className="bg-white shopify-border p-6 h-fit space-y-4">
            <h2 className="font-bold uppercase tracking-widest text-sm">Summary</h2>
            {items.map((i) => (
              <div key={i.slug + (i.variantId ?? "")} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{i.name} × {i.qty}</span>
                <span className="font-bold">{formatINR(i.pricePaise * i.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm border-t pt-3"><span className="text-on-surface-variant">Subtotal</span><span className="font-bold">{formatINR(total)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Shipping</span><span className="font-bold">FREE</span></div>
            <div className="flex justify-between text-base border-t pt-3"><span className="font-bold">Total</span><span className="font-bold">{formatINR(total)}</span></div>
            <button disabled={busy} className="w-full bg-primary text-on-primary py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-50">
              {busy ? "Processing…" : `Pay ${formatINR(total)}`}
            </button>
            <p className="text-[10px] text-on-surface-variant text-center">
              By placing this order you agree to our <Link to="/legal/terms" className="underline">Terms</Link>, <Link to="/legal/returns" className="underline">Returns</Link>, and <Link to="/legal/privacy" className="underline">Privacy Policy</Link>.
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