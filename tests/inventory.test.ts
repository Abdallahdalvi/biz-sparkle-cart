import { test } from "node:test";
import assert from "node:assert/strict";
import { inventoryTotal, resolveVariantId, selectedStock } from "../src/lib/inventory.ts";
const variants = [
  { id: "black", label: "Black", stock: 10 },
  { id: "white", label: "White", stock: 1 },
];

test("default selection skips sold-out variants and replaces stale product variant IDs", () => {
  const colours = [{ id: "sold", label: "Red", stock: 0 }, ...variants];
  assert.equal(resolveVariantId(colours), "black");
  assert.equal(resolveVariantId(colours, "previous-phone-id"), "black");
  assert.equal(
    selectedStock({ stock: 11, variants: colours }, resolveVariantId(colours, "previous-phone-id")),
    10,
  );
  assert.equal(resolveVariantId(colours, "white"), "white");
  assert.equal(resolveVariantId(colours, "sold"), "sold");
  assert.equal(resolveVariantId([colours[0]]), "sold");
  assert.equal(resolveVariantId(undefined, "previous-phone-id"), undefined);
});
test("colour totals use 10 black plus 1 white, not the total for each colour", () => {
  assert.equal(inventoryTotal(variants, 999), 11);
  assert.equal(selectedStock({ stock: 11, variants }, "white"), 1);
  assert.equal(selectedStock({ stock: 11, variants }, "black"), 10);
});
test("zero white stock cannot borrow available black stock", () => {
  const colours = [variants[0], { ...variants[1], stock: 0 }];
  assert.equal(inventoryTotal(colours, 11), 10);
  assert.equal(selectedStock({ stock: 10, variants: colours }, "white"), 0);
  assert.equal(selectedStock({ stock: 10, variants: colours }), 0);
  assert.equal(selectedStock({ stock: 10, variants: colours }, "unknown"), 0);
});
test("standalone products keep independent product stock", () => {
  assert.equal(inventoryTotal([], 3), 3);
  assert.equal(selectedStock({ stock: 3 }), 3);
});
test("selected quantity is capped by product stock and independent of colour order", () => {
  assert.equal(selectedStock({ stock: 2, variants: [...variants].reverse() }, "black"), 2);
  assert.equal(selectedStock({ stock: 2, variants: [...variants].reverse() }, "white"), 1);
});
test("invalid quantities and duplicate colours are rejected", () => {
  for (const stock of [-1, 1.5, undefined, NaN]) {
    assert.throws(() => inventoryTotal([{ id: "x", label: "White", stock }], 1));
  }
  assert.throws(() => inventoryTotal([...variants, { id: "other", label: "black", stock: 1 }], 11));
});
