export type ProductEngagement = { views: number; clicks: number; carts: number };

type RankableProduct = {
  slug: string;
  stock: number;
  createdAt?: string;
  engagement?: ProductEngagement;
};

export type ProductSort = "recommended" | "popular" | "newest";

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
      const weight = 1 + popularityScore(product) + 0.5 * Math.exp(-ageDays / 14);
      // Weighted random sampling: stronger signals improve the odds, every item can appear.
      return [product.slug, -Math.log(hash(`${seed}:${product.slug}`)) / weight];
    }),
  );
  return [...products].sort((a, b) => {
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
