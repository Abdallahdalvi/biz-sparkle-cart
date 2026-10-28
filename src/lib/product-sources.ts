export interface ProductSource {
  url: string;
  label: string;
  primary: boolean;
}

function webUrl(value: unknown): URL | undefined {
  if (typeof value !== "string" || !value.trim()) return;
  try {
    const url = new URL(value.trim());
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return;
    url.hash = "";
    return url;
  } catch {
    return;
  }
}

/** Internal supplier references used by the admin product screens. */
export function getProductSources(metadata: unknown): ProductSource[] {
  if (!metadata || typeof metadata !== "object") return [];
  const details = metadata as Record<string, unknown>;
  const imported = details.supplier_import;
  const primary = webUrl(
    imported && typeof imported === "object"
      ? (imported as Record<string, unknown>).source_url
      : undefined,
  )?.href;
  const references = Array.isArray(details.source_references) ? details.source_references : [];
  const sources: ProductSource[] = [];
  const seen = new Set<string>();
  for (const value of [primary, ...references]) {
    const url = webUrl(value);
    if (!url || seen.has(url.href)) continue;
    seen.add(url.href);
    const host = url.hostname.replace(/^www\./, "");
    const label =
      host === "vintagemobilearena.in"
        ? "Vintage Mobile Arena"
        : host === "zoneofdeals.com"
          ? "Zone of Deals"
          : host;
    sources.push({ url: url.href, label, primary: url.href === primary });
  }
  return sources;
}
