import { useEffect } from "react";
import { create } from "zustand";

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
  ownerKey: string;
  items: CartItem[];
  setOwner: (userId?: string | null) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string, variantId?: string) => void;
  setQty: (slug: string, qty: number, variantId?: string) => void;
  clear: () => void;
  totalPaise: () => number;
  totalItems: () => number;
}

const CART_STORAGE_PREFIX = "aghanims-cart-v2";
const LEGACY_CART_STORAGE_NAME = "Aghanims Phones and Gadgets-cart";
const GUEST_OWNER = "guest";

const key = (slug: string, variantId?: string) => `${slug.trim()}###${(variantId ?? "").trim()}`;

function ownerKey(userId?: string | null) {
  return userId ? `user:${userId}` : GUEST_OWNER;
}

function storageKey(keyOwner: string) {
  return `${CART_STORAGE_PREFIX}:${keyOwner}`;
}

function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const items: Array<CartItem | null> = value.map((item) => {
    if (!item || typeof item !== "object") return null;
    const record = item as Partial<CartItem>;
    const qty = Math.max(1, Math.min(10, Number(record.qty) || 1));
    if (!record.slug || !record.name || !Number.isFinite(Number(record.pricePaise))) return null;
    return {
      slug: String(record.slug),
      name: String(record.name),
      pricePaise: Number(record.pricePaise),
      image: String(record.image || ""),
      variantId: record.variantId ? String(record.variantId) : undefined,
      variantLabel: record.variantLabel ? String(record.variantLabel) : undefined,
      qty,
    };
  });
  return items.filter((item): item is CartItem => Boolean(item));
}

function readCart(keyOwner: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(storageKey(keyOwner));
    if (stored) return sanitizeItems(JSON.parse(stored));

    if (keyOwner === GUEST_OWNER) {
      const legacy = window.localStorage.getItem(LEGACY_CART_STORAGE_NAME);
      if (legacy) {
        const parsed = JSON.parse(legacy) as { state?: { items?: unknown } };
        const migrated = sanitizeItems(parsed?.state?.items);
        writeCart(GUEST_OWNER, migrated);
        window.localStorage.removeItem(LEGACY_CART_STORAGE_NAME);
        return migrated;
      }
    }
  } catch {
    return [];
  }
  return [];
}

function writeCart(keyOwner: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(keyOwner), JSON.stringify({ items }));
  } catch {
    // Cart persistence is a convenience; ordering still uses server-side pricing and stock checks.
  }
}

function updateItems(
  set: (partial: Partial<CartState> | ((state: CartState) => Partial<CartState>)) => void,
  updater: (state: CartState) => CartItem[],
) {
  set((state) => {
    const items = updater(state);
    writeCart(state.ownerKey, items);
    return { items };
  });
}

export const useCart = create<CartState>()((set, get) => ({
  ownerKey: GUEST_OWNER,
  items: readCart(GUEST_OWNER),
  setOwner: (userId) =>
    set((state) => {
      const nextOwner = ownerKey(userId);
      if (nextOwner === state.ownerKey) return {};
      writeCart(state.ownerKey, state.items);
      return { ownerKey: nextOwner, items: readCart(nextOwner) };
    }),
  add: (item, qty = 1) =>
    updateItems(set, (state) => {
      const itemKey = key(item.slug, item.variantId);
      const existing = state.items.find(
        (cartItem) => key(cartItem.slug, cartItem.variantId) === itemKey,
      );
      if (existing) {
        return state.items.map((cartItem) =>
          key(cartItem.slug, cartItem.variantId) === itemKey
            ? { ...cartItem, qty: Math.min(10, cartItem.qty + qty) }
            : cartItem,
        );
      }
      return [...state.items, { ...item, qty: Math.max(1, Math.min(10, qty)) }];
    }),
  remove: (slug, variantId) =>
    updateItems(set, (state) =>
      state.items.filter((item) => key(item.slug, item.variantId) !== key(slug, variantId)),
    ),
  setQty: (slug, qty, variantId) =>
    updateItems(set, (state) =>
      state.items
        .map((item) =>
          key(item.slug, item.variantId) === key(slug, variantId)
            ? { ...item, qty: Math.min(10, qty) }
            : item,
        )
        .filter((item) => item.qty > 0),
    ),
  clear: () => updateItems(set, () => []),
  totalPaise: () => get().items.reduce((sum, item) => sum + item.pricePaise * item.qty, 0),
  totalItems: () => get().items.reduce((sum, item) => sum + item.qty, 0),
}));

export function useCartOwnerSync(userId?: string | null, loading = false) {
  const setOwner = useCart((state) => state.setOwner);
  useEffect(() => {
    if (!loading) setOwner(userId);
  }, [loading, setOwner, userId]);
}
