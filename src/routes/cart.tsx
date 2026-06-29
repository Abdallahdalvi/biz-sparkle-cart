import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — TECHLAB" }, { name: "robots", content: "noindex" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.totalPaise());
  const add = useCart((s) => s.add);

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">Your Cart</h1>
        {items.length === 0 ? (
          <div className="bg-white shopify-border p-16 text-center">
            <p className="text-on-surface-variant mb-6">Your cart is empty.</p>
            <Link
              to="/catalog"
              className="inline-block bg-primary text-on-primary px-8 py-3 font-bold text-sm uppercase tracking-widest"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((i) => (
                <div
                  key={i.slug + (i.variantId ?? "")}
                  className="bg-white shopify-border p-4 flex gap-4 items-center"
                >
                  <img
                    src={i.image}
                    alt={i.name}
                    className="w-24 h-24 object-cover shopify-border"
                  />
                  <div className="flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: i.slug }}
                      className="font-bold uppercase tracking-tight hover:underline"
                    >
                      {i.name}
                    </Link>
                    {i.variantLabel && (
                      <p className="text-[11px] text-on-surface-variant uppercase tracking-widest">
                        {i.variantLabel}
                      </p>
                    )}
                    <p className="text-sm font-bold mt-1">{formatINR(i.pricePaise)}</p>
                  </div>
                  <div className="flex items-center border border-outline">
                    <button
                      onClick={() => setQty(i.slug, i.qty - 1, i.variantId)}
                      className="px-3 py-2 font-bold"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-bold">{i.qty}</span>
                    <button
                      onClick={() => setQty(i.slug, i.qty + 1, i.variantId)}
                      className="px-3 py-2 font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(i.slug, i.variantId)}
                    aria-label="Remove"
                    className="material-symbols-outlined text-on-surface-variant hover:text-destructive"
                  >
                    close
                  </button>
                </div>
              ))}
            </div>
            <aside className="bg-white shopify-border p-6 h-fit space-y-4">
              <h2 className="font-bold uppercase tracking-widest text-sm">Order Summary</h2>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-bold">{formatINR(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Shipping</span>
                <span className="text-[11px] uppercase font-bold">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-base border-t pt-3">
                <span className="font-bold">Total</span>
                <span className="font-bold">{formatINR(total)}</span>
              </div>
              <Link
                to="/checkout"
                className="block text-center bg-primary text-on-primary py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/catalog"
                className="block text-center text-[11px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}

        {/* Level Up Your Gear / Cross-Sell Section */}
        {items.length > 0 && (
          <div className="mt-20 bg-surface-container-lowest border border-outline-variant/40 p-8 md:p-12 rounded shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_shopping_cart</span>
              Level Up Your Setup (Frequently Bought Together)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-outline-variant/30 p-5 rounded shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">POPULAR ADD-ON</span>
                  <h3 className="font-bold text-base text-primary">Stealth Privacy OS Keycaps</h3>
                  <p className="text-xs text-on-surface-variant">Non-transparent laser-etched PBT keycaps for maximum privacy and tactical feel.</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                  <span className="font-bold text-base text-primary">₹799</span>
                  <button
                    onClick={() => {
                      add({ slug: "stealth-keycaps", name: "Stealth Privacy OS Keycaps", pricePaise: 79900, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" }, 1);
                      toast.success("Added Stealth Privacy OS Keycaps to cart");
                    }}
                    className="bg-primary text-on-primary px-4 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="bg-white border border-outline-variant/30 p-5 rounded shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-800 bg-blue-100 px-2 py-0.5 rounded">PROTECTION</span>
                  <h3 className="font-bold text-base text-primary">Carbon Fiber Hard Carrying Case</h3>
                  <p className="text-xs text-on-surface-variant">Shockproof outer armor custom designed to protect boutique keypads and phones.</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                  <span className="font-bold text-base text-primary">₹999</span>
                  <button
                    onClick={() => {
                      add({ slug: "carbon-case", name: "Carbon Fiber Hard Carrying Case", pricePaise: 99900, image: "https://images.unsplash.com/photo-1622445265206-7e3f899e9b04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" }, 1);
                      toast.success("Added Carbon Fiber Hard Carrying Case to cart");
                    }}
                    className="bg-primary text-on-primary px-4 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="bg-white border border-outline-variant/30 p-5 rounded shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded">POWER</span>
                  <h3 className="font-bold text-base text-primary">65W GaN Pocket Adapter</h3>
                  <p className="text-xs text-on-surface-variant">Ultra-compact gallium nitride rapid charger with dynamic power distribution.</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                  <span className="font-bold text-base text-primary">₹1,499</span>
                  <button
                    onClick={() => {
                      add({ slug: "65w-gan-charger", name: "65W GaN Pocket Adapter", pricePaise: 149900, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" }, 1);
                      toast.success("Added 65W GaN Pocket Adapter to cart");
                    }}
                    className="bg-primary text-on-primary px-4 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
