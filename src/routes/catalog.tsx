import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, productsByCategory, type Category } from "@/lib/products";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Catalog — TECHLAB" },
      { name: "description", content: "Browse boutique phones, audio, accessories and more. Precision-engineered hardware, shipped across India." },
      { property: "og:title", content: "Catalog — TECHLAB" },
      { property: "og:description", content: "Browse boutique phones, audio, accessories and more." },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const [cat, setCat] = useState<Category | "all">("all");
  const products = productsByCategory(cat);
  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12 md:py-16">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            <Link to="/" className="hover:text-primary">Home</Link> / Catalog
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary max-w-2xl">
            Precision Engineered Hardware.
          </h1>
          <p className="text-on-surface-variant mt-4 max-w-xl">
            Every device in our catalog is tested for tactile precision and longevity. No gimmicks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mb-10 border-b border-outline-variant/40 pb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={
                "px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors " +
                (cat === c.id
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-primary")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
        {products.length === 0 ? (
          <p className="text-on-surface-variant text-center py-20">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </section>
    </SiteShell>
  );
}