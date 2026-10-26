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

function purchaseHarness({ ads = false, blockedStorage = false } = {}) {
  const googleCalls: TrackingCall[] = [];
  const stored = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      gtag: (...args: unknown[]) => googleCalls.push(args),
      localStorage: {
        getItem: (key: string) => {
          if (blockedStorage) throw new Error("Storage blocked");
          return stored.get(key) || null;
        },
        setItem: (key: string, value: string) => {
          if (blockedStorage) throw new Error("Storage blocked");
          stored.set(key, value);
        },
      },
      __aghanimsTrackingSettings: {
        googleAnalyticsEnabled: true,
        googleAnalyticsId: "G-TESTONLY",
        googleAdsEnabled: ads,
        googleAdsId: ads ? "AW-123456789" : "",
        googleAdsPurchaseLabel: ads ? "test-only-label" : "",
      },
    },
  });
  return googleCalls;
}

const purchase = (transactionId: string) => ({
  value: 3499,
  transactionId,
  items: [{ item_id: "nokia-2720-flip", item_name: "Nokia 2720 FLIP", price: 3499, quantity: 1 }],
});

test("GA4 purchase sends INR order value, items and transaction ID once", () => {
  const calls = purchaseHarness();
  trackCommerceEvent("purchase", purchase("ga4-order"));
  trackCommerceEvent("purchase", purchase("ga4-order"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], "purchase");
  assert.deepEqual(calls[0][2], {
    currency: "INR",
    value: 3499,
    transaction_id: "ga4-order",
    search_term: undefined,
    payment_type: undefined,
    items: purchase("ga4-order").items,
  });
});

test("Google Ads purchase uses the configured destination and deduplicates", () => {
  const calls = purchaseHarness({ ads: true });
  trackCommerceEvent("purchase", purchase("ads-order"));
  trackCommerceEvent("purchase", purchase("ads-order"));
  assert.equal(calls.filter((call) => call[1] === "purchase").length, 1);
  const conversions = calls.filter((call) => call[1] === "conversion");
  assert.equal(conversions.length, 1);
  assert.deepEqual(conversions[0][2], {
    send_to: "AW-123456789/test-only-label",
    value: 3499,
    currency: "INR",
    transaction_id: "ads-order",
  });
});

test("disabled Ads still allows GA4 purchases and distinct orders remain distinct", () => {
  const calls = purchaseHarness();
  trackCommerceEvent("purchase", purchase("different-order-1"));
  trackCommerceEvent("purchase", purchase("different-order-2"));
  assert.equal(calls.filter((call) => call[1] === "purchase").length, 2);
  assert.equal(calls.filter((call) => call[1] === "conversion").length, 0);
});

test("blocked browser storage does not break checkout or duplicate purchases", () => {
  const calls = purchaseHarness({ blockedStorage: true });
  assert.doesNotThrow(() => trackCommerceEvent("purchase", purchase("blocked-storage-order")));
  trackCommerceEvent("purchase", purchase("blocked-storage-order"));
  assert.equal(calls.filter((call) => call[1] === "purchase").length, 1);
});
