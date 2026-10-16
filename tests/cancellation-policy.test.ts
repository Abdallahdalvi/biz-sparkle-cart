import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CANCELLATION_EFFECTIVE_DATE,
  CUSTOMER_CANCELLATION_POLICY,
  STORE_CANCELLATION_POLICY,
  CANCELLATION_POLICY_SUMMARY,
  CANCELLATION_FAQ,
} from "../src/lib/cancellation-policy.ts";
test("customer cancellation deduction is from actual payment, including COD advance", () => {
  assert.match(CUSTOMER_CANCELLATION_POLICY, /₹50 is deducted from the amount actually paid/);
  assert.match(CUSTOMER_CANCELLATION_POLICY, /not from the unpaid COD balance/);
  assert.match(CUSTOMER_CANCELLATION_POLICY, /cannot exceed the amount paid/);
  assert.match(
    CUSTOMER_CANCELLATION_POLICY,
    /unpaid checkout attempt has no refund and no separate cancellation charge/,
  );
  assert.match(CUSTOMER_CANCELLATION_POLICY, /full refund is required by applicable law/);
});
test("store cancellations promise full refund plus matching compensation", () => {
  assert.match(STORE_CANCELLATION_POLICY, /confirmed order unilaterally/);
  assert.match(
    STORE_CANCELLATION_POLICY,
    /full amount actually paid without a cancellation deduction and pay ₹50 compensation/,
  );
  assert.match(CANCELLATION_POLICY_SUMMARY, /before courier handover/);
  assert.match(CANCELLATION_POLICY_SUMMARY, /earlier orders are unchanged/);
  assert.equal(CANCELLATION_EFFECTIVE_DATE, "16 October 2026");
  assert.match(CANCELLATION_FAQ.answer, /₹499 COD advance is refunded as ₹449/);
});
test("policy change leaves payment processing untouched and explains full-refund admin action", () => {
  const admin = readFileSync(new URL("../src/routes/admin.orders.tsx", import.meta.url), "utf8");
  assert.match(admin, /does not deduct the customer cancellation fee/);
  const cancellation = readFileSync(
    new URL("../src/routes/legal.cancellation.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(cancellation, /only before the order is packed/);
});
