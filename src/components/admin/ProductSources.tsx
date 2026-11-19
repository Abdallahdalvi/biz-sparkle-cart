import { formatINR } from "@/lib/format";
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
  const record = metadata as {
    supplier_import?: {
      source_price_paise?: unknown;
      markup_percent?: unknown;
      retail_price_override_paise?: unknown;
      review_reasons?: unknown;
    };
  };
  const supplier = record.supplier_import;
  const reasons = Array.isArray(supplier?.review_reasons)
    ? supplier.review_reasons.filter((reason): reason is string => typeof reason === "string")
    : [];
  return (
    <section className="space-y-3 bg-white p-4 md:p-6 shopify-border" aria-label="Supplier sources">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
          Supplier sources
        </h4>
        {typeof supplier?.source_price_paise === "number" && (
          <p className="mt-1 text-xs text-on-surface-variant">
            Supplier price {formatINR(supplier.source_price_paise)}
            {typeof supplier.markup_percent === "number" && ` · ${supplier.markup_percent}% markup`}
            {typeof supplier.retail_price_override_paise === "number" &&
              ` · Fixed selling price ${formatINR(supplier.retail_price_override_paise)}`}
          </p>
        )}
      </div>
      {reasons.length > 0 && (
        <div className="rounded bg-amber-50 p-3 text-xs text-amber-950">
          <p className="font-bold">Supplier import review</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
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
