import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/ProductCard";
import {
  getAllProducts,
  getStorefrontCms,
  orderProducts,
  type Product,
  type StorefrontCms,
} from "@/lib/products";
import {
  GOOGLE_ALL_REVIEWS_URL,
  GOOGLE_MAPS_PLACE_URL,
  GOOGLE_WRITE_REVIEW_URL,
} from "@/lib/google-reviews";
import {
  SITE_DESCRIPTION,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_SOCIAL_IMAGE_URL,
  SITE_URL,
} from "@/lib/site";
import { OFFICIAL_SOCIAL_LINKS } from "@/lib/social-links";
import { getYouTubeChannelVideos, type YouTubeChannelVideo } from "@/lib/youtube.functions";

const HOME_PRODUCT_LIMIT = 12;
function youtubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1) || null;
    if (host !== "youtube.com" && host !== "m.youtube.com") return null;
    return (
      parsed.searchParams.get("v") ||
      parsed.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1] ||
      null
    );
  } catch {
    return null;
  }
}

function YouTubeVideoCard({ video }: { video: YouTubeChannelVideo }) {
  const [hoverPreview, setHoverPreview] = useState(false);
  const [manualPlayback, setManualPlayback] = useState(false);
  const [mobileFullscreen, setMobileFullscreen] = useState(false);
  const playing = hoverPreview || manualPlayback;
  const publishedLabel = video.publishedAt
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(video.publishedAt),
      )
    : "Official channel";

  useEffect(() => {
    if (!mobileFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFullscreen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileFullscreen]);

  const beginPlayback = () => {
    if (window.matchMedia("(max-width: 639px)").matches) {
      setMobileFullscreen(true);
      return;
    }
    setManualPlayback(true);
  };

  return (
    <>
      <article
        className="overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-lg shopify-border"
        onMouseEnter={() => {
          if (window.matchMedia("(min-width: 640px) and (hover: hover)").matches) {
            setHoverPreview(true);
          }
        }}
        onMouseLeave={() => setHoverPreview(false)}
      >
        <div className="relative aspect-[9/16] overflow-hidden bg-black">
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&mute=1&rel=0&playsinline=1&controls=1`}
              title={video.title}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <button
              type="button"
              onClick={beginPlayback}
              aria-label={`Play ${video.title} full screen`}
              className="group relative h-full w-full text-left"
            >
              <img
                src={video.thumbnail}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
              <span className="absolute left-3 top-3 bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm sm:text-xs">
                <span className="sm:hidden">Tap for full screen</span>
                <span className="hidden sm:inline">Hover to preview</span>
              </span>
              <span className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-bold text-white">
                {video.title}
              </span>
            </button>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-primary">{video.title}</h3>
            <p className="mt-1 text-xs font-medium text-on-surface-variant">
              {video.views === null
                ? publishedLabel
                : `${video.views.toLocaleString("en-IN")} views • ${publishedLabel}`}
            </p>
          </div>
        </div>
      </article>

      {mobileFullscreen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center bg-black"
            role="dialog"
            aria-modal="true"
            aria-label={`${video.title} full-screen video`}
          >
            <button
              type="button"
              onClick={() => setMobileFullscreen(false)}
              className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur"
              aria-label="Close video"
            >
              <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                close
              </span>
            </button>
            <div className="h-full max-h-[100dvh] w-full max-w-[min(100vw,56.25vh)] bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&mute=0&rel=0&playsinline=1&controls=1`}
                title={video.title}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export const Route = createFileRoute("/")({
  loader: async () => {
    const [all, cms, channelVideos] = await Promise.all([
      getAllProducts(),
      getStorefrontCms(),
      getYouTubeChannelVideos(),
    ]);
    return { all, cms, channelVideos };
  },
  head: ({ loaderData }) => {
    const cms = loaderData?.cms;
    const whatsappChannel = cms?.whatsapp_channel_url || "";
    const sameAs = [
      GOOGLE_MAPS_PLACE_URL,
      OFFICIAL_SOCIAL_LINKS.instagram,
      OFFICIAL_SOCIAL_LINKS.facebook,
      OFFICIAL_SOCIAL_LINKS.youtube,
      ...(/^https:\/\/(?:www\.)?whatsapp\.com\/channel\//i.test(whatsappChannel)
        ? [whatsappChannel]
        : [OFFICIAL_SOCIAL_LINKS.whatsappChannel]),
    ];
    return {
      meta: [
        { title: `${SITE_NAME} — Hard-to-find phones and gadgets` },
        { name: "description", content: SITE_DESCRIPTION },
        { property: "og:title", content: `${SITE_NAME} — Hard-to-find phones and gadgets` },
        { property: "og:description", content: SITE_DESCRIPTION },
        { property: "og:image", content: SITE_SOCIAL_IMAGE_URL },
        { property: "og:url", content: SITE_URL },
        { name: "twitter:image", content: SITE_SOCIAL_IMAGE_URL },
      ],
      links: [{ rel: "canonical", href: SITE_URL }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                url: SITE_URL,
                name: SITE_NAME,
                description: SITE_DESCRIPTION,
                potentialAction: [
                  {
                    "@type": "SearchAction",
                    target: `${SITE_URL}/catalog?q={search_term_string}`,
                    "query-input": "required name=search_term_string",
                  },
                ],
              },
              {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: SITE_NAME,
                url: SITE_URL,
                logo: SITE_LOGO_URL,
                hasMap: GOOGLE_MAPS_PLACE_URL,
                ...(cms?.biz_phone
                  ? {
                      contactPoint: [
                        {
                          "@type": "ContactPoint",
                          telephone: cms.biz_phone,
                          contactType: "customer service",
                          areaServed: "IN",
                          availableLanguage: ["en", "hi"],
                        },
                      ],
                    }
                  : {}),
                sameAs,
              },
            ],
          }),
        },
      ],
    };
  },
  component: Index,
});

