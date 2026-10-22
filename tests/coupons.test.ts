import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkoutDiscount,
  couponDiscountForMerchandise,
  normalizeCouponCode,
  validateCoupon,
  type Coupon,
} from "../src/lib/coupons.ts";
import { calculateGiftOrderAmounts } from "../src/lib/gift-card.ts";

const coupon: Coupon = {
  code: "SORRY-500",
  amountPaise: 50000,
  email: "customer@example.com",
  reason: "Late delivery",
  expiresAt: "2026-12-31T23:59:59Z",
  createdAt: "2026-10-22T00:00:00Z",
  disabled: false,
  orderId: null,
  checkoutSignature: null,
  checkoutReady: false,
};

test("₹500 coupon replaces ₹250 prepaid discount instead of stacking to ₹750", () => {
  const discount = checkoutDiscount("prepaid", 25000, coupon.amountPaise);
  const order = calculateGiftOrderAmounts({
    merchandisePaise: 299900,
    prepaidDiscountPaise: discount,
    codAdvancePaise: 4900,
    payMode: "prepaid",
    hasGiftCard: false,
  });
  assert.equal(order.discountPaise, 50000);
  assert.equal(order.totalPaise, 249900);
  assert.equal(order.paymentAmountPaise, 249900);
});
test("coupon replaces the prepaid discount even if it is smaller; removal restores promotion", () => {
  assert.equal(checkoutDiscount("prepaid", 25000, 10000), 10000);
  assert.equal(checkoutDiscount("prepaid", 25000), 25000);
});
test("COD rejects coupon usage and has no prepaid promotion", () => {
  assert.throws(() => checkoutDiscount("cod", 25000, 50000), /prepaid/);
  assert.throws(() => validateCoupon(coupon, coupon.email, "cod"), /prepaid/);
  assert.equal(checkoutDiscount("cod", 25000), 0);
});
test("coupon validation enforces recipient, expiry and disabled state", () => {
  const now = Date.parse("2026-10-22T00:00:00Z");
  assert.doesNotThrow(() => validateCoupon(coupon, " CUSTOMER@example.com ", "prepaid", now));
  assert.throws(() => validateCoupon(coupon, "other@example.com", "prepaid", now), /email/);
  assert.throws(
    () => validateCoupon({ ...coupon, disabled: true }, coupon.email, "prepaid", now),
    /available/,
  );
  assert.throws(
    () =>
      validateCoupon(
        { ...coupon, expiresAt: "2026-10-22T00:00:00Z" },
        coupon.email,
        "prepaid",
        now,
      ),
    /expired/,
  );
  assert.doesNotThrow(() =>
    validateCoupon({ ...coupon, email: "", expiresAt: null }, "any@example.com", "prepaid", now),
  );
  assert.equal(normalizeCouponCode(" sorry-500 "), "SORRY-500");
});
test("oversized coupons retain ₹1 online payment and never discount gift wrapping", () => {
  const discount = couponDiscountForMerchandise(50000, 29900);
  const result = calculateGiftOrderAmounts({
    merchandisePaise: 29900,
    prepaidDiscountPaise: discount,
    codAdvancePaise: 4900,
    payMode: "prepaid",
    hasGiftCard: true,
  });
  assert.equal(discount, 29800);
  assert.equal(result.paymentAmountPaise, 30000);
  assert.equal(result.giftFeePaise, 29900);
});
