import { isSmartphone } from "./quick-shop-categories.ts";
import { inferProductBrand } from "./product-brand.ts";

export function codAdvanceTier(product: {
  name: string;
  category: string;
  metadata?: {
    brand?: string;
    form_factor?: string;
    specs?: { label: string; value: string }[];
    supplier_import?: { source_url?: string };
  };
}) {
  if (product.category !== "phones") return null;
  const metadata = product.metadata || {};
  const brand = metadata.brand || inferProductBrand(product.name);
  // Lookalike keypad phones are not Apple iPhones or BlackBerry devices.
  if (/^apple$/i.test(brand) && /\biphone\b/i.test(product.name)) return 49900;
  const featurePhone = /^(?:Jio Phone 2\b|Nokia 105\b|Motorola L2000\b)/i.test(product.name);
  if (
    /^blackberry$/i.test(brand) ||
    (!featurePhone &&
      isSmartphone({
        name: product.name,
        brand,
        category: "phones",
        formFactor: metadata.form_factor,
        specs: Array.isArray(metadata.specs) ? metadata.specs : [],
      }))
  )
    return 19900;
  if (metadata.supplier_import?.source_url) return 9900;
  return 4900;
}