function Index() {
  const { all, cms, channelVideos } = Route.useLoaderData() as {
    all: Product[];
    cms: StorefrontCms;
    channelVideos: YouTubeChannelVideo[];
  };
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const youtubeVideos = (
    channelVideos.length
      ? channelVideos
      : cms.videos.flatMap((video) => {
          const id = video.platform.toLowerCase() === "youtube" ? youtubeVideoId(video.url) : null;
          return id
            ? [
                {
                  id,
                  title: video.title,
                  thumbnail: video.image || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                  publishedAt: "",
                  views: null,
                },
              ]
            : [];
        })
  ).slice(0, 4);
  const visibleReviews = Array.from(
    { length: Math.min(3, cms.reviews.length) },
    (_, offset) => cms.reviews[(reviewIndex + offset) % cms.reviews.length],
  );
  const whatsappChannelUrl = /^https:\/\/(?:www\.)?whatsapp\.com\/channel\//i.test(
    cms.whatsapp_channel_url,
  )
    ? cms.whatsapp_channel_url
    : "/legal/contact";
  const heroTitleFontSize = Math.min(76, Math.max(36, Number(cms.hero_title_font_size) || 52));
  const homepageProducts = orderProducts(
    all.filter((product) => product.stock > 0),
    cms.product_order,
  ).slice(0, HOME_PRODUCT_LIMIT);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative bg-white overflow-hidden border-b border-outline-variant/20">
        <div className="relative z-10 mx-auto grid w-full max-w-[1320px] grid-cols-1 items-center gap-5 px-5 pb-12 pt-5 sm:px-12 sm:pb-20 sm:pt-10 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:pb-32 lg:pt-16">
          <div className="space-y-3 sm:space-y-5 lg:space-y-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary px-2.5 py-1 rounded-sm inline-block shadow-sm bg-primary/5">
              {cms.hero_eyebrow_label}
            </span>
            <h1
              className="max-w-[22ch] font-bold leading-[1.08] text-primary"
              style={{
                fontSize: `clamp(1.8rem, 7vw, ${heroTitleFontSize}px)`,
              }}
            >
              {cms.hero_title}
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-on-surface-variant sm:text-lg">
              {cms.hero_subtitle}
            </p>
            <div className="pt-2 hidden lg:block">
              <a
                href="#products"
                className="inline-flex bg-primary text-on-primary px-12 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all items-center gap-2 shadow-sm"
              >
                SHOP PRODUCTS{" "}
                <span className="material-symbols-outlined text-base">trending_flat</span>
              </a>
            </div>
          </div>
          <div className="relative isolate flex flex-col">
            <div className="relative z-0 grid h-[300px] w-full grid-cols-2 gap-3 sm:h-[440px] sm:gap-4 lg:h-[500px]">
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
                  <p className="text-[10px] font-bold tracking-wider md:tracking-widest text-primary uppercase whitespace-nowrap">
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
                    <p className="text-[10px] font-bold tracking-wider md:tracking-widest text-primary uppercase whitespace-nowrap">
                      {cms.hero_2_label}
                    </p>
                  </div>
                </a>
                <a
                  href={whatsappChannelUrl}
                  target={whatsappChannelUrl.startsWith("https://") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="relative border-2 border-emerald-500 bg-white hover:bg-emerald-50/50 flex flex-col justify-center items-center text-center p-2 sm:p-4 shadow-sm w-full h-full transition-colors group block"
                >
                  <svg
                    className="w-7 h-7 sm:w-10 sm:h-10 text-emerald-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.245 3.481 5.235 3.48 8.414-.003 6.557-5.338 11.892-11.892 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.793.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.579-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <p className="font-bold text-[15px] sm:text-lg uppercase tracking-tight text-primary leading-tight">
                    UPDATES ON WHATSAPP
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-bold text-on-surface-variant tracking-wider uppercase mt-1 px-1 leading-snug">
                    JOIN CHANNEL FOR LATEST PRODUCTS
                  </p>
                </a>
              </div>
            </div>
            <div className="relative z-10 mt-4 block w-full text-center sm:mt-6 sm:text-left lg:hidden">
              <a
                href="#products"
                className="inline-flex bg-primary text-on-primary px-12 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
              >
                SHOP PRODUCTS{" "}
                <span className="material-symbols-outlined text-base">trending_flat</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Shopping assurances */}
      {cms.pointers && cms.pointers.length > 0 && (
        <section className="border-b border-outline-variant/30 bg-white py-7 md:py-9">
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-5 px-margin-mobile md:grid-cols-4 md:gap-8 md:px-margin-desktop">
            {cms.pointers.map((ptr, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <span className="material-symbols-outlined flex-shrink-0 text-2xl text-[#2b4c9b] transition-transform group-hover:scale-110">
                  {ptr.icon}
                </span>
                <div className="space-y-1">
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-primary md:text-xs">
                    {ptr.title}
                  </h2>
                  <p className="text-[10px] leading-relaxed text-on-surface-variant md:text-[11px]">
                    {ptr.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured storefront products */}
      <section
        id="products"
        className="scroll-mt-20 border-b border-outline-variant/30 bg-surface-container-low py-12 md:py-20"
      >
        <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-margin-desktop">
          <div className="mb-7 flex items-end justify-between gap-5 md:mb-10">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-px w-8 bg-[#2b4c9b]" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2b4c9b]">
                  Popular right now
                </p>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl md:text-4xl">
                Most in-demand products
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
                Shop customer favourites with COD options and free delivery.
              </p>
            </div>
            <Link
              to="/catalog"
              className="hidden min-h-11 flex-shrink-0 items-center gap-2 border border-primary bg-white px-5 py-3 text-xs font-bold uppercase tracking-wide text-primary shadow-sm transition-colors hover:bg-primary hover:text-on-primary sm:inline-flex"
            >
              View all
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {homepageProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>

          <div className="mt-8 flex justify-center sm:hidden">
            <Link
              to="/catalog"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-primary px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-on-primary shadow-sm transition-opacity hover:opacity-90"
            >
              View all products
              <span className="material-symbols-outlined text-base" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>

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
                    src="/logo.png"
                    alt="Store review logo"
                    className="w-12 h-12 bg-surface-container-low shopify-border flex-shrink-0 object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-primary">
                      {cms.reviews_heading?.store_name || "Aghanims Phones and Gadgets"}
                    </h4>
                    <div className="flex items-center gap-1 my-1 text-amber-400 text-xs">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant font-medium">
                      {cms.reviews_heading.total_reviews} Google reviews • Verified profile
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-2">
                  <a
                    href={GOOGLE_MAPS_PLACE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-outline-variant/80 px-4 py-2.5 text-xs font-bold text-primary hover:bg-surface-container-low w-full text-center block shadow-sm transition-colors"
                  >
                    View on Google Maps
                  </a>
                  <a
                    href={GOOGLE_WRITE_REVIEW_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-primary px-4 py-2.5 text-xs font-bold text-on-primary hover:opacity-90 w-full text-center block shadow-sm transition-opacity"
                  >
                    Write a review
                  </a>
                </div>
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
                  {visibleReviews.map((rev, i) => (
                    <div
                      key={`${rev.author}-${reviewIndex}-${i}`}
                      className="bg-white p-6 shopify-border shadow-sm space-y-4 flex flex-col justify-between max-w-sm mx-auto w-full"
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
                        <p className="whitespace-pre-line text-xs text-on-surface-variant leading-relaxed">
                          {rev.snippet}
                        </p>
                      </div>
                      <a
                        href={GOOGLE_ALL_REVIEWS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-on-surface-variant hover:underline cursor-pointer pt-2 border-t border-outline-variant/20 inline-block"
                      >
                        Read reviews on Google
                      </a>
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

      {/* Official YouTube uploads: one click starts privacy-enhanced playback in place. */}
      {youtubeVideos.length > 0 && (
        <section className="border-b border-outline-variant/30 bg-white py-12 md:py-16">
          <div className="mx-auto max-w-[1280px] px-margin-mobile md:px-margin-desktop">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-red-700">
                  From YouTube
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-primary">
                  Watch before you buy
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Watch every upload from our official channel without leaving the store.
                </p>
              </div>
              <a
                href={OFFICIAL_SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden flex-shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-primary hover:underline sm:flex"
              >
                View channel{" "}
                <span className="material-symbols-outlined text-base">arrow_outward</span>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {youtubeVideos.map((video) => (
                <YouTubeVideoCard key={video.id} video={video} />
              ))}
            </div>
            <a
              href={OFFICIAL_SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-1 border border-primary px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-primary sm:hidden"
            >
              View YouTube channel
              <span className="material-symbols-outlined text-base">arrow_outward</span>
            </a>
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
              import? Send us the specs and our sourcing team will investigate availability.
            </p>
          </div>
          <Link
            to="/legal/contact"
            className="relative z-10 bg-primary text-on-primary px-8 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">send</span>
            REQUEST VIA SUPPORT
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
