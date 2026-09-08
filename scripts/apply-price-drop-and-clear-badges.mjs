import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: "electronic_shop" },
  auth: { persistSession: false, autoRefreshToken: false },
});

const targetPrices = new Map([
  ["blackberry-classic-q20", 1079000],
  ["blackberry-keyone", 2159000],
  ["blackberry-passport-q30", 1899000],
  ["blackberry-q10", 1199900],
  ["cat-s22-flip", 2099000],
  ["qin-2-pro", 1999000],
  ["qin-3", 2699900],
  ["qin-f21-pro", 1499000],
  ["qin-f22-no-camera", 1190000],
  ["qin-f22-pro-google", 1559900],
  ["qin-f25-pro", 1690000],
  ["nokia-6700-slide", 349900],
]);

const { data: products, error: readError } = await db
  .from("products")
  .select("id,slug,name,price_paise,metadata");

if (readError) throw new Error(`Could not read products: ${readError.message}`);

for (const product of products || []) {
  const { badge: _removedBadge, ...metadata } = product.metadata || {};
  const pricePaise = targetPrices.get(product.slug) ?? product.price_paise;
  const { error: updateError } = await db
    .from("products")
    .update({ price_paise: pricePaise, metadata })
    .eq("id", product.id);

  if (updateError) throw new Error(`Could not update ${product.slug}: ${updateError.message}`);

  console.log(`${product.name}: ₹${(pricePaise / 100).toLocaleString("en-IN")} • badge cleared`);
}
