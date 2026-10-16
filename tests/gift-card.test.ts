import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  giftCardInputSchema,
  readGiftCard,
  giftCardHtml,
  calculateGiftOrderAmounts,
  GIFT_CARD_PRICE_PAISE,
  GIFT_CARD_ITEM_NAME,
  giftCardLines,
} from "../src/lib/gift-card.ts";
import { calculateShiprocketOrderAmounts } from "../src/lib/shiprocket-calculations.ts";

const base = {
  merchandisePaise: 799900,
  prepaidDiscountPaise: 0,
  codAdvancePaise: 49900,
  payMode: "prepaid" as const,
  hasGiftCard: true,
};
test("gift wrapping with a greeting card is optional and charged once per order at ₹299", () => {
  assert.match(GIFT_CARD_ITEM_NAME, /Gift wrapping \+ personalised greeting card/);
  const enabled = calculateGiftOrderAmounts(base);
  assert.equal(enabled.giftFeePaise, 29900);
  assert.equal(enabled.totalPaise, 829800);
  assert.equal(enabled.paymentAmountPaise, 829800);
  assert.equal(calculateGiftOrderAmounts({ ...base, hasGiftCard: false }).totalPaise, 799900);
});
test("COD advance stays unchanged and balance includes gift fee exactly once", () => {
  const result = calculateGiftOrderAmounts({ ...base, payMode: "cod" });
  assert.equal(result.advancePaise, 49900);
  assert.equal(result.paymentAmountPaise, 49900);
  assert.equal(result.codCollectablePaise, 779900);
  const shipping = calculateShiprocketOrderAmounts({
    items: [
      { unitPricePaise: base.merchandisePaise, qty: 1 },
      { unitPricePaise: GIFT_CARD_PRICE_PAISE, qty: 1 },
    ],
    storedSubtotalPaise: result.subtotalPaise,
    orderTotalPaise: result.totalPaise,
    codCollectablePaise: result.codCollectablePaise,
    paymentMethod: "COD",
  });
  assert.equal(shipping.shiprocketCollectionPaise, 779900);
  assert.equal(shipping.discountPaise, 49900);
});
test("prepaid discount applies only to merchandise and cannot discount the card", () => {
  const discounted = calculateGiftOrderAmounts({ ...base, prepaidDiscountPaise: 10000 });
  assert.equal(discounted.totalPaise, 819800);
  const capped = calculateGiftOrderAmounts({ ...base, prepaidDiscountPaise: 99999999 });
  assert.equal(capped.totalPaise, 29900);
  assert.equal(capped.discountPaise, base.merchandisePaise);
});
test("requires a nonblank message, limits user text, ignores client fee overrides", () => {
  assert.equal(giftCardInputSchema.safeParse({ message: "   " }).success, false);
  assert.equal(giftCardInputSchema.safeParse({ message: "x".repeat(301) }).success, false);
  assert.equal(
    giftCardInputSchema.safeParse({ message: "Hello", to: "x".repeat(81) }).success,
    false,
  );
  assert.deepEqual(giftCardInputSchema.parse({ message: " Happy festival! ", fee_paise: 1 }), {
    to: "",
    from: "",
    message: "Happy festival!",
  });
});
test("stored messages are read safely and escaped in printable/email HTML", () => {
  const address = {
    gift_card: {
      message: '<script>alert("x")</script>',
      to: "A & B",
      from: "Sender",
      fee_paise: 29900,
    },
  };
  assert.equal(readGiftCard(address)?.fee_paise, 29900);
  assert.match(giftCardLines(address)[0], /GIFT WRAP THIS ORDER/);
  const html = giftCardHtml(address);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("A &amp; B"));
  assert.ok(!html.includes("<script>"));
  assert.equal(readGiftCard({}), null);
  assert.equal(giftCardHtml({}), "");
});
test("all payment fulfilment paths skip gift-card stock and do not change customer shipping", () => {
  for (const file of ["orders.functions.ts", "cashfree.server.ts", "razorpay.server.ts"]) {
    const source = readFileSync(new URL(`../src/lib/${file}`, import.meta.url), "utf8");
    assert.match(source, /if \(!item.product_id\) continue/);
  }
  const orders = readFileSync(new URL("../src/lib/orders.functions.ts", import.meta.url), "utf8");
  assert.match(orders, /shipping_paise: 0/);
});
