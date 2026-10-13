export type ProductCondition = "new" | "used" | "refurbished";

export const CONDITION_GRADES = ["A+", "A", "B+", "B", "C+", "C", "D"] as const;

export function productCondition(value: unknown): ProductCondition {
  return value === "used" || value === "refurbished" ? value : "new";
}

export function schemaItemCondition(value: unknown) {
  const condition = productCondition(value);
  return `https://schema.org/${condition === "used" ? "Used" : condition === "refurbished" ? "Refurbished" : "New"}Condition`;
}
