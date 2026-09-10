import assert from "node:assert/strict";
import test from "node:test";
import { trackCommerceEvent } from "../src/lib/tracking.ts";

type TrackingCall = unknown[];

test("catalog searches emit Meta Search with the entered term", () => {
  const metaCalls: TrackingCall[] = [];
  const googleCalls: TrackingCall[] = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      fbq: (...args: unknown[]) => metaCalls.push(args),
      gtag: (...args: unknown[]) => googleCalls.push(args),
    },
  });

  trackCommerceEvent("search", {
    currency: "INR",
    value: 0,
    searchString: "Qin phone",
    items: [{ item_id: "qin-f25-pro", item_name: "Qin F25 Pro", price: 12999, quantity: 1 }],
  });

  assert.equal(metaCalls[0]?.[0], "track");
  assert.equal(metaCalls[0]?.[1], "Search");
  assert.equal((metaCalls[0]?.[2] as { search_string?: string }).search_string, "Qin phone");
  assert.equal(googleCalls[0]?.[1], "search");
  assert.equal((googleCalls[0]?.[2] as { search_term?: string }).search_term, "Qin phone");
});

test("checkout submission emits Meta AddPaymentInfo with the selected method", () => {
  const metaCalls: TrackingCall[] = [];
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      fbq: (...args: unknown[]) => metaCalls.push(args),
    },
  });

  trackCommerceEvent("add_payment_info", {
    currency: "INR",
    value: 3499,
    paymentMethod: "Cash on Delivery",
    items: [{ item_id: "nokia-2720", item_name: "Nokia 2720", price: 3499, quantity: 1 }],
  });

  assert.equal(metaCalls[0]?.[0], "track");
  assert.equal(metaCalls[0]?.[1], "AddPaymentInfo");
  assert.equal(
    (metaCalls[0]?.[2] as { payment_method?: string }).payment_method,
    "Cash on Delivery",
  );
});
