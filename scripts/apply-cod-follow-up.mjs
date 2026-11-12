import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { followUpAdvanceForPrice } from "../src/lib/cod-follow-up.ts";

// Preview: node --env-file=.env --experimental-strip-types scripts/apply-cod-follow-up.mjs
// Apply only after the corresponding storefront release is live: add --apply.
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "electronic_shop" },
  auth: { persistSession: false, autoRefreshToken: false },
});
async function read() {
  const { data, error } = await db
    .from("products")
    .select("*,categories(slug),product_variants(*)")
    .order("id");
  if (error) throw error;
  return data;
}
const before = await read();
const phones = before.filter((product) => product.categories?.slug === "phones");
if (!phones.length) throw new Error("Phone catalogue not found.");
const expected = (product) => ({
  ...product,
  cod_advance_paise: 0,
  metadata: { ...product.metadata, cod_advance_collection: "after_confirmation" },
});
console.log(
  JSON.stringify({
    phones: phones.length,
    checkoutAdvance: 0,
    collectAfterConfirmation: true,
    apply: process.argv.includes("--apply"),
  }),
);
if (process.argv.includes("--apply")) {
  const audit = `.codex_tmp/cod-follow-up-${Date.now()}`;
  await mkdir(audit, { recursive: true });
  await writeFile(`${audit}/before.json`, JSON.stringify(before, null, 2));
  for (const product of phones) {
    if (
      product.cod_advance_paise === 0 &&
      product.metadata?.cod_advance_collection === "after_confirmation"
    )
      continue;
    const { error, data } = await db
      .from("products")
      .update({ cod_advance_paise: 0, metadata: expected(product).metadata })
      .eq("id", product.id)
      .eq("updated_at", product.updated_at)
      .select("id");
    if (error || data?.length !== 1)
      throw new Error(`Concurrent edit or save failure: ${product.slug}; inspect ${audit}`);
  }
  const after = await read();
  await writeFile(`${audit}/after.json`, JSON.stringify(after, null, 2));
  const clean = ({ updated_at, ...product }) => product;
  if (after.length !== before.length) throw new Error("Catalogue changed during update.");
  for (const product of after) {
    const original = before.find((row) => row.id === product.id);
    const intended = original.categories?.slug === "phones" ? expected(original) : original;
    if (!isDeepStrictEqual(clean(product), clean(intended)))
      throw new Error(`Readback mismatch or concurrent change: ${product.slug}`);
  }
  console.log(
    JSON.stringify({
      verified: true,
      phones: phones.length,
      allPhoneCheckoutAdvancesZero: after
        .filter((product) => product.categories?.slug === "phones")
        .every((product) => product.cod_advance_paise === 0),
      exampleFollowUpRupees: phones
        .filter((product) => product.is_active)
        .slice(0, 3)
        .map((product) => ({
          slug: product.slug,
          advance: followUpAdvanceForPrice(product.price_paise) / 100,
        })),
      audit,
      existingOrdersUntouched: true,
    }),
  );
}
