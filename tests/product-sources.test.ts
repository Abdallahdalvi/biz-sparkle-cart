import test from "node:test";
import assert from "node:assert/strict";
import { getProductSources } from "../src/lib/product-sources.ts";

test("imported product shows the preferred pricing source before alternative listings", () => {
  const vintage = "https://www.vintagemobilearena.in/product/123/Nokia-6300";
  const zone = "https://zoneofdeals.com/product/nokia-6300/";
  assert.deepEqual(
    getProductSources({
      supplier_import: { source_url: vintage },
      source_references: [zone, vintage, `${vintage}#photos`],
    }),
    [
      { url: vintage, label: "Vintage Mobile Arena", primary: true },
      { url: zone, label: "Zone of Deals", primary: false },
    ],
  );
});

test("source links reject script URLs, embedded credentials and malformed metadata", () => {
  assert.deepEqual(getProductSources(null), []);
  assert.deepEqual(getProductSources({ source_references: "https://example.com/" }), []);
  assert.deepEqual(
    getProductSources({
      supplier_import: { source_url: "javascript:alert(1)" },
      source_references: [
        null,
        123,
        "/relative",
        "data:text/html,hi",
        "https://user:password@example.com/",
      ],
    }),
    [],
  );
});

test("original products without source metadata have no supplier section", () => {
  assert.deepEqual(
    getProductSources({ brand: "Nokia", images: ["https://example.com/phone.jpg"] }),
    [],
  );
  assert.deepEqual(getProductSources({ source_references: [" https://supplier.example/phone "] }), [
    { url: "https://supplier.example/phone", label: "supplier.example", primary: false },
  ]);
});
