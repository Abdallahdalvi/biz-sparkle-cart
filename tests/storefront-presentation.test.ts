import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");
test("related product thumbnails contain the full image inside a padded square", () => {
  const product = read("routes/product.$slug.tsx");
  const related = product.slice(product.indexOf("{related.map((p)"));
  assert.match(related, /aspect-square[^\n]*p-4/);
  assert.match(related, /object-contain object-center/);
  assert.doesNotMatch(related, /object-cover|group-hover:scale-105/);
});
test("checkout has policy links without cancellation or replacement warning boxes", () => {
  const checkout = read("routes/checkout.tsx");
  assert.doesNotMatch(checkout, /CANCELLATION_CHECKOUT_NOTICE|REPLACEMENT_DELIVERY_NOTICE/);
  assert.match(checkout, /to="\/legal\/cancellation"/);
  assert.match(checkout, /to="\/legal\/returns"/);
  assert.match(checkout, /amounts.subtotalPaise - codAdvancePaise/);
});
test("long cancellation and replacement notices are excluded from storefront FAQs", () => {
  const products = read("lib/products.ts");
  assert.match(products, /faq.question !== CANCELLATION_FAQ.question/);
  assert.match(products, /faq.question !== REPLACEMENT_DELIVERY_FAQ.question/);
  const trustFaqs = products.slice(
    products.indexOf("export const STORE_TRUST_FAQS"),
    products.indexOf("export const LATEST_GOOGLE_TEXT_REVIEWS"),
  );
  assert.doesNotMatch(trustFaqs, /CANCELLATION_FAQ|REPLACEMENT_DELIVERY_FAQ/);
});
