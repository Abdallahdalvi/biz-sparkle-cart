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

test("quick categories match brands and curated vintage products", () => {
  assert.equal(matchesQuickShopCategory(product({ brand: "BlackBerry" }), "blackberry"), true);
  assert.equal(matchesQuickShopCategory(product({ brand: "Samsung" }), "samsung"), true);
  assert.equal(matchesQuickShopCategory(product({ brand: "Nokia" }), "nokia"), true);
  assert.equal(matchesQuickShopCategory(product({ brand: "Motorola" }), "motorola"), true);
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
  const oldQwerty = product({
    brand: "Nokia",
    name: "Nokia E71",
    formFactor: "QWERTY",
    specs: [{ label: "OS", value: "Symbian OS 9.2" }],
  });
  assert.equal(isSmartphone(oldQwerty), false);
  assert.equal(matchesQuickShopCategory(oldQwerty, "qwerty"), true);
  const t9 = product({
    brand: "Nokia",
    name: "Nokia E52",
    formFactor: "Classic Keypad",
    specs: [{ label: "OS", value: "Symbian OS 9.3" }],
  });
  assert.equal(isSmartphone(t9), false);
  assert.equal(matchesQuickShopCategory(t9, "t9"), true);
  const slider = product({ brand: "Nokia", name: "Nokia E66", formFactor: "Slider" });
  assert.equal(matchesQuickShopCategory(slider, "slider"), true);
  const flip = product({ brand: "Motorola", name: "Motorola V3", formFactor: "Flip" });
  assert.equal(matchesQuickShopCategory(flip, "flip"), true);
  assert.equal(matchesQuickShopCategory(flip, "t9"), true);
  const nokiaFlip = product({ brand: "Nokia", name: "Nokia 2660 Flip" });
  assert.equal(matchesQuickShopCategory(nokiaFlip, "nokia"), true);
  assert.equal(matchesQuickShopCategory(nokiaFlip, "flip"), true);
  assert.equal(matchesQuickShopCategory(nokiaFlip, "t9"), true);
  const qwertyAndroid = product({
    brand: "BlackBerry",
    name: "BlackBerry KEYone",
    formFactor: "QWERTY Android",
    specs: [{ label: "OS", value: "Android 8" }],
  });
  assert.equal(isSmartphone(qwertyAndroid), true);
  assert.equal(matchesQuickShopCategory(qwertyAndroid, "qwerty"), true);
});
