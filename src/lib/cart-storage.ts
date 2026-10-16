// Accept both the current { items } envelope and older bare-array carts.
export function storedCartItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "items" in value && Array.isArray(value.items))
    return value.items;
  return [];
}
