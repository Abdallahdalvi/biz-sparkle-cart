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
  | "slider"
  | "mini";

export const PHONE_TYPE_OPTIONS = [
  { key: "qwerty", label: "QWERTY Phones", icon: "keyboard" },
  { key: "flip", label: "Flip Phones", icon: "flip" },
  { key: "slider", label: "Slider Phones", icon: "swap_vert" },
  { key: "mini", label: "Mini Phones", icon: "phone_android" },
  { key: "t9", label: "Keypad Phones", icon: "dialpad" },
  { key: "smartphones", label: "Smartphones", icon: "smartphone" },
] as const;
export type PhoneType = (typeof PHONE_TYPE_OPTIONS)[number]["key"];
export function validPhoneType(value: unknown): PhoneType | "all" {
  return PHONE_TYPE_OPTIONS.find((option) => option.key === value)?.key || "all";
}

export type QuickShopProduct = {
  name: string;
  brand: string;
  category: string;
  formFactor?: string;
  specs: { label: string; value: string }[];
  isVintageCollection?: boolean;
};

function isQwertyPhone(product: QuickShopProduct) {
  return (
    /qwerty/i.test(`${product.formFactor || ""} ${product.name}`) ||
    /\bblackberry\s+(?:classic|curve|bold|passport|q10|keyone|priv|torch|8520|9720)\b|\bnokia\s+(?:n97|9300)\b|\b7705\s+twist\b/i.test(
      product.name,
    )
  );
}

function isFlipPhone(product: QuickShopProduct) {
  return (
    /\bflip\b/i.test(`${product.formFactor || ""} ${product.name}`) ||
    /\bmotorola\s+v(?:3i?|8)\b|\bnokia\s+(?:6131|n93i)\b|\bsamsung\s+(?:e1190|s3600i)\b/i.test(
      product.name,
    )
  );
}

function isSliderPhone(product: QuickShopProduct) {
  return (
    /\bslid(?:e|er)\b/i.test(`${product.formFactor || ""} ${product.name}`) ||
    /\bnokia\s+(?:n95|n97|5300|2220|8110|8600|e66)\b|\bblackberry\s+(?:priv|torch)\b/i.test(
      product.name,
    )
  );
}

export function isMiniPhone(product: QuickShopProduct) {
  if (product.category !== "phones") return false;
  // A model suffix such as N97 MINI or iPhone mini is not a miniature novelty phone.
  if (/\bnokia\s+n97\b|\biphone\b.*\bmini\b/i.test(product.name)) return false;
  return (
    /\bmini\b/i.test(`${product.formFactor || ""} ${product.name}`) ||
    /\bbm(?:30|70)\b/i.test(product.name)
  );
}

export function isStorefrontSmartphone(product: QuickShopProduct) {
  if (
    product.category !== "phones" ||
    isMiniPhone(product) ||
    isQwertyPhone(product) ||
    isFlipPhone(product) ||
    isSliderPhone(product)
  )
    return false;
  // Some imported legacy models have generic or incorrect form-factor metadata.
  if (/\bnokia\s+(?:5233|808)\b/i.test(product.name)) return true;
  if (
    /\bmotorola\s+l2000\b|\bqin\s+f\d+\b|\b(?:keypad|t9)\b|\bvertu look\b|\bv10 gold dragon\b|\bround.screen\b|\beasyphone star\b|\bmusic 2\b/i.test(
      `${product.formFactor || ""} ${product.name}`,
    )
  )
    return false;
  return (
    isSmartphone(product) ||
    /^(?:touchscreen|compact android|compact iphone)$/i.test(product.formFactor || "")
  );
}

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
  if (category === "smartphones") return isStorefrontSmartphone(product);
  if (category === "mini") return isMiniPhone(product);
  if (product.category !== "phones") return false;
  if (category === "qwerty") return isQwertyPhone(product);
  if (category === "flip") return isFlipPhone(product);
  if (category === "slider") return isSliderPhone(product);
  if (category === "t9") {
    return (
      !isMiniPhone(product) &&
      !isQwertyPhone(product) &&
      !isFlipPhone(product) &&
      !isSliderPhone(product) &&
      !isStorefrontSmartphone(product)
    );
  }
  return false;
}
