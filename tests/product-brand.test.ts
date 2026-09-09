import assert from "node:assert/strict";
import test from "node:test";
import { inferProductBrand } from "../src/lib/product-brand.ts";

test("catalog brands are inferred from existing product names", () => {
  assert.equal(inferProductBrand("Apple iPhone SE 3 (2022)"), "Apple");
  assert.equal(inferProductBrand("iPhone SE 3"), "Apple");
  assert.equal(inferProductBrand("BlackBerry Passport"), "BlackBerry");
  assert.equal(inferProductBrand("Nokia 6700s Slider"), "Nokia");
  assert.equal(inferProductBrand("CAT S22 Flip"), "CAT");
  assert.equal(inferProductBrand("Duoqin F22 Pro"), "Qin");
  assert.equal(inferProductBrand("Qin F25 Pro"), "Qin");
  assert.equal(inferProductBrand("V77 Flip"), "V77");
});

test("unknown brands use the store's own Aghanims brand", () => {
  assert.equal(inferProductBrand("Custom keypad phone"), "Aghanims");
});
