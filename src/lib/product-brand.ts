const KNOWN_PRODUCT_BRANDS: Array<[RegExp, string]> = [
  [/^(?:apple\s+)?iphone\b/, "Apple"],
  [/^blackberry\b/, "BlackBerry"],
  [/^nokia\b/, "Nokia"],
  [/^cat\b/, "CAT"],
  [/^duoqin\b/, "Qin"],
  [/^qin\b/, "Qin"],
  [/^jio\b/, "Jio"],
  [/^samsung\b/, "Samsung"],
  [/^motorola\b/, "Motorola"],
  [/^vertu\b/, "Vertu"],
  [/^v77\b/, "V77"],
];

export function inferProductBrand(productName: string) {
  const normalized = productName.trim().toLowerCase();
  return KNOWN_PRODUCT_BRANDS.find(([pattern]) => pattern.test(normalized))?.[1] || "Aghanims";
}
