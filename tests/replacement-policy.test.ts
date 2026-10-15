import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REPLACEMENT_DELIVERY_FAQ,
  REPLACEMENT_DELIVERY_NOTICE,
  REPLACEMENT_DELIVERY_POLICY,
} from "../src/lib/replacement-policy.ts";
test("replacement fee policy distinguishes original delivery, prior agreement and legal exceptions", () => {
  assert.match(REPLACEMENT_DELIVERY_POLICY, /original order only/);
  assert.match(REPLACEMENT_DELIVERY_POLICY, /pay the delivery fee/);
  assert.match(
    REPLACEMENT_DELIVERY_POLICY,
    /quote the fee and obtain your agreement before dispatching/,
  );
  assert.match(REPLACEMENT_DELIVERY_POLICY, /statutory consumer rights remain unaffected/);
  assert.equal(REPLACEMENT_DELIVERY_FAQ.answer, REPLACEMENT_DELIVERY_POLICY);
  assert.match(REPLACEMENT_DELIVERY_NOTICE, /except where applicable law requires otherwise/);
});
