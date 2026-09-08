import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex h-full min-w-0 flex-col">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative mb-3 block aspect-square overflow-hidden bg-white shopify-border"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.badge && (
          <div className="absolute left-2 top-2 sm:left-4 sm:top-4">
            <span className="bg-primary px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-on-primary shadow-sm sm:text-[10px] sm:tracking-widest">
              {product.badge}
            </span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col">
        <div className="min-w-0 sm:flex sm:items-start sm:justify-between sm:gap-3">
          <h3 className="text-xs font-bold uppercase leading-snug tracking-tight text-on-surface sm:text-base">
            {product.name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:mt-0 sm:flex-shrink-0 sm:justify-end">
            {product.compareAtPaise && product.compareAtPaise > product.pricePaise && (
              <span className="text-[10px] font-medium text-on-surface-variant line-through sm:text-xs">
                {formatINR(product.compareAtPaise)}
              </span>
            )}
            <span className="text-sm font-bold text-on-surface sm:text-base">
              {formatINR(product.pricePaise)}
            </span>
          </div>
        </div>
        <p className="mt-1 line-clamp-2 min-h-8 text-[9px] font-medium uppercase leading-relaxed tracking-wider text-on-surface-variant sm:text-[11px] sm:tracking-widest">
          {product.tagline}
        </p>
        <p className="mb-3 mt-2 text-[9px] font-bold leading-snug text-emerald-800 sm:text-[10px]">
          {product.codAdvancePaise > 0
            ? `${formatINR(product.codAdvancePaise)} COD advance`
            : "Full COD available"}{" "}
          • Free delivery
        </p>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="mt-auto block w-full border border-primary py-2.5 text-center text-[9px] font-bold uppercase tracking-wider text-primary shadow-sm transition-colors hover:bg-primary hover:text-white sm:py-3 sm:text-[11px] sm:tracking-widest"
        >
          View Product
        </Link>
      </div>
    </article>
  );
}
