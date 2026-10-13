import assert from "node:assert/strict";
import test from "node:test";
import {
  productCondition,
  merchantProductCondition,
  productConditionLabel,
  schemaItemCondition,
} from "../src/lib/product-condition.ts";

test("used Grade A and Grade B inventory is never described as new to Google", () => {
  for (const metadata of [
    { condition: "used", condition_grade: "A" },
    { condition: "used", condition_grade: "B" },
  ]) {
    assert.equal(productCondition(metadata.condition), "used");
    assert.equal(schemaItemCondition(metadata.condition), "https://schema.org/UsedCondition");
  }
});

test("store condition labels map to Google's accepted conditions", () => {
  const cases = [
    ["sealed", "Brand new/sealed", "new", "NewCondition"],
    ["new", "New", "new", "NewCondition"],
    ["like_new", "Like new", "used", "UsedCondition"],
    ["used", "Used", "used", "UsedCondition"],
    ["refurbished", "Refurbished", "refurbished", "RefurbishedCondition"],
  ];
  for (const [value, label, feed, schema] of cases) {
    assert.equal(productCondition(value), value);
    assert.equal(productConditionLabel(value), label);
    assert.equal(merchantProductCondition(value), feed);
    assert.equal(schemaItemCondition(value), `https://schema.org/${schema}`);
  }
});

test("new existing inventory and refurbished inventory retain their own condition", () => {
  assert.equal(productCondition(undefined), "new");
  assert.equal(schemaItemCondition(undefined), "https://schema.org/NewCondition");
  assert.equal(productCondition("refurbished"), "refurbished");
  assert.equal(schemaItemCondition("refurbished"), "https://schema.org/RefurbishedCondition");
});
