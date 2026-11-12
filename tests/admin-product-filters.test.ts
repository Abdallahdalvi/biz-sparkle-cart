import assert from "node:assert/strict";
import test from "node:test";
import {
  adminProductBrand,
  DEFAULT_ADMIN_PRODUCT_FILTERS as defaults,
  filterAdminProducts,
  hasAdminProductFilters,
} from "../src/lib/admin-product-filters.ts";

const products = [
  {
    name: "Nokia 130 (2023)",
    slug: "nokia-130-2023",
    category_id: "phones",
    price_paise: 119900,
    stock: 6,
    is_active: true,
    metadata: { variants: [{ label: "Dark Blue" }] },
  },
  {
    name: "BlackBerry Q20",
    slug: "q20",
    category_id: "phones",
    price_paise: 1799900,
    stock: 8,
    is_active: true,
    metadata: { specs: [{ label: "Keyboard", value: "QWERTY" }] },
  },
  {
    name: "Custom headphones",
    slug: "headphones",
    category_id: "audio",
    price_paise: 0,
    stock: 0,
    is_active: false,
    metadata: { brand: "Sony" },
  },
  {
    name: "Nokia 150",
    slug: "nokia-150",
    category_id: "phones",
    price_paise: 149900,
    stock: 0,
    is_active: false,
  },
];

test("admin search combines brand, model, specs and variant terms", () => {
  assert.equal(adminProductBrand(products[0]), "Nokia");
  assert.equal(adminProductBrand(products[2]), "Sony");
  assert.deepEqual(
    filterAdminProducts(products, { ...defaults, search: "  NOKIA blue  " }).map((p) => p.slug),
    ["nokia-130-2023"],
  );
  assert.deepEqual(
    filterAdminProducts(products, { ...defaults, search: "qwerty" }).map((p) => p.slug),
    ["q20"],
  );
  assert.equal(
    filterAdminProducts(products, {
      ...defaults,
      brand: "Nokia",
      availability: "in_stock",
      category: "phones",
      status: "active",
    }).length,
    1,
  );
  assert.equal(
    filterAdminProducts(products, { ...defaults, brand: "BlackBerry", search: "nokia" }).length,
    0,
  );
});

test("hidden and unpriced drafts remain discoverable separately", () => {
  assert.deepEqual(
    filterAdminProducts(products, { ...defaults, status: "draft" }).map((p) => p.slug),
    ["headphones"],
  );
  assert.deepEqual(
    filterAdminProducts(products, { ...defaults, status: "hidden" }).map((p) => p.slug),
    ["nokia-150"],
  );
  assert.equal(
    filterAdminProducts(products, { ...defaults, availability: "out_of_stock" }).length,
    2,
  );
});

test("sorting and filtering never mutate saved storefront order", () => {
  const original = structuredClone(products);
  assert.deepEqual(
    filterAdminProducts(products, { ...defaults, brand: "Nokia", sort: "price_desc" }).map(
      (p) => p.price_paise,
    ),
    [149900, 119900],
  );
  assert.deepEqual(
    filterAdminProducts(products, { ...defaults, sort: "price_asc" }).map((p) => p.price_paise),
    [0, 119900, 149900, 1799900],
  );
  assert.deepEqual(filterAdminProducts(products, defaults), original);
  assert.deepEqual(products, original);
  assert.equal(hasAdminProductFilters(defaults), false);
  assert.equal(hasAdminProductFilters({ ...defaults, sort: "price_desc" }), true);
  assert.equal(hasAdminProductFilters({ ...defaults, brand: "Nokia" }), true);
});
