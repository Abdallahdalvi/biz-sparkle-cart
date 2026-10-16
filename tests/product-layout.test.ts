import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/routes/product.$slug.tsx", import.meta.url), "utf8");
test("product information cards follow the purchase controls", () => {
  const controls = source.indexOf("Ready to order?");
  const viewCart = source.indexOf("View Cart", controls);
  assert.ok(controls > source.indexOf(">Variant</p>"));
  for (const label of [
    "One-month battery & charger warranty",
    "Delivery & courier confirmation",
    "Shop with confidence",
  ]) {
    assert.ok(source.indexOf(label) > viewCart, `${label} should follow Add to Cart / View Cart`);
  }
});
test("mobile purchase bar stays available and colour stock guards remain", () => {
  assert.match(source, /Mobile CTA remains below the product imagery/);
  assert.match(source, /disabled=\{availableStock === 0\}/);
  assert.match(source, /currentQty < availableStock/);
});
