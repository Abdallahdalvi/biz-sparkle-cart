import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACCESSORY_WARRANTY_POLICY,
  ACCESSORY_WARRANTY_FAQ,
  RETURNS_POLICY_SUMMARY,
} from "../src/lib/warranty-policy.ts";
test("battery and included charger have one-month cover beyond the DOA period", () => {
  assert.match(
    ACCESSORY_WARRANTY_POLICY,
    /one-month store warranty from the original delivery date/,
  );
  assert.match(ACCESSORY_WARRANTY_POLICY, /continues after the 48-hour/);
  assert.match(ACCESSORY_WARRANTY_POLICY, /does not extend warranty cover to the entire phone/);
  assert.match(ACCESSORY_WARRANTY_POLICY, /Delivery fees for approved replacements/);
  assert.match(ACCESSORY_WARRANTY_POLICY, /statutory consumer rights remain unaffected/);
  assert.equal(ACCESSORY_WARRANTY_FAQ.answer, ACCESSORY_WARRANTY_POLICY);
  assert.match(RETURNS_POLICY_SUMMARY, /separate one-month warranty/);
});
