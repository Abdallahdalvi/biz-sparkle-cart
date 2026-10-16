import { test } from "node:test";
import assert from "node:assert/strict";
import { storedCartItems } from "../src/lib/cart-storage.ts";
test("restores the same item envelope written by the cart store", () => {
  const items = [{ slug: "nokia-e52", qty: 1 }];
  assert.deepEqual(storedCartItems(JSON.parse(JSON.stringify({ items }))), items);
  assert.deepEqual(storedCartItems(items), items);
});
test("malformed saved carts are empty", () => {
  for (const value of [null, {}, "bad", { items: "bad" }])
    assert.deepEqual(storedCartItems(value), []);
});
