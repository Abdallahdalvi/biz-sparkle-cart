import { createFileRoute, Link, useNavigate, type SearchSchemaInput } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/lib/use-auth";
import { useAdminProductSources } from "@/lib/use-admin-product-sources";
import { PhoneTypeFilters } from "@/components/PhoneTypeFilters";
import { CATEGORIES, getAllProducts, getStorefrontCms, type Category } from "@/lib/products";
import { absoluteSiteUrl, SITE_NAME, SITE_SOCIAL_IMAGE_URL } from "@/lib/site";
import { trackCommerceEvent } from "@/lib/tracking";
import { rankProducts } from "@/lib/product-ranking";
import {
  matchesQuickShopCategory,
  validPhoneType,
  type PhoneType,
} from "@/lib/quick-shop-categories";

const PAGE_SIZE = 30;

export const Route = createFileRoute("/products")({
  validateSearch: (search: { q?: string; type?: PhoneType | "all" } & SearchSchemaInput) => {
    const q = typeof search.q === "string" ? search.q.trim() : "";
    const type = validPhoneType(search.type);
    return { q: q || undefined, type: type === "all" ? undefined : type };
  },
  loader: async () => {
    const [all, cms] = await Promise.all([getAllProducts(), getStorefrontCms()]);
    return { all, cms, rankingSeed: crypto.randomUUID(), rankingTime: Date.now() };
  },
  head: ({ loaderData, match }) => ({
    meta: [
      { title: "Shop Keypad, Flip and Vintage Phones in India | Aghanims" },
      ...(match.search.q ? [{ name: "robots", content: "noindex, follow" }] : []),
      {
        name: "description",
        content:
          "Browse QWERTY, keypad, flip and rugged phones online in India. Compare Qin, Nokia, BlackBerry, CAT and more with secure checkout and tracked delivery.",
      },
      { property: "og:title", content: "Keypad, QWERTY & Flip Phone Products | Aghanims" },
      {
        property: "og:description",
        content: "Browse QWERTY, keypad, flip and rugged phones online in India.",
      },
      { property: "og:image", content: SITE_SOCIAL_IMAGE_URL },
      { property: "og:url", content: absoluteSiteUrl("/products") },
    ],
    links: [{ rel: "canonical", href: absoluteSiteUrl("/products") }],
    scripts:
      match.search.q || match.search.type
        ? []
        : [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                name: `${SITE_NAME} Products`,
                description: "Browse QWERTY, keypad, flip and rugged phones online in India.",
                url: absoluteSiteUrl("/products"),
                mainEntity: {
                  "@type": "ItemList",
                  name: "Phones and Gadgets",
                  itemListElement: rankProducts(
                    loaderData?.all || [],
                    "recommended",
                    loaderData?.rankingSeed,
                    loaderData?.rankingTime,
                  )
                    .slice(0, PAGE_SIZE)
                    .map((product, index) => ({
                      "@type": "ListItem",
                      position: index + 1,
                      name: product.name,
                      url: absoluteSiteUrl(`/product/${encodeURIComponent(product.slug)}`),
                    })),
                },
              }).replace(/</g, "\\u003c"),
            },
          ],
  }),
  component: Catalog,
});

