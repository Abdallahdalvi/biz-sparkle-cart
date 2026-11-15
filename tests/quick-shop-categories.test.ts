import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSmartphone,
  matchesQuickShopCategory,
  validPhoneType,
} from "../src/lib/quick-shop-categories.ts";

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
  assert.equal(matchesQuickShopCategory(flip, "t9"), false);
  const nokiaFlip = product({ brand: "Nokia", name: "Nokia 2660 Flip" });
  assert.equal(matchesQuickShopCategory(nokiaFlip, "nokia"), true);
  assert.equal(matchesQuickShopCategory(nokiaFlip, "flip"), true);
  assert.equal(matchesQuickShopCategory(nokiaFlip, "t9"), false);
  const qwertyAndroid = product({
    brand: "BlackBerry",
    name: "BlackBerry KEYone",
    formFactor: "QWERTY Android",
    specs: [{ label: "OS", value: "Android 8" }],
  });
  assert.equal(isSmartphone(qwertyAndroid), true);
  assert.equal(matchesQuickShopCategory(qwertyAndroid, "qwerty"), true);
  assert.equal(matchesQuickShopCategory(qwertyAndroid, "smartphones"), false);
});

test("mini phones have their own filter even when they run Android", () => {
  const mini = product({
    name: "Mini Android Phone 3-inch 16GB",
    formFactor: "Mini Android",
    specs: [{ label: "OS", value: "Android 10" }],
  });
  assert.equal(matchesQuickShopCategory(mini, "mini"), true);
  assert.equal(matchesQuickShopCategory(mini, "smartphones"), false);
  assert.equal(
    matchesQuickShopCategory(product({ name: "BM70", formFactor: "Touchscreen" }), "mini"),
    true,
  );
  const n97 = product({ name: "Nokia N97 MINI", formFactor: "Keypad" });
  assert.equal(matchesQuickShopCategory(n97, "mini"), false);
  assert.equal(matchesQuickShopCategory(n97, "qwerty"), true);
  assert.equal(matchesQuickShopCategory(n97, "slider"), true);
});

test("storefront type filters correct misleading legacy import metadata", () => {
  for (const name of ["Nokia 5300", "Nokia 8110 4G", "Nokia 8600 Luna"]) {
    assert.equal(matchesQuickShopCategory(product({ name }), "slider"), true, name);
    assert.equal(matchesQuickShopCategory(product({ name }), "t9"), false, name);
  }
  for (const name of ["Nokia 5233", "Nokia 808 PureView"]) {
    assert.equal(matchesQuickShopCategory(product({ name }), "smartphones"), true, name);
    assert.equal(matchesQuickShopCategory(product({ name }), "t9"), false, name);
  }
  for (const name of [
    "Motorola L2000",
    "VERTU LOOK METAL DUAL SIM PHONE",
    "Ringme Circle Round-Screen Phone",
  ]) {
    const keypad = product({ name, formFactor: "Touchscreen" });
    assert.equal(matchesQuickShopCategory(keypad, "smartphones"), false, name);
    assert.equal(matchesQuickShopCategory(keypad, "t9"), true, name);
  }
  assert.equal(
    matchesQuickShopCategory(
      product({ brand: "Ziox", name: "Ziox Astra NXT 4G", formFactor: "Touchscreen" }),
      "smartphones",
    ),
    true,
  );
  assert.equal(matchesQuickShopCategory(product({ category: "audio" }), "t9"), false);
});

test("phone-type links accept only supported categories", () => {
  assert.equal(validPhoneType("mini"), "mini");
  assert.equal(validPhoneType("vintage_collection"), "all");
  assert.equal(validPhoneType(undefined), "all");
  assert.equal(validPhoneType(["flip"]), "all");
});

test("Android keypad devices stay in Keypad even without form-factor metadata", () => {
  const qin = product({
    name: "Qin F25 Pro",
    brand: "Qin",
    formFactor: undefined,
    specs: [{ label: "OS", value: "Android 14" }],
  });
  assert.equal(matchesQuickShopCategory(qin, "smartphones"), false);
  assert.equal(matchesQuickShopCategory(qin, "t9"), true);
});
