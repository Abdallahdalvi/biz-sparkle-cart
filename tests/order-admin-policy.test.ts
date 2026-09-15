import assert from "node:assert/strict";
import test from "node:test";
import {
  canPermanentlyDeleteOrder,
  hasVerifiedOrderPayment,
  isUnpaidPaymentAttempt,
} from "../src/lib/order-admin-policy.ts";

test("pending checkout without a verified payment is an unpaid attempt", () => {
  const order = { status: "pending", cashfree_payment_id: null, razorpay_payment_id: null };
  assert.equal(hasVerifiedOrderPayment(order), false);
  assert.equal(isUnpaidPaymentAttempt(order), true);
  assert.equal(canPermanentlyDeleteOrder(order), true);
});

test("verified pending payment is not treated as an unpaid attempt", () => {
  const order = { status: "pending", cashfree_payment_id: "cf_payment_123" };
  assert.equal(hasVerifiedOrderPayment(order), true);
  assert.equal(isUnpaidPaymentAttempt(order), false);
  assert.equal(canPermanentlyDeleteOrder(order), false);
});

test("zero-advance COD order in processing remains actionable", () => {
  const order = { status: "processing", cashfree_payment_id: null };
  assert.equal(isUnpaidPaymentAttempt(order), false);
  assert.equal(canPermanentlyDeleteOrder(order), false);
});

test("paid and fulfilled records can never be permanently deleted", () => {
  assert.equal(
    canPermanentlyDeleteOrder({ status: "cancelled", cashfree_payment_id: "cf_payment_123" }),
    false,
  );
  assert.equal(
    canPermanentlyDeleteOrder({ status: "cancelled", shiprocket_shipment_id: "shipment_123" }),
    false,
  );
  assert.equal(canPermanentlyDeleteOrder({ status: "shipped" }), false);
});

test("cancelled unpaid record without fulfilment data may be deleted", () => {
  assert.equal(canPermanentlyDeleteOrder({ status: "cancelled" }), true);
});
