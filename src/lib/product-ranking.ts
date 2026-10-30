export type ProductEngagement = { views: number; clicks: number; carts: number };

type RankableProduct = {
  slug: string;
  stock: number;
  createdAt?: string;
  engagement?: ProductEngagement;
  catalogSource?: string;
};

export type ProductSort = "recommended" | "popular" | "newest";

const SOURCE_ORDER = ["original", "zoneofdeals", "universaltraders", "vintagemobilearena"];

export function catalogSourceKey(source?: string) {
  const value = source?.toLocaleLowerCase().replace(/[^a-z]/g, "") || "original";
  if (value.includes("zone")) return "zoneofdeals";
  if (value.includes("universal")) return "universaltraders";
  if (value.includes("vintage")) return "vintagemobilearena";
  return value === "original" ? "original" : "other";
}

export function catalogSourceLabel(source?: string) {
  const key = catalogSourceKey(source);
  return (
    (
      {
        original: "Original collection",
        zoneofdeals: "Zone of Deals",
        universaltraders: "Universal Traders",
        vintagemobilearena: "Vintage Mobile Arena",
      } as Record<string, string>
    )[key] || "Other supplier"
  );
}

function hash(value: string) {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return ((result >>> 0) + 1) / 4294967297;
}

// Log scaling and a smoothed cart rate keep a few clicks from overwhelming the list.
export function popularityScore(product: RankableProduct) {
  const { views = 0, clicks = 0, carts = 0 } = product.engagement || {};
  return (
    Math.log1p(Math.max(0, views)) * 0.5 +
    Math.log1p(Math.max(0, clicks)) +
    Math.log1p(Math.max(0, carts)) * 3 +
    (Math.min(carts, views) + 1) / (Math.max(views, carts) + 20)
  );
}

export function rankProducts<T extends RankableProduct>(
  products: T[],
  sort: ProductSort = "recommended",
  seed = "storefront",
  now = Date.now(),
): T[] {
  const created = (product: T) => Date.parse(product.createdAt || "") || 0;
  const scores = new Map(
    products.map((product) => {
      const ageDays = Math.max(0, (now - created(product)) / 86400000);
      // Recommendations keep engagement as a gentle signal while discovery,
      // recency, and daily seed variation prevent a clone of the Popular list.
      const weight =
        1 +
        (sort === "recommended" ? popularityScore(product) * 0.22 : popularityScore(product)) +
        (sort === "recommended" ? 0.9 : 0.5) * Math.exp(-ageDays / 14);
      // Weighted random sampling: stronger signals improve the odds, every item can appear.
      return [product.slug, -Math.log(hash(`${seed}:${sort}:${product.slug}`)) / weight];
    }),
  );
  return [...products].sort((a, b) => {
    const sourceDifference =
      (SOURCE_ORDER.indexOf(catalogSourceKey(a.catalogSource)) < 0
        ? SOURCE_ORDER.length
        : SOURCE_ORDER.indexOf(catalogSourceKey(a.catalogSource))) -
      (SOURCE_ORDER.indexOf(catalogSourceKey(b.catalogSource)) < 0
        ? SOURCE_ORDER.length
        : SOURCE_ORDER.indexOf(catalogSourceKey(b.catalogSource)));
    if (sourceDifference) return sourceDifference;
    if (sort === "newest") return created(b) - created(a) || a.slug.localeCompare(b.slug);
    const stockOrder = Number(b.stock > 0) - Number(a.stock > 0);
    if (stockOrder) return stockOrder;
    if (sort === "popular") {
      const popularity = popularityScore(b) - popularityScore(a);
      if (popularity) return popularity;
    }
    return scores.get(a.slug)! - scores.get(b.slug)! || a.slug.localeCompare(b.slug);
  });
}