function Catalog() {
  const { isAdmin, session } = useAuth();
  const { all, cms, rankingSeed, rankingTime } = Route.useLoaderData();
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });

  // Filtering States
  const [cat, setCat] = useState<Category | "all">("all");
  const [quickCategory, setQuickCategory] = useState<PhoneType | "all">(searchParams.type ?? "all");
  const [formFactor, setFormFactor] = useState<string>("all");
  const [availability, setAvailability] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [searchTerm, setSearchTerm] = useState(searchParams.q ?? "");
  const [page, setPage] = useState(1);
  const catalogResults = useRef<HTMLDivElement>(null);
  const trackedSearches = useRef(new Set<string>());

  useEffect(() => setSearchTerm(searchParams.q ?? ""), [searchParams.q]);
  useEffect(() => {
    setQuickCategory(searchParams.type ?? "all");
    setPage(1);
  }, [searchParams.type]);

  const selectPhoneType = (value: PhoneType | "all") => {
    setQuickCategory(value);
    setCat("all");
    setFormFactor("all");
    setPage(1);
    void navigate({
      search: (previous) => ({ ...previous, type: value === "all" ? undefined : value }),
    });
  };

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

  const brands = useMemo(
    () =>
      [...new Set(all.map((product) => product.brand).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [all],
  );
  const quickCategories = [
    {
      key: "blackberry",
      label: "BlackBerry",
      count: all.filter((product) => matchesQuickShopCategory(product, "blackberry")).length,
    },
    {
      key: "samsung",
      label: "Samsung",
      count: all.filter((product) => matchesQuickShopCategory(product, "samsung")).length,
    },
    {
      key: "nokia",
      label: "Nokia",
      count: all.filter((product) => matchesQuickShopCategory(product, "nokia")).length,
    },
    {
      key: "motorola",
      label: "Motorola",
      count: all.filter((product) => matchesQuickShopCategory(product, "motorola")).length,
    },
  ];

  const filteredProducts = useMemo(() => {
    let result = [...all];

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (normalizedSearch) {
      result = result.filter((product) =>
        [
          product.name,
          product.brand,
          product.tagline,
          product.formFactor,
          product.category,
          product.description,
          ...product.specs.flatMap((spec) => [spec.label, spec.value]),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase().includes(normalizedSearch)),
      );
    }

    // Category filter
    if (cat !== "all") {
      result = result.filter((p) => p.category === cat);
    }
    if (quickCategory !== "all") {
      result = result.filter((product) => matchesQuickShopCategory(product, quickCategory));
    }
    if (brand !== "all") result = result.filter((p) => p.brand === brand);

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
    } else {
      result = rankProducts(
        result,
        sortBy === "newest" ? "newest" : sortBy === "popular" ? "popular" : "recommended",
        rankingSeed,
        rankingTime,
      );
    }

    return result;
  }, [
    all,
    cat,
    quickCategory,
    brand,
    formFactor,
    availability,
    priceRange,
    searchTerm,
    sortBy,
    rankingSeed,
    rankingTime,
  ]);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (normalizedSearch.length < 2 || trackedSearches.current.has(normalizedSearch)) return;

    const timer = window.setTimeout(() => {
      const matches = all
        .filter((product) =>
          [
            product.name,
            product.brand,
            product.tagline,
            product.formFactor,
            product.category,
            product.description,
            ...product.specs.flatMap((spec) => [spec.label, spec.value]),
          ]
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
  function changePage(next: number) {
    setPage(Math.max(1, Math.min(next, totalPages)));
    catalogResults.current?.focus({ preventScroll: true });
    catalogResults.current?.scrollIntoView({ block: "start" });
  }
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const sources = useAdminProductSources(
    isAdmin ? session?.access_token : undefined,
    pageProducts.map(({ slug }) => slug),
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
                setQuickCategory("all");
                setPage(1);
                void navigate({ search: (previous) => ({ ...previous, type: undefined }) });
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

        <section aria-label="Shop popular categories" className="mb-7">
          <h2 className="mb-3 text-sm font-bold text-primary">Shop by phone type</h2>
          <PhoneTypeFilters products={all} value={quickCategory} onChange={selectPhoneType} />
          <h3 className="mb-3 mt-5 text-sm font-bold text-primary">Brand</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={brand === "all"}
              onClick={() => {
                setBrand("all");
                setPage(1);
              }}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${brand === "all" ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-white text-primary"}`}
            >
              All Brands
            </button>
            {quickCategories.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={brand === item.label}
                onClick={() => {
                  setBrand((current) => (current === item.label ? "all" : item.label));
                  setPage(1);
                }}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  brand === item.label
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant bg-white text-primary hover:border-primary"
                }`}
              >
                {item.label}
                <span className="text-xs opacity-75">{item.count}</span>
              </button>
            ))}
          </div>
        </section>

        <form
          className="mb-6 flex gap-2"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            void navigate({
              search: (previous) => ({ ...previous, q: searchTerm.trim() || undefined }),
            });
          }}
        >
          <label className="block min-w-0 flex-1">
            <span className="sr-only">Search products</span>
            <span className="relative block">
              <span
                aria-hidden="true"
                className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant"
              >
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
          <button
            type="submit"
            className="min-h-12 shrink-0 bg-primary px-5 text-sm font-bold text-on-primary hover:opacity-90"
          >
            Search
          </button>
        </form>

        <details className="mb-10 border border-outline-variant/40 bg-white shadow-sm">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg" aria-hidden="true">
                tune
              </span>
              More filters and sorting
            </span>
            <span className="text-xs font-medium text-on-surface-variant">
              {filteredProducts.length} devices
            </span>
          </summary>
          <div className="space-y-5 border-t border-outline-variant/30 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                  Brand
                </label>
                <select
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-white border border-outline-variant/40 px-3 py-2.5 text-xs font-bold text-primary shadow-sm"
                >
                  <option value="all">All Brands</option>
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
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
                  <option value="recommended">Recommended</option>
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newly Added</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </details>

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
                setBrand("all");
                setQuickCategory("all");
                setSortBy("recommended");
                setSearchTerm("");
                setPage(1);
                void navigate({ search: {} });
              }}
              className="bg-primary text-on-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm inline-block mt-2"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <div
              ref={catalogResults}
              tabIndex={-1}
              role="region"
              aria-label={`Catalog results, page ${currentPage}`}
              className="grid scroll-mt-32 grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4"
            >
              {pageProducts.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={p}
                  canEdit={isAdmin}
                  source={sources?.[p.slug]}
                />
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
                  onClick={() => changePage(currentPage - 1)}
                  className="border border-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-primary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={pageNumber === currentPage ? "page" : undefined}
                    onClick={() => changePage(pageNumber)}
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
                  onClick={() => changePage(currentPage + 1)}
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
