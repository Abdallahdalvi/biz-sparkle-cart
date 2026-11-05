import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { codAdvanceTier } from "../src/lib/cod-advance-policy.ts";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing Supabase configuration");
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
const phones = before.filter((p) => p.categories?.slug === "phones");
const changes = phones.map((p) => ({
  product: p,
  advance: codAdvanceTier({ name: p.name, category: "phones", metadata: p.metadata }),
}));
if (!phones.length || changes.some(({ product, advance }) => advance > product.price_paise))
  throw new Error("Catalogue or selling price does not support the requested tiers.");
const counts = {};
for (const { advance } of changes) counts[advance / 100] = (counts[advance / 100] || 0) + 1;
console.log(
  JSON.stringify({
    phones: phones.length,
    counts,
    precedence: "iPhone > smartphone/BlackBerry > supplier import > standard",
    higherTiers: changes
      .filter((c) => c.advance >= 19900)
      .map((c) => ({ name: c.product.name, advance: c.advance / 100 })),
  }),
);
if (process.argv.includes("--apply")) {
  const audit = `.codex_tmp/cod-tiers-${Date.now()}`;
  await mkdir(audit, { recursive: true });
  await writeFile(`${audit}/before.json`, JSON.stringify(before, null, 2));
  for (const { product, advance } of changes.filter(
    (c) => c.product.cod_advance_paise !== c.advance,
  )) {
    const { data, error } = await db
      .from("products")
      .update({ cod_advance_paise: advance })
      .eq("id", product.id)
      .eq("updated_at", product.updated_at)
      .eq("cod_advance_paise", product.cod_advance_paise)
      .select("id");
    if (error || data?.length !== 1)
      throw new Error(`Concurrent edit or save failure for ${product.slug}; inspect ${audit}`);
  }
  const after = await read();
  await writeFile(`${audit}/after.json`, JSON.stringify(after, null, 2));
  if (after.length !== before.length) throw new Error("Catalogue changed during update.");
  for (const product of after) {
    const expected = before.find((p) => p.id === product.id);
    const tier = codAdvanceTier({
      name: expected.name,
      category: expected.categories?.slug,
      metadata: expected.metadata,
    });
    const { updated_at, ...actual } = product;
    const { updated_at: previous, ...original } = expected;
    if (
      !isDeepStrictEqual(actual, {
        ...original,
        cod_advance_paise: tier ?? expected.cod_advance_paise,
      })
    )
      throw new Error(`Readback failed or concurrent stock change: ${product.slug}`);
  }
  console.log(JSON.stringify({ verified: true, counts, existingOrdersUntouched: true, audit }));
}
