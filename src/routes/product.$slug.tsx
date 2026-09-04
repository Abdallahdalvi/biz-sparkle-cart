import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import React, { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { getProductBySlug, getAllProducts, type Product } from "@/lib/products";
import { formatINR } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { trackCommerceEvent, trackLead } from "@/lib/tracking";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/lib/operations.functions";
import { absoluteSiteUrl, SITE_NAME } from "@/lib/site";

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
    if (!p) return { meta: [{ title: "Product — Aghanims Phones and Gadgets" }] };
    const productUrl = absoluteSiteUrl(`/product/${encodeURIComponent(p.slug)}`);
    return {
      meta: [
        { title: `${p.name} — Aghanims Phones and Gadgets` },
        {
          name: "description",
          content: `${p.name}. ${p.tagline}. ${formatINR(p.pricePaise)}. ${p.description.slice(0, 120)}`,
        },
        { property: "og:title", content: `${p.name} — Aghanims Phones and Gadgets` },
        { property: "og:description", content: p.tagline },
        { property: "og:image", content: p.images[0] },
        { property: "og:url", content: productUrl },
        { property: "product:price:amount", content: (p.pricePaise / 100).toFixed(2) },
        { property: "product:price:currency", content: "INR" },
        {
          property: "product:availability",
          content: p.stock > 0 ? "in stock" : "out of stock",
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: p.images[0] },
      ],
      links: [{ rel: "canonical", href: productUrl }],
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
            url: productUrl,
            brand: { "@type": "Brand", name: SITE_NAME },
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: (p.pricePaise / 100).toFixed(2),
              availability:
                p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
        <Link to="/catalog" className="text-primary underline">
          Back to catalog
        </Link>
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
  const [activeImg, setActiveImg] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const submitMessageFn = useServerFn(submitContactMessage);

  const items = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const cartItem = items.find((i) => i.slug === product.slug && i.variantId === variant);
  const currentQty = cartItem ? cartItem.qty : 0;

  React.useEffect(() => {
    trackCommerceEvent("view_item", {
      currency: "INR",
      value: product.pricePaise / 100,
      items: [
        {
          item_id: product.slug,
          item_name: product.name,
          price: product.pricePaise / 100,
          quantity: 1,
        },
      ],
    });
  }, [product.name, product.pricePaise, product.slug]);

  function trackAddedToCart(variantLabel?: string) {
    trackCommerceEvent("add_to_cart", {
      currency: "INR",
      value: product.pricePaise / 100,
      items: [
        {
          item_id: product.slug,
          item_name: product.name,
          item_variant: variantLabel,
          price: product.pricePaise / 100,
          quantity: 1,
        },
      ],
    });
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail) {
      toast.error("Please enter your email address");
      return;
    }
    setWaitlistSubmitting(true);
    try {
      await submitMessageFn({
        data: {
          name: "Product waitlist",
          email: waitlistEmail,
          phone: waitlistPhone,
          subject: `Waitlist: ${product.name}`,
          message: `Customer requested an out-of-stock notification for ${product.name}.`,
          website: "",
        },
      });
      setWaitlistSubmitted(true);
      trackLead(`Waitlist: ${product.name}`);
      toast.success("Your restock request has been received.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to join the waitlist");
    } finally {
      setWaitlistSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12 pb-28 md:pb-12">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-8">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/catalog" className="hover:text-primary">
            Catalog
          </Link>{" "}
          / <span className="text-primary">{product.name}</span>
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="aspect-square bg-white shopify-border overflow-hidden mb-4 shadow-sm">
              <img
                src={product.images[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={
                      "aspect-square shopify-border overflow-hidden " +
                      (i === activeImg ? "ring-2 ring-primary" : "")
                    }
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 pt-6 border-t border-outline-variant/30 text-center">
              <div className="bg-surface-container-lowest p-2 sm:p-4 border border-outline-variant/40 rounded shadow-sm">
                <span className="material-symbols-outlined text-2xl text-primary mb-1 block">
                  cycle
                </span>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter sm:tracking-widest text-primary leading-tight break-words">
                  48-Hour DOA Support
                </p>
                <p className="text-[9px] sm:text-[10px] text-on-surface-variant mt-0.5">
                  Proof required
                </p>
              </div>
              <div className="bg-surface-container-lowest p-2 sm:p-4 border border-outline-variant/40 rounded shadow-sm">
                <span className="material-symbols-outlined text-2xl text-blue-600 mb-1 block">
                  verified
                </span>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter sm:tracking-widest text-primary leading-tight break-words">
                  100% Genuine
                </p>
                <p className="text-[9px] sm:text-[10px] text-on-surface-variant mt-0.5">
                  Brand certified
                </p>
              </div>
              <div className="bg-surface-container-lowest p-2 sm:p-4 border border-outline-variant/40 rounded shadow-sm">
                <span className="material-symbols-outlined text-2xl text-emerald-600 mb-1 block">
                  shield
                </span>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter sm:tracking-widest text-primary leading-tight break-words">
                  Secure Checkout
                </p>
                <p className="text-[9px] sm:text-[10px] text-on-surface-variant mt-0.5">
                  COD available at checkout
                </p>
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
              <h1 className="text-4xl md:text-5xl font-bold text-on-surface leading-tight mb-2">
                {product.name}
              </h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-6">
                {product.tagline}
              </p>

              <div className="flex items-center gap-3">
                {product.compareAtPaise && product.compareAtPaise > product.pricePaise && (
                  <span className="text-2xl text-on-surface-variant line-through font-medium">
                    {formatINR(product.compareAtPaise)}
                  </span>
                )}
                <span className="text-3xl font-bold text-primary">
                  {formatINR(product.pricePaise)}
                </span>
                {product.compareAtPaise && product.compareAtPaise > product.pricePaise && (
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    SAVE{" "}
                    {Math.round(
                      ((product.compareAtPaise - product.pricePaise) / product.compareAtPaise) *
                        100,
                    )}
                    %
                  </span>
                )}
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                <span className="material-symbols-outlined text-base">payments</span>
                {product.codAdvancePaise > 0 ? (
                  <span>
                    COD available with <strong>{formatINR(product.codAdvancePaise)}</strong> online
                    advance;{" "}
                    <strong>{formatINR(product.pricePaise - product.codAdvancePaise)}</strong> is
                    collected on delivery.
                  </span>
                ) : (
                  <span>Full Cash on Delivery available with no online advance.</span>
                )}
              </div>
            </div>

            <p className="text-on-surface-variant leading-relaxed">{product.description}</p>

            <div className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded shadow-sm space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">
                  local_shipping
                </span>
                Delivery & courier confirmation
              </p>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Enter your delivery PIN code during checkout. Serviceability, the available courier,
                and the delivery estimate are confirmed from Shiprocket when your order is prepared
                for dispatch.
              </p>
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
                        (variant === v.id
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "border-outline text-primary hover:bg-surface-container")
                      }
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : "Out of stock (Priority Waitlist Open)"}
              </p>
            </div>

            {product.stock === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/40 p-6 rounded shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-blue-600">
                    hourglass_top
                  </span>
                  Restock Notification
                </h3>
                {waitlistSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded text-emerald-900 text-xs space-y-1">
                    <p className="font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span> You
                      request received
                    </p>
                    <p>
                      Our team received your request and will contact you when this product becomes
                      available. Submitting this form does not reserve stock or guarantee a date.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="space-y-4">
                    <p className="text-xs text-on-surface-variant">
                      Ask our team to contact you when this product is available again.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-white border border-outline-variant/40 px-3 py-2 text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">
                          WhatsApp Phone
                        </label>
                        <input
                          type="text"
                          value={waitlistPhone}
                          onChange={(e) => setWaitlistPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full bg-white border border-outline-variant/40 px-3 py-2 text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={waitlistSubmitting}
                      className="w-full bg-primary text-on-primary py-3.5 font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">notifications</span>
                      {waitlistSubmitting ? "Sending…" : "Request Restock Alert"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="hidden md:grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                {currentQty > 0 ? (
                  <div className="flex items-center justify-between bg-primary text-on-primary font-bold text-sm shadow-sm w-full h-full min-h-[48px]">
                    <button
                      onClick={() => {
                        if (currentQty === 1) {
                          remove(product.slug, variant);
                          toast.message(`Removed ${product.name} from cart`);
                        } else {
                          setQty(product.slug, currentQty - 1, variant);
                        }
                      }}
                      className="px-6 py-3 font-bold text-lg hover:bg-white/10 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-center font-bold text-sm">
                      {currentQty}{" "}
                      <span className="text-[10px] opacity-80 font-normal uppercase tracking-widest block sm:inline">
                        ({formatINR(product.pricePaise * currentQty)})
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        if (currentQty < product.stock) {
                          setQty(product.slug, currentQty + 1, variant);
                        } else {
                          toast.error(`Only ${product.stock} units available in stock`);
                        }
                      }}
                      className="px-6 py-3 font-bold text-lg hover:bg-white/10 transition-colors"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={product.stock === 0}
                    onClick={() => {
                      const v = product.variants?.find((x) => x.id === variant);
                      add(
                        {
                          slug: product.slug,
                          name: product.name,
                          pricePaise: product.pricePaise,
                          image: product.images[0],
                          variantId: v?.id,
                          variantLabel: v?.label,
                        },
                        1,
                      );
                      trackAddedToCart(v?.label);
                      toast.success(`Added ${product.name} to cart`);
                    }}
                    className="w-full bg-primary text-on-primary px-2 sm:px-8 py-3 sm:py-4 font-bold text-xs sm:text-sm uppercase tracking-tight sm:tracking-widest hover:opacity-90 transition-all disabled:opacity-40 shadow-sm text-center flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2"
                  >
                    <span>Add to Cart</span>
                    <span className="text-[11px] sm:text-sm font-bold opacity-90">
                      ({formatINR(product.pricePaise)})
                    </span>
                  </button>
                )}
                <Link
                  to="/cart"
                  className="w-full border border-outline text-primary px-2 sm:px-8 py-3 sm:py-4 font-bold text-xs sm:text-sm uppercase tracking-tight sm:tracking-widest hover:bg-surface-container transition-all shadow-sm bg-white text-center flex items-center justify-center"
                >
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
                <div
                  key={s.label}
                  className="flex justify-between border-b border-outline-variant/30 py-3"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {s.label}
                  </span>
                  <span className="text-sm font-bold text-on-surface text-right">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        {product.faqs && product.faqs.length > 0 && (
          <div className="mt-20 bg-white shopify-border p-8 md:p-12 shadow-sm w-full">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-8 text-center tracking-tight">
              Frequently Asked Questions About {product.name}
            </h2>
            <div className="space-y-4">
              {product.faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-outline-variant/40 bg-surface-container-low/50 overflow-hidden transition-all"
                >
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
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm uppercase tracking-tight">{p.name}</p>
                    <div className="flex items-center gap-1.5">
                      {p.compareAtPaise && p.compareAtPaise > p.pricePaise && (
                        <span className="text-[11px] text-on-surface-variant line-through">
                          {formatINR(p.compareAtPaise)}
                        </span>
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

      {/* Mobile CTA remains below the product imagery per the project layout rule. */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-outline-variant/30 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] md:hidden">
        <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-950 px-4 py-1.5 text-center text-[11px] font-medium">
          Tracked delivery • Courier and ETA confirmed after checkout
        </div>
        <div className="flex items-center p-2 gap-2">
          {currentQty > 0 ? (
            <div className="flex-1 flex items-center justify-between bg-white border border-primary text-primary font-bold text-xs shadow-sm h-11">
              <button
                onClick={() => {
                  if (currentQty === 1) {
                    remove(product.slug, variant);
                    toast.message(`Removed ${product.name} from cart`);
                  } else {
                    setQty(product.slug, currentQty - 1, variant);
                  }
                }}
                className="px-4 h-full font-bold text-base hover:bg-surface-container transition-colors flex items-center justify-center"
              >
                −
              </button>
              <span className="text-center font-bold text-xs">{currentQty}</span>
              <button
                onClick={() => {
                  if (currentQty < product.stock) {
                    setQty(product.slug, currentQty + 1, variant);
                  } else {
                    toast.error(`Only ${product.stock} units available in stock`);
                  }
                }}
                className="px-4 h-full font-bold text-base hover:bg-surface-container transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          ) : (
            <button
              disabled={product.stock === 0}
              onClick={() => {
                const v = product.variants?.find((x) => x.id === variant);
                add(
                  {
                    slug: product.slug,
                    name: product.name,
                    pricePaise: product.pricePaise,
                    image: product.images[0],
                    variantId: v?.id,
                    variantLabel: v?.label,
                  },
                  1,
                );
                trackAddedToCart(v?.label);
                toast.success(`Added ${product.name} to cart`);
              }}
              className="flex-1 bg-white border border-primary text-primary py-3.5 font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all text-center disabled:opacity-40 shadow-sm"
            >
              ADD TO CART
            </button>
          )}
          <Link
            to="/cart"
            onClick={() => {
              if (currentQty === 0) {
                const v = product.variants?.find((x) => x.id === variant);
                add(
                  {
                    slug: product.slug,
                    name: product.name,
                    pricePaise: product.pricePaise,
                    image: product.images[0],
                    variantId: v?.id,
                    variantLabel: v?.label,
                  },
                  1,
                );
                trackAddedToCart(v?.label);
              }
            }}
            className="flex-1 bg-primary text-on-primary py-3.5 font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all text-center block shadow-sm"
          >
            BUY NOW
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
