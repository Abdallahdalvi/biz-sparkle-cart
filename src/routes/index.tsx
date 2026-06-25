import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/ProductCard";
import { CookieBanner } from "@/components/CookieBanner";
import {
  PRODUCTS,
  getAllProducts,
  getStorefrontCms,
  type Product,
  type StorefrontCms,
} from "@/lib/products";
import { formatINR } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  loader: async () => {
    const all = await getAllProducts();
    const cms = await getStorefrontCms();
    return { all, cms };
  },
  head: () => ({
    meta: [
      { title: "TECHLAB — The Niche Tech Revolution" },
      {
        name: "description",
        content:
          "Boutique keypad Androids, transparent audio, and minimalist daily drivers. Shipped across India.",
      },
      { property: "og:title", content: "TECHLAB — The Niche Tech Revolution" },
      {
        property: "og:description",
        content: "Boutique keypad Androids, transparent audio, and minimalist daily drivers.",
      },
      { property: "og:image", content: PRODUCTS[0].images[0] },
      { name: "twitter:image", content: PRODUCTS[0].images[0] },
    ],
  }),
  component: Index,
});

function Index() {
  const { all, cms } = Route.useLoaderData() as { all: Product[]; cms: StorefrontCms };
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const trending = all.slice(0, 3);
  const drivers = all.slice(0, 4);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative bg-white overflow-hidden border-b border-outline-variant/20">
        <div className="relative z-10 w-full px-6 sm:px-12 lg:px-16 max-w-[1320px] mx-auto pt-10 pb-24 md:pt-16 md:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary px-2.5 py-1 rounded-sm inline-block shadow-sm bg-primary/5">
              LIMITED RELEASE ENGINE
            </span>
            <h1 className="text-4xl md:text-6xl text-primary leading-tight font-bold">
              {cms.hero_title}
            </h1>
            <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
              {cms.hero_subtitle}
            </p>
            <div className="pt-2">
              <Link
                to="/catalog"
                className="inline-flex bg-primary text-on-primary px-12 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all items-center gap-2 shadow-sm"
              >
                VIEW CATALOG{" "}
                <span className="material-symbols-outlined text-base">trending_flat</span>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 h-[380px] sm:h-[500px]">
            <a
              href={cms.hero_1_link}
              className="relative overflow-hidden shopify-border group h-full shadow-sm block w-full"
            >
              <img
                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                src={cms.hero_1_image}
                alt={cms.hero_1_label}
              />
              <div className="absolute bottom-4 left-4 glass-panel px-3 py-1 bg-white/90 backdrop-blur-sm border border-outline-variant/30 shadow-sm">
                <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
                  {cms.hero_1_label}
                </p>
              </div>
            </a>
            <div className="grid grid-rows-2 gap-4 h-full w-full">
              <a
                href={cms.hero_2_link}
                className="relative overflow-hidden shopify-border group shadow-sm block w-full h-full"
              >
                <img
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                  src={cms.hero_2_image}
                  alt={cms.hero_2_label}
                />
                <div className="absolute bottom-4 left-4 glass-panel px-3 py-1 bg-white/90 backdrop-blur-sm border border-outline-variant/30 shadow-sm">
                  <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
                    {cms.hero_2_label}
                  </p>
                </div>
              </a>
              <a
                href="https://whatsapp.com/channel/0029Vaexample"
                target="_blank"
                rel="noreferrer"
                className="relative border-2 border-emerald-500 bg-white hover:bg-emerald-50/50 flex flex-col justify-center items-center text-center p-4 shadow-sm w-full h-full transition-colors group block"
              >
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 mb-2 group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.245 3.481 5.235 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.793.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.579-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <p className="font-bold text-lg uppercase tracking-tight text-primary">
                  UPDATES ON WHATSAPP
                </p>
                <p className="text-[11px] font-bold text-on-surface-variant tracking-widest uppercase mt-1">
                  JOIN CHANNEL FOR LATEST PRODUCTS
                </p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-12 md:py-16 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl text-primary mb-2 font-bold">{cms.trending_title}</h2>
            <p className="text-on-surface-variant uppercase tracking-widest text-[11px] font-bold">
              {cms.trending_subtitle}
            </p>
          </div>
          <Link
            to="/catalog"
            className="text-[11px] font-bold text-primary tracking-widest flex items-center gap-1 hover:underline underline-offset-4 flex-shrink-0"
          >
            SEE ALL <span className="material-symbols-outlined text-sm">arrow_outward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trending.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Keypad Android Collection */}
      <section className="bg-white py-12 md:py-16 border-y border-outline-variant/30">
        <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto flex flex-col md:flex-row items-center gap-20">
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="text-4xl text-primary font-bold">{cms.keypad_title}</h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">{cms.keypad_desc}</p>
            <ul className="space-y-2 text-[13px] font-bold uppercase tracking-wider text-primary">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base">check_circle</span> Full
                Google Play Support
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base">check_circle</span> Tactile
                QWERTY & T9 Options
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base">check_circle</span>{" "}
                Privacy-Hardened Firmware
              </li>
            </ul>
            <Link
              to="/catalog"
              className="inline-block bg-primary text-on-primary px-10 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
            >
              SHOP THE KEYPADS
            </Link>
          </div>
          <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href={cms.keypad_banner_1_link}
              className="aspect-[4/5] bg-surface-container-low shopify-border overflow-hidden shadow-sm block group"
            >
              <img
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                src={cms.keypad_banner_1_image}
                alt="Keypad Phone 1"
              />
            </a>
            <a
              href={cms.keypad_banner_2_link}
              className="aspect-[4/5] bg-surface-container-low shopify-border overflow-hidden shadow-sm sm:mt-8 block group"
            >
              <img
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                src={cms.keypad_banner_2_image}
                alt="Keypad Phone 2"
              />
            </a>
          </div>
        </div>
      </section>

      {/* Minimalist Daily Drivers */}
      <section className="py-12 md:py-16 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl text-primary mb-2 uppercase tracking-tight font-bold">
            {cms.drivers_title}
          </h2>
          <p className="text-on-surface-variant uppercase tracking-widest text-[11px] font-bold">
            {cms.drivers_subtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {drivers.map((p) => (
            <Link
              key={p.slug}
              to="/product/$slug"
              params={{ slug: p.slug }}
              className="bg-white shopify-border p-5 group hover:shopify-shadow transition-all shadow-sm"
            >
              <div className="aspect-square mb-6 overflow-hidden shopify-border bg-surface-container-low">
                <img
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                  src={p.images[0]}
                  alt={p.name}
                />
              </div>
              <h4 className="font-bold text-center text-sm uppercase tracking-tight mb-1">
                {p.name}
              </h4>
              <p className="text-[10px] font-bold text-on-surface-variant text-center uppercase tracking-widest mb-3">
                {p.tagline}
              </p>
              <div className="flex items-center justify-center gap-1.5">
                {p.compareAtPaise && p.compareAtPaise > p.pricePaise && (
                  <span className="text-[11px] text-on-surface-variant line-through">
                    {formatINR(p.compareAtPaise)}
                  </span>
                )}
                <span className="text-primary text-center font-bold text-base">
                  {formatINR(p.pricePaise)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* 4 to 8 Pointer Section (Trust & Value Props) */}
      {cms.pointers && cms.pointers.length > 0 && (
        <section className="bg-white py-12 md:py-16 border-y border-outline-variant/30">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {cms.pointers.map((ptr, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <span className="material-symbols-outlined text-3xl text-[#2b4c9b] flex-shrink-0 group-hover:scale-110 transition-transform">
                  {ptr.icon}
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs md:text-sm text-primary uppercase tracking-wider">
                    {ptr.title}
                  </h4>
                  <p className="text-[11px] md:text-xs text-on-surface-variant leading-relaxed">
                    {ptr.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Google Reviews Section */}
      {cms.reviews && cms.reviews.length > 0 && (
        <section className="bg-surface-container-lowest py-16 md:py-24 border-b border-outline-variant/30">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12 tracking-tight">
              Our Happy Customers
            </h2>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
              {/* Summary Card */}
              <div className="bg-white p-6 shopify-border shadow-sm flex flex-col justify-between min-w-[280px] max-w-sm w-full lg:w-auto">
                <div className="flex items-center gap-4">
                  <img
                    src={PRODUCTS[0].images[0]}
                    alt="Store review logo"
                    className="w-12 h-12 bg-surface-container-low shopify-border flex-shrink-0 object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-primary">
                      {cms.reviews_heading?.store_name || "Dumbphones India"}
                    </h4>
                    <div className="flex items-center gap-1 my-1 text-amber-400 text-xs">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant font-medium">
                      {cms.reviews_heading?.total_reviews || 84} Google reviews
                    </p>
                  </div>
                </div>
                <a
                  href="https://search.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="border border-outline-variant/80 px-4 py-2.5 text-xs font-bold text-primary hover:bg-surface-container-low w-full text-center block mt-6 shadow-sm transition-colors"
                >
                  Write a review
                </a>
              </div>

              {/* Review Cards Carousel */}
              <div className="flex items-center gap-4 w-full lg:w-auto flex-1 overflow-hidden">
                <button
                  onClick={() =>
                    setReviewIndex((prev) => (prev === 0 ? cms.reviews.length - 1 : prev - 1))
                  }
                  className="bg-white p-2 shopify-border shadow-sm text-primary hover:bg-surface-container-low transition-all hidden sm:flex items-center justify-center flex-shrink-0"
                  aria-label="Previous review"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                  {cms.reviews.map((rev, i) => (
                    <div
                      key={i}
                      className={`bg-white p-6 shopify-border shadow-sm space-y-4 flex flex-col justify-between max-w-sm mx-auto w-full ${i >= 3 ? "hidden md:flex" : ""}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-inner">
                              {rev.avatar || rev.author[0]}
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-primary leading-tight">
                                {rev.author}
                              </h5>
                              <span className="text-[10px] text-on-surface-variant">
                                {rev.time}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-blue-600 text-base flex items-center">
                            G
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                          {Array.from({ length: rev.stars }).map((_, s) => (
                            <span key={s}>★</span>
                          ))}
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-4">
                          {rev.snippet}
                        </p>
                      </div>
                      <span className="text-[10px] text-on-surface-variant hover:underline cursor-pointer pt-2 border-t border-outline-variant/20 inline-block">
                        Read more
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setReviewIndex((prev) => (prev === cms.reviews.length - 1 ? 0 : prev + 1))
                  }
                  className="bg-white p-2 shopify-border shadow-sm text-primary hover:bg-surface-container-low transition-all hidden sm:flex items-center justify-center flex-shrink-0"
                  aria-label="Next review"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Homepage FAQs */}
      {cms.faqs && cms.faqs.length > 0 && (
        <section className="bg-white py-12 md:py-16 border-y border-outline-variant/30">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto w-full">
            <h2 className="text-3xl font-bold text-primary mb-12 text-center tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {cms.faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-outline-variant/40 bg-white shopify-border overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full py-4 px-6 text-left font-bold text-base text-primary flex justify-between items-center gap-4 hover:bg-surface-container-low transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span className="material-symbols-outlined text-xl text-primary/70 flex-shrink-0 transition-transform duration-300">
                      {openFaq === i ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 pt-1 text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/20 bg-surface-container-low/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Request a Product */}
      <section className="pt-12 pb-4 md:pt-16 md:pb-6 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="bg-white shopify-border p-margin-desktop flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-lg text-center md:text-left space-y-3">
            <h2 className="text-3xl text-primary font-bold tracking-tight">
              Can't Find Your Dream Gadget?
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Looking for a rare E-ink tablet, a specific Blackberry Android hybrid, or an unlisted
              import? Drop the specs below and our sourcing team will track it down for you.
            </p>
          </div>
          <form
            className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-0"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Gadget request received! Our sourcing team will investigate and reach out.");
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <input
              required
              type="text"
              placeholder="ENTER PRODUCT NAME OR SPECS..."
              className="bg-surface-container-low border border-outline-variant/30 px-6 py-4 placeholder:text-on-surface-variant/50 font-medium text-sm w-full md:w-80 focus:outline-none focus:border-primary transition-colors box-border"
            />
            <button className="bg-primary text-on-primary px-8 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 flex-shrink-0">
              <span className="material-symbols-outlined text-base">send</span>
              REQUEST
            </button>
          </form>
        </div>
      </section>

      <CookieBanner />
    </SiteShell>
  );
}
