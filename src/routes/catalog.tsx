import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/ProductCard";
import {
  CATEGORIES,
  getAllProducts,
  getStorefrontCms,
  type Category,
  type Product,
  type StorefrontCms,
} from "@/lib/products";
import { absoluteSiteUrl, SITE_NAME, SITE_SOCIAL_IMAGE_URL } from "@/lib/site";
import { trackCommerceEvent } from "@/lib/tracking";

const PAGE_SIZE = 12;

export const Route = createFileRoute("/catalog")({
  loader: async () => {
    const all = await getAllProducts();
    const cms = await getStorefrontCms();
    return { all, cms };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: "Catalog — Aghanims Phones and Gadgets" },
      {
        name: "description",
        content:
          "Browse boutique phones, audio, accessories and more. Precision-engineered hardware, shipped across India.",
      },
      { property: "og:title", content: "Catalog — Aghanims Phones and Gadgets" },
      {
        property: "og:description",
        content: "Browse boutique phones, audio, accessories and more.",
      },
      { property: "og:image", content: SITE_SOCIAL_IMAGE_URL },
      { property: "og:url", content: absoluteSiteUrl("/catalog") },
    ],
    links: [{ rel: "canonical", href: absoluteSiteUrl("/catalog") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${SITE_NAME} Catalog`,
          description:
            "Browse boutique phones, audio, accessories and more. Precision-engineered hardware, shipped across India.",
          url: absoluteSiteUrl("/catalog"),
          mainEntity: {
            "@type": "ItemList",
            name: "Phones and Gadgets",
            itemListElement: (loaderData?.all || []).map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: product.name,
              url: absoluteSiteUrl(`/product/${encodeURIComponent(product.slug)}`),
            })),
          },
        }),
      },
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
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const trackedSearches = useRef(new Set<string>());

  const formFactors = [
    "all",
    "QWERTY",
    "QWERTY Android",
    "Legacy QWERTY",
    "Android Flip",
    "Luxury Flip",
    "Slider",
    "Android Keypad",
    "4G Keypad",
    "Mini Android",
    "Compact Android",
    "Compact iPhone",
    "E-Ink",
    "Mini",
    "Rugged",
    "Modular",
    "Audio",
    "Accessory",
    "Gaming",
  ];

  const filteredProducts = useMemo(() => {
    let result = [...all];

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (normalizedSearch) {
      result = result.filter((product) =>
        [product.name, product.brand, product.tagline, product.formFactor, product.category]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase().includes(normalizedSearch)),
      );
    }

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
  }, [all, cat, formFactor, availability, priceRange, searchTerm, sortBy]);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (normalizedSearch.length < 2 || trackedSearches.current.has(normalizedSearch)) return;

    const timer = window.setTimeout(() => {
      const matches = all
        .filter((product) =>
          [product.name, product.brand, product.tagline, product.formFactor, product.category]
            .filter(Boolean)
            .some((value) => String(value).toLocaleLowerCase().includes(normalizedSearch)),
        )
        .slice(0, PAGE_SIZE);

      trackCommerceEvent("search", {
        currency: "INR",
        value: 0,
        searchString: searchTerm.trim(),
        items: matches.map((product) => ({
          item_id: product.slug,
          item_name: product.name,
          price: product.pricePaise / 100,
          quantity: 1,
        })),
      });
      trackedSearches.current.add(normalizedSearch);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [all, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12 md:py-16">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>{" "}
            / Catalog
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary max-w-2xl">
            {cms.catalog_title}
          </h1>
          <p className="text-on-surface-variant mt-4 max-w-xl">{cms.catalog_subtitle}</p>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-outline-variant/40 pb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCat(c.id);
                setPage(1);
              }}
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

        <label className="mb-6 block">
          <span className="sr-only">Search products</span>
          <span className="relative block">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
              search
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Search phones and gadgets"
              className="w-full border border-outline-variant/50 bg-white py-3.5 pl-12 pr-4 text-sm text-primary shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary"
            />
          </span>
        </label>

        {/* Faceted Filtering Bar */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 p-6 rounded shadow-sm mb-12 space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">tune</span>
              Faceted Catalog Filtering
            </h3>
            <span className="text-[11px] font-bold text-on-surface-variant">
              {filteredProducts.length} {filteredProducts.length === 1 ? "DEVICE" : "DEVICES"}{" "}
              MATCHED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Form Factor */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                Form Factor
              </label>
              <select
                value={formFactor}
                onChange={(e) => {
                  setFormFactor(e.target.value);
                  setPage(1);
                }}
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) => {
                  setAvailability(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-outline-variant/40 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-primary focus:outline-none focus:border-primary shadow-sm"
              >
                <option value="all">All Items</option>
                <option value="in_stock">In Stock Only</option>
                <option value="waitlist">Pre-order / Waitlist</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                Price Range
              </label>
              <select
                value={priceRange}
                onChange={(e) => {
                  setPriceRange(e.target.value);
                  setPage(1);
                }}
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
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
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
              sentiment_dissatisfied
            </span>
            <p className="text-on-surface-variant font-medium text-sm">
              No precision gadgets match your selected filter criteria.
            </p>
            <button
              onClick={() => {
                setCat("all");
                setFormFactor("all");
                setAvailability("all");
                setPriceRange("all");
                setSortBy("featured");
                setSearchTerm("");
                setPage(1);
              }}
              className="bg-primary text-on-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm inline-block mt-2"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
              {pageProducts.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
            {totalPages > 1 && (
              <nav
                aria-label="Catalog pages"
                className="mt-12 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="border border-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-primary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={pageNumber === currentPage ? "page" : undefined}
                    onClick={() => setPage(pageNumber)}
                    className={`h-9 min-w-9 border px-3 text-xs font-bold ${
                      pageNumber === currentPage
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant/60 bg-white text-primary"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  className="border border-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-primary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </SiteShell>
  );
}
