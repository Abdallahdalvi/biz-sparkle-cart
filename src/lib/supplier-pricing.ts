// Apply the markup first, then round up to the next ₹499 or ₹999 price.
export function supplierRetailPrice(supplierPaise: number, markupPercent: number) {
  if (!Number.isSafeInteger(supplierPaise) || supplierPaise <= 0) return 0;
  return (
    Math.ceil((Math.ceil((supplierPaise * (100 + markupPercent)) / 100) + 100) / 50_000) * 50_000 -
    100
  );
}
