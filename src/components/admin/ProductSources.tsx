import { getProductSources } from "@/lib/product-sources";

export function ProductSources({
  metadata,
  compact = false,
}: {
  metadata: unknown;
  compact?: boolean;
}) {
  const sources = getProductSources(metadata);
  if (!sources.length) return null;
  if (compact) {
    return (
      <a
        href={sources[0].url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-[11px] font-medium text-primary underline underline-offset-2"
        aria-label={`Open supplier listing on ${sources[0].label}`}
      >
        Source: {sources[0].label} ↗
      </a>
    );
  }
  return (
    <section className="space-y-3 bg-white p-4 md:p-6 shopify-border" aria-label="Supplier sources">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
          Supplier sources
        </h4>
        <p className="mt-1 text-xs text-on-surface-variant">
          Internal reference links, visible only in product administration.
        </p>
      </div>
      <ul className="space-y-3">
        {sources.map((source) => (
          <li key={source.url} className="min-w-0">
            <p className="text-xs font-bold text-primary">
              {source.label}
              {source.primary && (
                <span className="ml-2 text-[10px] font-medium text-on-surface-variant">
                  Pricing source
                </span>
              )}
            </p>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all text-xs text-primary underline underline-offset-2"
            >
              {source.url} ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
