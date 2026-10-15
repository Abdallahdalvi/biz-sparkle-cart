export type StockVariant = { id: string; label: string; stock?: number };

export function inventoryTotal(variants: StockVariant[], stock: number) {
  const active = variants.filter((variant) => variant.label.trim());
  if (new Set(active.map((variant) => variant.label.trim().toLowerCase())).size !== active.length) {
    throw new Error("Each colour must have a different name.");
  }
  const quantities = active.length ? active.map((variant) => variant.stock) : [stock];
  if (quantities.some((quantity) => !Number.isSafeInteger(quantity) || Number(quantity) < 0)) {
    throw new Error("Enter a whole-number stock quantity of 0 or more for every colour.");
  }
  return quantities.reduce<number>((total, quantity) => total + Number(quantity), 0);
}

export function selectedStock(
  product: { stock: number; variants?: StockVariant[] },
  variantId?: string,
) {
  if (!product.variants?.length) return product.stock;
  const variant = product.variants.find((entry) => entry.id === variantId);
  return Math.max(0, Math.min(product.stock, variant?.stock ?? 0));
}
