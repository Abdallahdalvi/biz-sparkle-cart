export type ProductCondition = "sealed" | "new" | "like_new" | "used" | "refurbished";

export const PRODUCT_CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: "sealed", label: "Brand new/sealed" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
];

export const CONDITION_GRADES = ["A+", "A", "B+", "B", "C+", "C", "D"] as const;

export function productCondition(value: unknown): ProductCondition {
  return PRODUCT_CONDITIONS.find((condition) => condition.value === value)?.value || "new";
}

export function productConditionLabel(value: unknown) {
  return PRODUCT_CONDITIONS.find((condition) => condition.value === productCondition(value))!.label;
}

export function merchantProductCondition(value: unknown): "new" | "used" | "refurbished" {
  const condition = productCondition(value);
  if (condition === "sealed" || condition === "new") return "new";
  return condition === "refurbished" ? "refurbished" : "used";
}

export function schemaItemCondition(value: unknown) {
  const condition = merchantProductCondition(value);
  return `https://schema.org/${condition === "used" ? "Used" : condition === "refurbished" ? "Refurbished" : "New"}Condition`;
}
