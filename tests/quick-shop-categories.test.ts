import { test } from "node:test";
import assert from "node:assert/strict";
import { isSmartphone, matchesQuickShopCategory } from "../src/lib/quick-shop-categories.ts";

const product = (overrides: Record<string, unknown> = {}) => ({
  name: "Phone",
  brand: "Nokia",
  category: "phones" as const,
  formFactor: "Keypad",
  specs: [],
  isVintageCollection: false,
  ...overrides,
});

test("quick categories match BlackBerry, Samsung and curated vintage products", () => {
  assert.equal(matchesQuickShopCategory(product({ brand: "BlackBerry" }), "blackberry"), true);
  assert.equal(matchesQuickShopCategory(product({ brand: "Samsung" }), "samsung"), true);
  assert.equal(
    matchesQuickShopCategory(product({ isVintageCollection: true }), "vintage_collection"),
    true,
  );
});

test("smartphone category uses smartphone operating systems and excludes keypad mini phones", () => {
  assert.equal(isSmartphone(product({ specs: [{ label: "OS", value: "Android 15" }] })), true);
  assert.equal(isSmartphone(product({ brand: "Apple", name: "iPhone 14" })), false);
  assert.equal(
    isSmartphone(
      product({
        brand: "Apple",
        name: "iPhone 14",
        formFactor: "Touchscreen",
      }),
    ),
    true,
  );
  assert.equal(
    isSmartphone(product({ brand: "L8Star", name: "BM70", formFactor: "Touchscreen" })),
    false,
  );
});
