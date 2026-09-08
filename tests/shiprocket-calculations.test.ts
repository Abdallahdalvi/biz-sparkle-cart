import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateEstimatedWalletDebitPaise,
  calculateShiprocketOrderAmounts,
  sortByEstimatedWalletDebit,
} from "../src/lib/shiprocket-calculations.ts";

test("COD advance is deducted exactly once", () => {
  const amounts = calculateShiprocketOrderAmounts({
    items: [{ unitPricePaise: 2_049_998, qty: 1 }],
    storedSubtotalPaise: 2_049_998,
    orderTotalPaise: 2_049_998,
    codCollectablePaise: 2_020_098,
    paymentMethod: "COD",
  });

  assert.deepEqual(amounts, {
    grossMerchandisePaise: 2_049_998,
    discountPaise: 29_900,
    shiprocketCollectionPaise: 2_020_098,
  });
  assert.equal(amounts.grossMerchandisePaise - amounts.discountPaise, 2_020_098);
});

test("prepaid order keeps gross subtotal with no artificial discount", () => {
  assert.deepEqual(
    calculateShiprocketOrderAmounts({
      items: [{ unitPricePaise: 349_900, qty: 1 }],
      storedSubtotalPaise: 349_900,
      orderTotalPaise: 349_900,
      codCollectablePaise: 0,
      paymentMethod: "Prepaid",
    }),
    {
      grossMerchandisePaise: 349_900,
      discountPaise: 0,
      shiprocketCollectionPaise: 0,
    },
  );
});

test("zero-advance COD collects the full gross amount", () => {
  assert.deepEqual(
    calculateShiprocketOrderAmounts({
      items: [{ unitPricePaise: 349_900, qty: 1 }],
      storedSubtotalPaise: 349_900,
      orderTotalPaise: 349_900,
      codCollectablePaise: 349_900,
      paymentMethod: "COD",
    }),
    {
      grossMerchandisePaise: 349_900,
      discountPaise: 0,
      shiprocketCollectionPaise: 349_900,
    },
  );
});

test("discounted prepaid order sends gross subtotal and genuine discount", () => {
  assert.deepEqual(
    calculateShiprocketOrderAmounts({
      items: [
        { unitPricePaise: 200_000, qty: 1 },
        { unitPricePaise: 74_950, qty: 2 },
      ],
      storedSubtotalPaise: 349_900,
      orderTotalPaise: 329_900,
      codCollectablePaise: 0,
      paymentMethod: "Prepaid",
    }),
    {
      grossMerchandisePaise: 349_900,
      discountPaise: 20_000,
      shiprocketCollectionPaise: 0,
    },
  );
});

test("courier estimate adds only coverage and other charges to rate", () => {
  assert.equal(
    calculateEstimatedWalletDebitPaise({
      rate: 112.34,
      coverageCharge: 20.5,
      otherCharges: 3.25,
    }),
    13_609,
  );
});

test("cheapest sorting uses complete estimated wallet debit", () => {
  const sorted = sortByEstimatedWalletDebit([
    { id: 1, estimatedWalletDebitPaise: 15_000 },
    { id: 2, estimatedWalletDebitPaise: 12_500 },
    { id: 3, estimatedWalletDebitPaise: 14_000 },
  ]);
  assert.deepEqual(
    sorted.map((courier) => courier.id),
    [2, 3, 1],
  );
});
