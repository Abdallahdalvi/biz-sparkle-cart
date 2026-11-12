import { test } from "node:test";
import assert from "node:assert/strict";
import { canShowDeliveryGuide, DELIVERY_GUIDE_STEPS } from "../src/lib/delivery-guide.ts";
import { codAdvanceTier } from "../src/lib/cod-advance-policy.ts";

const paid = {
  status: "paid",
  paymentMethod: "cod" as const,
  onlinePaymentReceived: true,
  codAdvancePaise: 4900,
  advancePaidPaise: 4900,
};
test("delivery popup waits for confirmed payment, not a pending checkout", () => {
  assert.equal(canShowDeliveryGuide(paid), true);
  for (const status of ["pending", "cancelled", "refunded"])
    assert.equal(canShowDeliveryGuide({ ...paid, status }), false);
  assert.equal(canShowDeliveryGuide({ ...paid, advancePaidPaise: 0 }), false);
  assert.equal(
    canShowDeliveryGuide({ ...paid, paymentMethod: "prepaid", onlinePaymentReceived: false }),
    false,
  );
  assert.equal(canShowDeliveryGuide({ ...paid, paymentMethod: "prepaid" }), true);
  assert.equal(
    canShowDeliveryGuide({
      ...paid,
      status: "processing",
      codAdvancePaise: 0,
      advancePaidPaise: 0,
      onlinePaymentReceived: false,
    }),
    true,
  );
});
test("guidance distinguishes suspicion from proof and explains after-handover inspection", () => {
  const text = DELIVERY_GUIDE_STEPS.map((step) => step.body).join(" ");
  assert.match(text, /label alone does not prove/);
  assert.match(text, /After accepting the parcel/);
  assert.match(text, /do not pay or accept under pressure/i);
  assert.match(text, /48 hours/);
});
test("advance tiers prioritize actual iPhones and smartphones over supplier source", () => {
  const phone = { name: "Nokia keypad", category: "phones" };
  assert.equal(codAdvanceTier(phone), 4900);
  const imported = { supplier_import: { source_url: "https://supplier.invalid/product" } };
  assert.equal(codAdvanceTier({ ...phone, metadata: imported }), 9900);
  assert.equal(
    codAdvanceTier({ name: "BlackBerry Classic Q20", category: "phones", metadata: imported }),
    19900,
  );
  assert.equal(
    codAdvanceTier({
      name: "Samsung S21 FE",
      category: "phones",
      metadata: { ...imported, brand: "Samsung", form_factor: "Touchscreen" },
    }),
    19900,
  );
  assert.equal(
    codAdvanceTier({ name: "Apple iPhone SE 3", category: "phones", metadata: imported }),
    49900,
  );
  assert.equal(
    codAdvanceTier({
      name: "iPhone-style keypad",
      category: "phones",
      metadata: { ...imported, brand: "Unbranded", form_factor: "Keypad" },
    }),
    9900,
  );
  assert.equal(codAdvanceTier({ ...phone, category: "audio" }), null);
  assert.equal(
    codAdvanceTier({
      name: "Jio Phone 2 Qwerty",
      category: "phones",
      metadata: { brand: "Jio", specs: [{ label: "OS", value: "KaiOS" }] },
    }),
    4900,
  );
  assert.equal(
    codAdvanceTier({
      name: "Nokia 105 4G",
      category: "phones",
      metadata: { ...imported, form_factor: "Touchscreen" },
    }),
    9900,
  );
});
