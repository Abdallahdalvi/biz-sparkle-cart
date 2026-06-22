import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { getProductBySlug, PRODUCTS, type Product } from "@/lib/products";
import { formatINR } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
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
  const { product } = Route.useLoaderData() as { product: Product };
  const [variant, setVariant] = useState(product.variants?.[0]?.id);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const add = useCart((s) => s.add);

  const related = PRODUCTS.filter((p) => p.slug !== product.slug).slice(0, 3);

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
            <div className="aspect-square bg-white shopify-border overflow-hidden mb-4">
              <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
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
          </div>
          <div>
            {product.badge && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary px-2 py-1 inline-block mb-4">
                {product.badge}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-on-surface leading-tight mb-2">{product.name}</h1>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-6">{product.tagline}</p>
            <p className="text-3xl font-bold text-primary mb-6">{formatINR(product.pricePaise)}</p>
            <p className="text-on-surface-variant leading-relaxed mb-8">{product.description}</p>

            {product.variants && (
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2">Variant</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariant(v.id)}
                      className={
                        "px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors " +
                        (variant === v.id ? "bg-primary text-on-primary border-primary" : "border-outline text-primary hover:bg-surface-container")
                      }
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-outline">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 font-bold">−</button>
                <span className="w-12 text-center font-bold">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-4 py-3 font-bold">+</button>
              </div>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest">
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
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
                    qty,
                  );
                  toast.success(`Added ${qty} × ${product.name} to cart`);
                }}
                className="bg-primary text-on-primary px-10 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40"
              >
                Add to Cart
              </button>
              <Link to="/cart" className="border border-outline text-primary px-10 py-4 font-bold text-sm uppercase tracking-widest hover:bg-surface-container transition-all">
                View Cart
              </Link>
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="mt-20 bg-white shopify-border p-8 md:p-12">
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

        {/* Related */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-primary mb-8">You may also like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map((p) => (
              <Link key={p.slug} to="/product/$slug" params={{ slug: p.slug }} className="group">
                <div className="aspect-square overflow-hidden shopify-border bg-white mb-3">
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex justify-between">
                  <p className="font-bold text-sm uppercase tracking-tight">{p.name}</p>
                  <p className="font-bold text-sm">{formatINR(p.pricePaise)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}