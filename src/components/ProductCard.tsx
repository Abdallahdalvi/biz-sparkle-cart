import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const discountPercent =
    product.compareAtPaise && product.compareAtPaise > product.pricePaise
      ? Math.round(((product.compareAtPaise - product.pricePaise) / product.compareAtPaise) * 100)
      : 0;
  const categoryLabel =
    product.category === "phones"
      ? "Phone"
      : product.category === "audio"
        ? "Audio"
        : product.category === "wearables"
          ? "Wearable"
          : product.category === "gaming"
            ? "Gaming"
            : "Accessory";

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden border border-outline-variant/70 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_14px_32px_rgba(15,23,42,0.10)]">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-gradient-to-b from-surface-container-lowest to-surface-container-low p-2.5 sm:aspect-[4/5] sm:p-5"
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.045]"
        />
        <div className="absolute left-3 top-3 hidden max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5 sm:flex">
          {product.badge && (
            <span className="bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-on-primary shadow-sm sm:text-xs">
              {product.badge}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-[#e8f7ee] px-2 py-1 text-[10px] font-bold text-[#08783e] shadow-sm sm:text-xs">
              {discountPercent}% off
            </span>
          )}
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-end gap-2 sm:bottom-3 sm:left-3 sm:right-3 sm:justify-between">
          <span className="hidden border border-outline-variant/70 bg-white/95 px-2 py-1 text-xs font-bold uppercase tracking-wide text-on-surface shadow-sm backdrop-blur sm:inline-flex">
            {categoryLabel}
          </span>
          {product.images.length > 1 && (
            <span className="flex items-center gap-1 border border-outline-variant/70 bg-white/95 px-2 py-1 text-[10px] font-semibold text-on-surface-variant shadow-sm backdrop-blur sm:text-xs">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                photo_library
              </span>
              {product.images.length}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-bold leading-snug text-on-surface transition-colors group-hover:text-[#2b4c9b] sm:min-h-[3rem] sm:text-base">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 min-w-0 truncate whitespace-nowrap text-[11px] leading-relaxed text-on-surface-variant sm:line-clamp-2 sm:min-h-10 sm:whitespace-normal sm:text-sm">
          {product.tagline}
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:mt-3">
          <span className="text-base font-extrabold tracking-tight text-on-surface sm:text-xl">
            {formatINR(product.pricePaise)}
          </span>
          {product.compareAtPaise && product.compareAtPaise > product.pricePaise && (
            <span className="text-xs font-medium text-on-surface-variant line-through sm:text-sm">
              {formatINR(product.compareAtPaise)}
            </span>
          )}
        </div>

        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-1 bg-primary px-2 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-on-primary shadow-sm transition-all hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:mt-4 sm:min-h-11 sm:gap-1.5 sm:px-3 sm:py-2.5 sm:text-sm sm:tracking-wide"
        >
          <span className="whitespace-nowrap">View details</span>
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
}
