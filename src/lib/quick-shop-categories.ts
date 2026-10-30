export type QuickShopCategory = "blackberry" | "samsung" | "vintage_collection" | "smartphones";

type QuickShopProduct = {
  name: string;
  brand: string;
  category: string;
  formFactor?: string;
  specs: { label: string; value: string }[];
  isVintageCollection?: boolean;
};

export function isSmartphone(product: QuickShopProduct) {
  if (product.category !== "phones") return false;
  const operatingSystem = product.specs
    .filter((spec) => /^(os|operating system|software)$/i.test(spec.label))
    .map((spec) => spec.value)
    .join(" ");

  if (
    /android|ios|windows phone|windows mobile|blackberry|symbian|harmonyos|kaios|tizen/i.test(
      operatingSystem,
    )
  ) {
    return true;
  }

  return (
    product.formFactor?.toLocaleLowerCase() === "touchscreen" &&
    /apple|samsung|google|oneplus|xiaomi|redmi|poco|realme|oppo|vivo|motorola|huawei|honor|sony|nokia/i.test(
      `${product.brand} ${product.name}`,
    )
  );
}

export function matchesQuickShopCategory(product: QuickShopProduct, category: QuickShopCategory) {
  if (category === "blackberry") {
    return /blackberry/i.test(`${product.brand} ${product.name}`);
  }
  if (category === "samsung") {
    return /samsung/i.test(`${product.brand} ${product.name}`);
  }
  if (category === "vintage_collection") return product.isVintageCollection === true;
  return isSmartphone(product);
}
