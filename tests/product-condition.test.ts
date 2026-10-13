import assert from "node:assert/strict";
import test from "node:test";
import { productCondition, schemaItemCondition } from "../src/lib/product-condition.ts";

test("used Grade A and Grade B inventory is never described as new to Google", () => {
  for (const metadata of [
    { condition: "used", condition_grade: "A" },
    { condition: "used", condition_grade: "B" },
  ]) {
    assert.equal(productCondition(metadata.condition), "used");
    assert.equal(schemaItemCondition(metadata.condition), "https://schema.org/UsedCondition");
  }
});

test("new existing inventory and refurbished inventory retain their own condition", () => {
  assert.equal(productCondition(undefined), "new");
  assert.equal(schemaItemCondition(undefined), "https://schema.org/NewCondition");
  assert.equal(productCondition("refurbished"), "refurbished");
  assert.equal(schemaItemCondition("refurbished"), "https://schema.org/RefurbishedCondition");
});
