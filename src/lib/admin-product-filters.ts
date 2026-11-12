import { inferProductBrand } from "./product-brand.ts";

export type AdminProductFilters = {
  search: string;
  brand: string;
  category: string;
  status: "all" | "active" | "hidden" | "draft";
  availability: "all" | "in_stock" | "out_of_stock";
  sort: "store_order" | "price_asc" | "price_desc" | "name" | "stock_asc";
};

export const DEFAULT_ADMIN_PRODUCT_FILTERS: AdminProductFilters = {
  search: "",
  brand: "all",
  category: "all",
  status: "all",
  availability: "all",
  sort: "store_order",
};

type FilterableProduct = {
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  category_id: string | null;
  price_paise: number;
  stock: number;
  is_active: boolean;
  metadata?: {
    brand?: unknown;
    badge?: string;
    specs?: { label: string; value: string }[];
    variants?: { label: string }[];
  };
};

export function adminProductBrand(product: FilterableProduct) {
  const brand = product.metadata?.brand;
  return typeof brand === "string" && brand.trim() ? brand.trim() : inferProductBrand(product.name);
}

export function hasAdminProductFilters(filters: AdminProductFilters) {
  return Object.entries(DEFAULT_ADMIN_PRODUCT_FILTERS).some(
    ([key, value]) => filters[key as keyof AdminProductFilters] !== value,
  );
}

export function filterAdminProducts<T extends FilterableProduct>(
  products: T[],
  filters: AdminProductFilters,
): T[] {
  const terms = filters.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const result = products.filter((product) => {
    if (filters.brand !== "all" && adminProductBrand(product) !== filters.brand) return false;
    if (filters.category !== "all" && product.category_id !== filters.category) return false;
    if (filters.status === "active" && !product.is_active) return false;
    if (filters.status === "hidden" && (product.is_active || product.price_paise === 0))
      return false;
    if (filters.status === "draft" && (product.is_active || product.price_paise !== 0))
      return false;
    if (filters.availability === "in_stock" && product.stock <= 0) return false;
    if (filters.availability === "out_of_stock" && product.stock > 0) return false;
    const text = [
      product.name,
      product.slug,
      product.tagline,
      product.description,
      adminProductBrand(product),
      product.metadata?.badge,
      ...(product.metadata?.specs || []).flatMap((spec) => [spec.label, spec.value]),
      ...(product.metadata?.variants || []).map((variant) => variant.label),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
  if (filters.sort === "price_asc") result.sort((a, b) => a.price_paise - b.price_paise);
  if (filters.sort === "price_desc") result.sort((a, b) => b.price_paise - a.price_paise);
  if (filters.sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
  if (filters.sort === "stock_asc") result.sort((a, b) => a.stock - b.stock);
  return result;
}
