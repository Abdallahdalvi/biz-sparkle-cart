export type QuickShopCategory =
  | "blackberry"
  | "samsung"
  | "nokia"
  | "motorola"
  | "vintage_collection"
  | "smartphones"
  | "qwerty"
  | "t9"
  | "flip"
  | "slider";

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
    /android|ios|windows phone|windows mobile|windows 8|blackberry(?:\s+os)?\s*10|harmonyos/i.test(
      operatingSystem,
    )
  ) {
    return true;
  }

  const formFactor = product.formFactor?.toLocaleLowerCase() || "";
  if (/symbian/i.test(operatingSystem)) return formFactor.includes("touchscreen");

  return (
    (formFactor === "touchscreen" || formFactor === "compact iphone") &&
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
  if (category === "nokia") return /nokia/i.test(`${product.brand} ${product.name}`);
  if (category === "motorola") return /motorola/i.test(`${product.brand} ${product.name}`);
  if (category === "vintage_collection") return product.isVintageCollection === true;
  if (category === "smartphones") return isSmartphone(product);

  const details = [
    product.name,
    product.brand,
    product.formFactor,
    ...product.specs.flatMap((spec) => [spec.label, spec.value]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  const formFactor = product.formFactor?.toLocaleLowerCase() || "";
  const operatingSystem = product.specs
    .filter((spec) => /^(os|operating system|software)$/i.test(spec.label))
    .map((spec) => spec.value)
    .join(" ");

  if (category === "qwerty") return /qwerty/.test(details);
  if (category === "flip") return /flip/i.test(`${formFactor} ${product.name}`);
  if (category === "slider") return /slider/i.test(`${formFactor} ${product.name}`);
  if (category === "t9") {
    const keypadFlipOrSlider =
      (/flip/i.test(`${formFactor} ${product.name}`) &&
        !/android/i.test(`${formFactor} ${operatingSystem}`)) ||
      (/slider/i.test(`${formFactor} ${product.name}`) &&
        !/qwerty/i.test(formFactor) &&
        !/android/i.test(`${formFactor} ${operatingSystem}`));
    return (
      /\bt9\b/.test(details) ||
      ((formFactor.includes("keypad") || formFactor === "keypad") &&
        !formFactor.includes("qwerty")) ||
      keypadFlipOrSlider
    );
  }
  return false;
}
