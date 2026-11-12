import assert from "node:assert/strict";
import test from "node:test";
import {
  LANGUAGES,
  translateStorefrontText,
  validLanguage,
} from "../src/lib/storefront-language.ts";
import {
  STOREFRONT_TRANSLATIONS,
  STOREFRONT_TEMPLATES,
} from "../src/lib/storefront-translations.ts";

test("only the four requested languages can be selected", () => {
  assert.deepEqual(
    LANGUAGES.map((language) => language.code),
    ["en", "hi", "mr", "ar"],
  );
  assert.equal(validLanguage("ar"), "ar");
  assert.equal(validLanguage("xx"), "en");
  assert.equal(validLanguage(null), "en");
});
test("language changes preserve prices, names and order references", () => {
  for (const language of ["hi", "mr", "ar"] as const) {
    assert.notEqual(translateStorefrontText("Checkout", language), "Checkout");
    assert.notEqual(translateStorefrontText("  CHECKOUT  ", language).trim(), "CHECKOUT");
    assert.equal(translateStorefrontText("₹15,999", language), "₹15,999");
    assert.equal(translateStorefrontText("Nokia 130 (2023)", language), "Nokia 130 (2023)");
    assert.equal(translateStorefrontText("AGH-2026-123", language), "AGH-2026-123");
    assert.match(translateStorefrontText("₹300 advance required", language), /₹300/);
    assert.match(translateStorefrontText("Pay ₹15,699 on delivery.", language), /₹15,699/);
    assert.doesNotMatch(
      translateStorefrontText("Pay ₹15,699 on delivery.", language),
      /on delivery/,
    );
    const qr = translateStorefrontText(
      "We’ll call within 1 hour to confirm your COD order and share a QR code for the advance.",
      language,
    );
    assert.match(qr, /QR/);
    assert.match(qr, /1|ساعة/);
  }
  assert.equal(translateStorefrontText("Checkout", "en"), "Checkout");
});
test("all translations are complete and preserve template fields", () => {
  for (const row of [...STOREFRONT_TRANSLATIONS, ...STOREFRONT_TEMPLATES]) {
    assert.equal(row.length, 4);
    assert.ok(row.every((text) => text.trim()));
    const keys = row[0].match(/\{\w+\}/g)?.sort() || [];
    for (const text of row.slice(1)) assert.deepEqual(text.match(/\{\w+\}/g)?.sort() || [], keys);
  }
});
