import assert from "node:assert/strict";
import test from "node:test";
import {
  codAdvanceOverride,
  followUpAdvanceForOrder,
  followUpAdvanceForPrice,
  recordedFollowUpAdvance,
} from "../src/lib/cod-follow-up.ts";
import { calculateGiftOrderAmounts } from "../src/lib/gift-card.ts";
import {
  hasVerifiedOrderPayment,
  canPermanentlyDeleteOrder,
} from "../src/lib/order-admin-policy.ts";

test("follow-up advances include exact price boundaries and ignore model", () => {
  for (const [rupees, advance] of [
    [1099, 199],
    [5999, 199],
    [5999.99, 199],
    [6000, 299],
    [6999, 299],
    [13999, 299],
    [13999.99, 299],
    [14000, 499],
    [14999, 499],
    [100000, 499],
  ]) {
    assert.equal(followUpAdvanceForPrice(Math.round(rupees * 100)), advance * 100);
  }
  assert.equal(followUpAdvanceForPrice(0), 0);
  assert.equal(followUpAdvanceForPrice(-100), 0);
  assert.equal(followUpAdvanceForPrice(NaN), 0);
  assert.equal(followUpAdvanceForPrice(5000), 5000);
});

test("a manual override wins for a single product and one advance covers mixed carts", () => {
  assert.equal(codAdvanceOverride(0), 0);
  assert.equal(codAdvanceOverride("199"), undefined);
  assert.equal(codAdvanceOverride(-100), undefined);
  assert.equal(followUpAdvanceForOrder(379900, [0]), 0);
  assert.equal(followUpAdvanceForOrder(379900, [15000]), 15000);
  assert.equal(followUpAdvanceForOrder(379900, [600000]), 379900);
  assert.equal(followUpAdvanceForOrder(1400000, [19900, undefined]), 49900);
  assert.equal(followUpAdvanceForOrder(1400000, [50000, 14900]), 50000);
  assert.equal(followUpAdvanceForOrder(1400000, [undefined, undefined]), 49900);
});

const order = {
  notes: "cod",
  status: "processing",
  shipping_address: {
    first_name: "Test",
    cod_advance_collection: "after_confirmation",
    gift_card: { to: "Friend" },
  },
  cod_advance_paise: 30000,
  advance_paid_paise: 0,
  total_paise: 1599900,
  cashfree_order_id: null,
  shiprocket_shipment_id: null,
};

test("COD confirms at zero and only recorded advance reduces courier balance", () => {
  const checkout = calculateGiftOrderAmounts({
    merchandisePaise: order.total_paise,
    prepaidDiscountPaise: 25000,
    codAdvancePaise: 0,
    payMode: "cod",
    hasGiftCard: false,
  });
  assert.equal(checkout.paymentAmountPaise, 0);
  assert.equal(checkout.codCollectablePaise, order.total_paise);
  assert.equal(checkout.discountPaise, 0);
  const saved = recordedFollowUpAdvance(order, " TEST-UPI-123 ", "admin-1", "2026-11-12T12:00:00Z");
  assert.equal(saved.advance_paid_paise, 30000);
  assert.equal(saved.cod_collectable_paise, 1569900);
  assert.equal(saved.shipping_address.first_name, "Test");
  assert.deepEqual(saved.shipping_address.gift_card, { to: "Friend" });
  assert.equal(saved.shipping_address.cod_advance_receipt.reference, "TEST-UPI-123");
  const paid = { ...order, ...saved };
  assert.equal(hasVerifiedOrderPayment(paid), true);
  assert.equal(canPermanentlyDeleteOrder({ ...paid, status: "cancelled" }), false);
  assert.throws(
    () => recordedFollowUpAdvance(paid, "again", "admin-1", "now"),
    /already been recorded/,
  );
});

test("manual recording rejects prepaid, provider sessions, cancelled and shipped orders", () => {
  for (const changes of [
    { notes: "prepaid" },
    { shipping_address: {} },
    { status: "cancelled" },
    { shiprocket_shipment_id: "shipment" },
    { cashfree_order_id: "cf-order" },
    { cod_advance_paise: 0 },
    { cod_advance_paise: 2000000 },
  ]) {
    assert.throws(() =>
      recordedFollowUpAdvance({ ...order, ...changes }, "UPI-123", "admin-1", "now"),
    );
  }
  assert.throws(() => recordedFollowUpAdvance(order, "x", "admin-1", "now"), /reference/);
  assert.equal(hasVerifiedOrderPayment({ ...order, advance_paid_paise: 30000 }), false);
});
