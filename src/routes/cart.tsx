import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — TECHLAB" }, { name: "robots", content: "noindex" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.totalPaise());

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">Your Cart</h1>
        {items.length === 0 ? (
          <div className="bg-white shopify-border p-16 text-center">
            <p className="text-on-surface-variant mb-6">Your cart is empty.</p>
            <Link to="/catalog" className="inline-block bg-primary text-on-primary px-8 py-3 font-bold text-sm uppercase tracking-widest">Browse Catalog</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((i) => (
                <div key={i.slug + (i.variantId ?? "")} className="bg-white shopify-border p-4 flex gap-4 items-center">
                  <img src={i.image} alt={i.name} className="w-24 h-24 object-cover shopify-border" />
                  <div className="flex-1">
                    <Link to="/product/$slug" params={{ slug: i.slug }} className="font-bold uppercase tracking-tight hover:underline">{i.name}</Link>
                    {i.variantLabel && <p className="text-[11px] text-on-surface-variant uppercase tracking-widest">{i.variantLabel}</p>}
                    <p className="text-sm font-bold mt-1">{formatINR(i.pricePaise)}</p>
                  </div>
                  <div className="flex items-center border border-outline">
                    <button onClick={() => setQty(i.slug, i.qty - 1, i.variantId)} className="px-3 py-2 font-bold">−</button>
                    <span className="w-10 text-center text-sm font-bold">{i.qty}</span>
                    <button onClick={() => setQty(i.slug, i.qty + 1, i.variantId)} className="px-3 py-2 font-bold">+</button>
                  </div>
                  <button onClick={() => remove(i.slug, i.variantId)} aria-label="Remove" className="material-symbols-outlined text-on-surface-variant hover:text-destructive">close</button>
                </div>
              ))}
            </div>
            <aside className="bg-white shopify-border p-6 h-fit space-y-4">
              <h2 className="font-bold uppercase tracking-widest text-sm">Order Summary</h2>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Subtotal</span><span className="font-bold">{formatINR(total)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Shipping</span><span className="text-[11px] uppercase font-bold">Calculated at checkout</span></div>
              <div className="flex justify-between text-base border-t pt-3"><span className="font-bold">Total</span><span className="font-bold">{formatINR(total)}</span></div>
              <Link to="/checkout" className="block text-center bg-primary text-on-primary py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90">Proceed to Checkout</Link>
              <Link to="/catalog" className="block text-center text-[11px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary">Continue Shopping</Link>
            </aside>
          </div>
        )}
      </section>
    </SiteShell>
  );
}