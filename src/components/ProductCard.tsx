import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block aspect-square relative overflow-hidden shopify-border bg-white mb-4"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <div className="absolute top-4 left-4">
            <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
              {product.badge}
            </span>
          </div>
        )}
      </Link>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base text-on-surface uppercase tracking-tight">{product.name}</h3>
          <p className="font-bold text-on-surface">{formatINR(product.pricePaise)}</p>
        </div>
        <p className="text-[11px] text-on-surface-variant font-medium uppercase tracking-widest mb-4">
          {product.tagline}
        </p>
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="block text-center w-full border border-primary text-primary py-3 font-bold text-[11px] tracking-widest uppercase hover:bg-primary hover:text-white transition-colors"
        >
          View Product
        </Link>
      </div>
    </div>
  );
}