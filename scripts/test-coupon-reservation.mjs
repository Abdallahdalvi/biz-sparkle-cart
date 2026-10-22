// Integration test against configured Supabase. Creates one isolated temporary row
// and deletes exactly that row in finally; never creates an order or payment.
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const base = resolve("src", specifier.slice(2));
      return nextResolve(
        pathToFileURL(existsSync(`${base}.ts`) ? `${base}.ts` : base).href,
        context,
      );
    }
    return nextResolve(specifier, context);
  },
});
const { saveNewCoupon, readCoupon, claimCoupon, changeCoupon } =
  await import("../src/lib/coupons.server.ts");
const { supabaseAdmin } = await import("../src/integrations/supabase/client.server.ts");
const { createClient } = await import("@supabase/supabase-js");
const code = `TEST-${randomUUID()}`.slice(0, 40).toUpperCase();
let record;
try {
  await saveNewCoupon({
    code,
    amountPaise: 50000,
    email: "coupon-test@example.invalid",
    reason: "Temporary integration test",
    expiresAt: null,
    createdAt: new Date().toISOString(),
    disabled: false,
    orderId: null,
    checkoutSignature: null,
    checkoutReady: false,
  });
  record = await readCoupon(code.toLowerCase());
  assert.equal(record.coupon.code, code);
  await assert.rejects(() => saveNewCoupon(record.coupon), /already exists/);
  const anon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { db: { schema: "electronic_shop" }, auth: { persistSession: false } },
  );
  const { data: publicRow, error: publicError } = await anon
    .from("store_settings")
    .select("metadata")
    .eq("id", record.id)
    .single();
  if (publicError) throw publicError;
  assert.ok(!JSON.stringify(publicRow).includes(code));
  assert.ok(!JSON.stringify(publicRow).includes("coupon-test@example.invalid"));
  const result = await Promise.allSettled([
    claimCoupon(record, randomUUID(), "checkout-a", record.coupon.email),
    claimCoupon(record, randomUUID(), "checkout-b", record.coupon.email),
  ]);
  assert.equal(
    result.filter((entry) => entry.status === "fulfilled").length,
    1,
    "Exactly one competing checkout wins",
  );
  await assert.rejects(
    () => changeCoupon(record, { ...record.coupon, disabled: true }),
    /changed|claimed/,
  );
  const after = await readCoupon(code);
  if (after.coupon.orderId)
    await assert.rejects(
      () => claimCoupon(after, randomUUID(), "checkout-c", record.coupon.email),
      /claimed/,
    );
  console.log(
    "PASS: encrypted storage, duplicate rejection, atomic single-use claim, concurrent admin safety.",
  );
} finally {
  if (record) {
    const { error } = await supabaseAdmin.from("store_settings").delete().eq("id", record.id);
    if (error) throw error;
    console.log("Temporary coupon test row removed.");
  }
}
