import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, getAllProducts, getStorefrontCms, type Category, type Product, type StorefrontCms } from "@/lib/products";

export const Route = createFileRoute("/catalog")({
  loader: async () => {
    const all = await getAllProducts();
    const cms = await getStorefrontCms();
    return { all, cms };
  },
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
  const { all, cms } = Route.useLoaderData() as { all: Product[]; cms: StorefrontCms };
  
  // Filtering States
  const [cat, setCat] = useState<Category | "all">("all");
  const [formFactor, setFormFactor] = useState<string>("all");
  const [availability, setAvailability] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");

  const formFactors = ["all", "QWERTY", "E-Ink", "Mini", "Rugged", "Modular", "Audio", "Accessory", "Gaming"];

  const filteredProducts = useMemo(() => {
    let result = [...all];

    // Category filter
    if (cat !== "all") {
      result = result.filter((p) => p.category === cat);
    }

    // Form Factor filter
    if (formFactor !== "all") {
      result = result.filter((p) => p.formFactor === formFactor);
    }

    // Availability filter
    if (availability === "in_stock") {
      result = result.filter((p) => p.stock > 0);
    } else if (availability === "waitlist") {
      result = result.filter((p) => p.stock === 0);
    }

    // Price Range filter
    if (priceRange === "under_15k") {
      result = result.filter((p) => p.pricePaise < 1500000);
    } else if (priceRange === "15k_25k") {
      result = result.filter((p) => p.pricePaise >= 1500000 && p.pricePaise <= 2500000);
    } else if (priceRange === "above_25k") {
      result = result.filter((p) => p.pricePaise > 2500000);
    }

    // Sort By
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.pricePaise - b.pricePaise);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.pricePaise - a.pricePaise);
    }

    return result;
  }, [all, cat, formFactor, availability, priceRange, sortBy]);

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12 md:py-16">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            <Link to="/" className="hover:text-primary">Home</Link> / Catalog
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary max-w-2xl">
            {cms.catalog_title}
          </h1>
          <p className="text-on-surface-variant mt-4 max-w-xl">
            {cms.catalog_subtitle}
          </p>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-outline-variant/40 pb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={
                "px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors " +
                (cat === c.id
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary")
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Faceted Filtering Bar */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 p-6 rounded shadow-sm mb-12 space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">tune</span>
              Faceted Catalog Filtering
            </h3>
            <span className="text-[11px] font-bold text-on-surface-variant">
              {filteredProducts.length} {filteredProducts.length === 1 ? "DEVICE" : "DEVICES"} MATCHED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Form Factor */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Form Factor</label>
              <select
                value={formFactor}
                onChange={(e) => setFormFactor(e.target.value)}
                className="w-full bg-white border border-outline-variant/40 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-primary focus:outline-none focus:border-primary shadow-sm"
              >
                {formFactors.map((ff) => (
                  <option key={ff} value={ff}>
                    {ff === "all" ? "All Form Factors" : ff}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full bg-white border border-outline-variant/40 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-primary focus:outline-none focus:border-primary shadow-sm"
              >
                <option value="all">All Items</option>
                <option value="in_stock">In Stock Only</option>
                <option value="waitlist">Pre-order / Waitlist</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full bg-white border border-outline-variant/40 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-primary focus:outline-none focus:border-primary shadow-sm"
              >
                <option value="all">All Prices</option>
                <option value="under_15k">Under ₹15,000</option>
                <option value="15k_25k">₹15,000 - ₹25,000</option>
                <option value="above_25k">Above ₹25,000</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-outline-variant/40 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-primary focus:outline-none focus:border-primary shadow-sm"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-outline-variant/30 py-20 text-center rounded shadow-sm space-y-3">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">sentiment_dissatisfied</span>
            <p className="text-on-surface-variant font-medium text-sm">No precision gadgets match your selected filter criteria.</p>
            <button
              onClick={() => {
                setCat("all");
                setFormFactor("all");
                setAvailability("all");
                setPriceRange("all");
                setSortBy("featured");
              }}
              className="bg-primary text-on-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm inline-block mt-2"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredProducts.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </section>
    </SiteShell>
  );
}