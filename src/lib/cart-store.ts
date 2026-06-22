import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  slug: string;
  name: string;
  pricePaise: number;
  image: string;
  variantId?: string;
  variantLabel?: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string, variantId?: string) => void;
  setQty: (slug: string, qty: number, variantId?: string) => void;
  clear: () => void;
  totalPaise: () => number;
  totalItems: () => number;
}

const key = (slug: string, variantId?: string) => `${slug}::${variantId ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const k = key(item.slug, item.variantId);
          const existing = s.items.find((i) => key(i.slug, i.variantId) === k);
          if (existing) {
            return {
              items: s.items.map((i) =>
                key(i.slug, i.variantId) === k ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty }] };
        }),
      remove: (slug, variantId) =>
        set((s) => ({
          items: s.items.filter((i) => key(i.slug, i.variantId) !== key(slug, variantId)),
        })),
      setQty: (slug, qty, variantId) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              key(i.slug, i.variantId) === key(slug, variantId) ? { ...i, qty } : i,
            )
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      totalPaise: () => get().items.reduce((s, i) => s + i.pricePaise * i.qty, 0),
      totalItems: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: "techlab-cart" },
  ),
);