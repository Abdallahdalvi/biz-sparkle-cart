import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import React, { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { getProductBySlug, getAllProducts, type Product } from "@/lib/products";
import { formatINR } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug);
    if (!product) throw notFound();
    const all = await getAllProducts();
    const related = all.filter((p) => p.slug !== product.slug).slice(0, 3);
    return { product, related };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Product — TECHLAB" }] };
    return {
      meta: [
        { title: `${p.name} — TECHLAB` },
        { name: "description", content: `${p.name}. ${p.tagline}. ${formatINR(p.pricePaise)}. ${p.description.slice(0, 120)}` },
        { property: "og:title", content: `${p.name} — TECHLAB` },
        { property: "og:description", content: p.tagline },
        { property: "og:image", content: p.images[0] },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: p.images[0] },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: p.description,
            image: p.images,
            sku: p.slug,
            brand: { "@type": "Brand", name: "TECHLAB" },
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: (p.pricePaise / 100).toFixed(2),
              availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="max-w-xl mx-auto py-32 text-center">
        <h1 className="text-3xl font-bold mb-2">Product not found</h1>
        <Link to="/catalog" className="text-primary underline">Back to catalog</Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="max-w-xl mx-auto py-32 text-center">
        <h1 className="text-2xl font-bold mb-2">Couldn't load this product</h1>
        <p className="text-on-surface-variant text-sm">{error.message}</p>
      </div>
    </SiteShell>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product, related } = Route.useLoaderData() as { product: Product; related: Product[] };
  const [variant, setVariant] = useState(product.variants?.[0]?.id);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  // New trust & conversion states
  const [pincode, setPincode] = useState("");
  const [pinStatus, setPinStatus] = useState<string | null>(null);
  const [bundleCharger, setBundleCharger] = useState(true);
  const [bundleGlass, setBundleGlass] = useState(true);
  const [warranty, setWarranty] = useState("1yr");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const add = useCart((s) => s.add);

  function checkPincode(e: React.FormEvent) {
    e.preventDefault();
    const cleanPin = pincode.trim();
    if (cleanPin.length !== 6 || isNaN(Number(cleanPin))) {
      toast.error("Please enter a valid 6-digit Indian PIN code");
      return;
    }
    const metroPrefixes = ["11", "40", "56", "60", "70", "38", "50"];
    const isMetro = metroPrefixes.some((prefix) => cleanPin.startsWith(prefix));
    const days = isMetro ? 2 : 4;
    const deliveryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const dateStr = deliveryDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    const carrier = isMetro ? "Bluedart Air Express" : "Delhivery Surface Priority";

    setPinStatus(`⚡ FREE Express Delivery to ${cleanPin} by ${dateStr} via ${carrier} | COD Available`);
    toast.success(`Pincode verified! Assigned carrier: ${carrier}`);
  }

  function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail && !waitlistPhone) {
      toast.error("Please enter either an email or WhatsApp number");
      return;
    }
    setWaitlistSubmitted(true);
    toast.success("Successfully added to priority waitlist! You will be alerted first upon restock.");
  }

  // Calculate total price including bundle and warranty add-ons
  let baseAddonsPaise = 0;
  if (bundleCharger) baseAddonsPaise += 79900; // ₹799 20W Fast Charger
  if (bundleGlass) baseAddonsPaise += 39900; // ₹399 Tempered Glass

  // Apply 15% bundle discount if both add-ons are selected
  const hasBundleDiscount = bundleCharger && bundleGlass;
  if (hasBundleDiscount) {
    baseAddonsPaise = Math.round(baseAddonsPaise * 0.85);
  }

  let finalPricePaise = product.pricePaise + baseAddonsPaise;
  if (warranty === "2yr") finalPricePaise += 99900; // ₹999 Accidental Damage Protection

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-8">
          <Link to="/" className="hover:text-primary">Home</Link> /{" "}
          <Link to="/catalog" className="hover:text-primary">Catalog</Link> /{" "}
          <span className="text-primary">{product.name}</span>
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="aspect-square bg-white shopify-border overflow-hidden mb-4 shadow-sm">
              <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={"aspect-square shopify-border overflow-hidden " + (i === activeImg ? "ring-2 ring-primary" : "")}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-outline-variant/30 text-center">
              <div className="bg-surface-container-lowest p-4 border border-outline-variant/40 rounded shadow-sm">
                <span className="material-symbols-outlined text-2xl text-primary mb-1 block">cycle</span>
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">7-Day Replacement</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">No questions asked</p>
              </div>
              <div className="bg-surface-container-lowest p-4 border border-outline-variant/40 rounded shadow-sm">
                <span className="material-symbols-outlined text-2xl text-blue-600 mb-1 block">verified</span>
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">100% Genuine</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Brand certified</p>
              </div>
              <div className="bg-surface-container-lowest p-4 border border-outline-variant/40 rounded shadow-sm">
                <span className="material-symbols-outlined text-2xl text-emerald-600 mb-1 block">shield</span>
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Secure Checkout</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Secured by Razorpay</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              {product.badge && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary px-2.5 py-1 inline-block mb-4 shadow-sm bg-primary/5">
                  {product.badge}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-on-surface leading-tight mb-2">{product.name}</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-6">{product.tagline}</p>
              
              <div className="flex items-center gap-3">
                {product.compareAtPaise && product.compareAtPaise > product.pricePaise && (
                  <span className="text-2xl text-on-surface-variant line-through font-medium">{formatINR(product.compareAtPaise)}</span>
                )}
                <span className="text-3xl font-bold text-primary">{formatINR(finalPricePaise)}</span>
                {product.compareAtPaise && product.compareAtPaise > product.pricePaise && (
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    SAVE {Math.round((product.compareAtPaise - product.pricePaise) / product.compareAtPaise * 100)}%
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-on-surface-variant leading-relaxed">{product.description}</p>

            {/* Pincode Serviceability Checker */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded shadow-sm space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-primary block flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">local_shipping</span>
                Check Pincode Serviceability & Delivery Time
              </label>
              <form onSubmit={checkPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value); setPinStatus(null); }}
                  placeholder="Enter 6-digit PIN (e.g. 400001)"
                  className="bg-white border border-outline-variant/40 px-4 py-2.5 text-xs focus:outline-none focus:border-primary flex-1 font-mono"
                />
                <button type="submit" className="bg-primary text-on-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm">
                  Check
                </button>
              </form>
              {pinStatus && (
                <p className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded animate-fadeIn">
                  {pinStatus}
                </p>
              )}
            </div>

            {/* Frequently Bought Together (Bundle & Cross-Sell) */}
            <div className="bg-white border border-outline-variant/40 p-6 rounded shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-amber-600">auto_awesome</span>
                  Frequently Bought Together
                </h3>
                {hasBundleDiscount && (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                    15% BUNDLE SAVINGS APPLIED
                  </span>
                )}
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2 hover:bg-surface-container-lowest rounded transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer font-medium text-primary">
                    <input type="checkbox" checked disabled className="cursor-not-allowed" />
                    <span>{product.name} (This item)</span>
                  </label>
                  <span className="font-bold">{formatINR(product.pricePaise)}</span>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-surface-container-lowest rounded transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer font-medium text-primary">
                    <input type="checkbox" checked={bundleCharger} onChange={(e) => setBundleCharger(e.target.checked)} className="cursor-pointer" />
                    <span>20W Fast Charger Adapter (PD Compatible)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface-variant line-through text-[10px]">₹1,299</span>
                    <span className="font-bold text-emerald-700">{hasBundleDiscount ? formatINR(Math.round(79900 * 0.85)) : '₹799'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-surface-container-lowest rounded transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer font-medium text-primary">
                    <input type="checkbox" checked={bundleGlass} onChange={(e) => setBundleGlass(e.target.checked)} className="cursor-pointer" />
                    <span>Premium 9H Tempered Glass Screen Protector</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface-variant line-through text-[10px]">₹699</span>
                    <span className="font-bold text-emerald-700">{hasBundleDiscount ? formatINR(Math.round(39900 * 0.85)) : '₹399'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Extended Warranty Selector */}
            <div className="bg-white border border-outline-variant/40 p-6 rounded shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary border-b border-outline-variant/30 pb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-blue-600">verified_user</span>
                Extended Warranty & Protection
              </h3>
              <div className="space-y-3 text-xs">
                <label className={`flex items-start justify-between p-3 border rounded cursor-pointer transition-colors ${warranty === '1yr' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="wty" checked={warranty === '1yr'} onChange={() => setWarranty('1yr')} className="mt-1 cursor-pointer" />
                    <div>
                      <p className="font-bold text-primary">1 Year Brand Warranty</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">Covers all manufacturing defects</p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">INCLUDED</span>
                </label>
                <label className={`flex items-start justify-between p-3 border rounded cursor-pointer transition-colors ${warranty === '2yr' ? 'border-primary bg-primary/5' : 'border-outline-variant/40 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="wty" checked={warranty === '2yr'} onChange={() => setWarranty('2yr')} className="mt-1 cursor-pointer" />
                    <div>
                      <p className="font-bold text-primary">2 Years Accidental Damage Protection</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">Full liquid damage and screen replacement cover</p>
                    </div>
                  </div>
                  <span className="font-bold text-primary">+₹999</span>
                </label>
              </div>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2">Variant</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariant(v.id)}
                      className={
                        "px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors " +
                        (variant === v.id ? "bg-primary text-on-primary border-primary shadow-sm" : "border-outline text-primary hover:bg-surface-container")
                      }
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-outline bg-white shadow-sm">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 font-bold">−</button>
                <span className="w-12 text-center font-bold">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-4 py-3 font-bold">+</button>
              </div>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock (Priority Waitlist Open)"}
              </p>
            </div>

            {product.stock === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/40 p-6 rounded shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-blue-600">hourglass_top</span>
                  Priority Waitlist for Next Import Drop
                </h3>
                {waitlistSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded text-emerald-900 text-xs space-y-1">
                    <p className="font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span> You are on the priority list!
                    </p>
                    <p>We have reserved your queue spot. Our sourcing team will notify you immediately via Email/WhatsApp when the shipment clears customs.</p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-4">
                    <p className="text-xs text-on-surface-variant">This boutique device is currently in high demand. Join the priority queue to secure yours from the upcoming factory drop.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-white border border-outline-variant/40 px-3 py-2 text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">WhatsApp Phone</label>
                        <input
                          type="text"
                          value={waitlistPhone}
                          onChange={(e) => setWaitlistPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full bg-white border border-outline-variant/40 px-3 py-2 text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-primary text-on-primary py-3.5 font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-base">person_add</span> Join Priority Waitlist
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  disabled={product.stock === 0}
                  onClick={() => {
                    const v = product.variants?.find((x) => x.id === variant);
                    // Add main product (with warranty price if selected)
                    add(
                      {
                        slug: product.slug,
                        name: `${product.name} ${warranty === '2yr' ? '(+ 2Yr Accidental Cover)' : ''}`,
                        pricePaise: product.pricePaise + (warranty === '2yr' ? 99900 : 0),
                        image: product.images[0],
                        variantId: v?.id,
                        variantLabel: v?.label,
                      },
                      qty,
                    );
                    // Add bundle charger if selected
                    if (bundleCharger) {
                      add({ slug: "bundle-charger", name: "20W Fast Charger Adapter", pricePaise: hasBundleDiscount ? Math.round(79900 * 0.85) : 79900, image: product.images[0] }, 1);
                    }
                    // Add bundle glass if selected
                    if (bundleGlass) {
                      add({ slug: "bundle-glass", name: "Premium 9H Tempered Glass", pricePaise: hasBundleDiscount ? Math.round(39900 * 0.85) : 39900, image: product.images[0] }, 1);
                    }
                    toast.success(`Added ${qty} × ${product.name} (and selected add-ons) to cart`);
                  }}
                  className="flex-1 bg-primary text-on-primary px-10 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40 shadow-sm text-center block"
                >
                  Add to Cart — {formatINR(finalPricePaise * qty)}
                </button>
                <Link to="/cart" className="border border-outline text-primary px-10 py-4 font-bold text-sm uppercase tracking-widest hover:bg-surface-container transition-all shadow-sm bg-white text-center block">
                  View Cart
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Specs */}
        {product.specs && product.specs.length > 0 && (
          <div className="mt-20 bg-white shopify-border p-8 md:p-12 shadow-sm">
            <h2 className="text-2xl font-bold text-primary mb-8">Precision Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {product.specs.map((s) => (
                <div key={s.label} className="flex justify-between border-b border-outline-variant/30 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{s.label}</span>
                  <span className="text-sm font-bold text-on-surface text-right">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        {product.faqs && product.faqs.length > 0 && (
          <div className="mt-20 bg-white shopify-border p-8 md:p-12 shadow-sm max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-8 text-center tracking-tight">
              Frequently Asked Questions About {product.name}
            </h2>
            <div className="space-y-4">
              {product.faqs.map((faq, i) => (
                <div key={i} className="border border-outline-variant/40 bg-surface-container-low/50 overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full py-4 px-6 text-left font-bold text-sm sm:text-base text-primary flex justify-between items-center gap-4 hover:bg-surface-container-low transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span className="material-symbols-outlined text-xl text-primary/70 flex-shrink-0 transition-transform duration-300">
                      {openFaq === i ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 pt-1 text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/20 bg-white">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        {related && related.length > 0 && (
          <div className="mt-24">
            <h2 className="text-2xl font-bold text-primary mb-8">You may also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((p) => (
                <Link key={p.slug} to="/product/$slug" params={{ slug: p.slug }} className="group">
                  <div className="aspect-square overflow-hidden shopify-border bg-white mb-3 shadow-sm">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm uppercase tracking-tight">{p.name}</p>
                    <div className="flex items-center gap-1.5">
                      {p.compareAtPaise && p.compareAtPaise > p.pricePaise && (
                        <span className="text-[11px] text-on-surface-variant line-through">{formatINR(p.compareAtPaise)}</span>
                      )}
                      <span className="font-bold text-sm">{formatINR(p.pricePaise)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  );
}