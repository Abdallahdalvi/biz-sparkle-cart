import { test } from "node:test";
import assert from "node:assert/strict";
import { rankProducts, popularityScore } from "../src/lib/product-ranking.ts";

const now = Date.parse("2026-10-26T12:00:00Z");
const products = [
  {
    slug: "old-popular",
    stock: 5,
    createdAt: "2026-01-01",
    price: 500,
    engagement: { views: 100, clicks: 50, carts: 20 },
  },
  { slug: "new-phone", stock: 5, createdAt: "2026-10-25", price: 100 },
  {
    slug: "sold-out",
    stock: 0,
    createdAt: "2026-10-26",
    price: 300,
    engagement: { views: 1000, clicks: 1000, carts: 200 },
  },
  { slug: "another-phone", stock: 5, createdAt: "2026-10-20", price: 200 },
];

test("newly added follows creation dates, including sold-out phones", () => {
  assert.deepEqual(
    rankProducts(products, "newest").map((p) => p.slug),
    ["sold-out", "new-phone", "another-phone", "old-popular"],
  );
});

test("popular uses engagement and puts sold-out inventory after available phones", () => {
  const result = rankProducts(products, "popular", "seed", now);
  assert.equal(result[0].slug, "old-popular");
  assert.equal(result.at(-1)?.slug, "sold-out");
  assert.ok(
    popularityScore({ slug: "a", stock: 1, engagement: { views: 10, clicks: 10, carts: 10 } }) >
      popularityScore({ slug: "b", stock: 1, engagement: { views: 10, clicks: 10, carts: 0 } }),
  );
});

test("recommendations are stable for a visit, vary across visits, and never mutate input", () => {
  const original = products.map((p) => p.slug);
  const first = rankProducts(products, "recommended", "visit-1", now);
  assert.deepEqual(first, rankProducts(products, "recommended", "visit-1", now));
  const orders = new Set(
    Array.from({ length: 100 }, (_, index) =>
      rankProducts(products, "recommended", `visit-${index}`, now)
        .map((p) => p.slug)
        .join(","),
    ),
  );
  assert.ok(orders.size > 1);
  assert.deepEqual(
    products.map((p) => p.slug),
    original,
  );
  assert.equal(first.at(-1)?.slug, "sold-out");
  assert.equal(new Set(first.map((p) => p.slug)).size, products.length);
});

test("strong engagement improves selection odds while allowing discovery", () => {
  const items = products.filter((p) => p.stock > 0);
  const winners = Array.from(
    { length: 1000 },
    (_, index) => rankProducts(items, "recommended", `random-${index}`, now)[0].slug,
  );
  assert.ok(winners.filter((slug) => slug === "old-popular").length > 500);
  assert.ok(winners.includes("new-phone"));
  assert.ok(winners.includes("another-phone"));
});

test("cold start, missing dates, empty inventory and price changes are safe", () => {
  assert.deepEqual(rankProducts([], "recommended"), []);
  const cold = products.map(({ engagement, createdAt, ...p }) => p);
  const result = rankProducts(cold, "recommended", "cold", now);
  assert.deepEqual(
    result.map((p) => p.slug),
    rankProducts(
      cold.map((p) => ({ ...p, price: -p.price })),
      "recommended",
      "cold",
      now,
    ).map((p) => p.slug),
  );
  assert.equal(result.length, cold.length);
});

test("default merchandising order keeps original devices before imported collections", () => {
  const sourced = [
    { slug: "vintage", stock: 1, merchandisingGroup: 3 },
    { slug: "zone", stock: 1, merchandisingGroup: 1 },
    { slug: "manual", stock: 1, merchandisingGroup: 0 },
    { slug: "universal", stock: 1, merchandisingGroup: 2 },
  ];
  assert.deepEqual(
    rankProducts(sourced, "recommended", "source-order").map((product) => product.slug),
    ["manual", "zone", "universal", "vintage"],
  );
});

test("recommended and popular use distinct tie-breaking so cold-start lists do not mirror", () => {
  const coldStart = Array.from({ length: 12 }, (_, index) => ({
    slug: `device-${index}`,
    stock: 1,
    createdAt: "2026-10-01T00:00:00Z",
  }));
  const recommended = rankProducts(coldStart, "recommended", "same-visit", now);
  const popular = rankProducts(coldStart, "popular", "same-visit", now);
  assert.notDeepEqual(
    recommended.slice(0, 6).map((product) => product.slug),
    popular.slice(0, 6).map((product) => product.slug),
  );
});
