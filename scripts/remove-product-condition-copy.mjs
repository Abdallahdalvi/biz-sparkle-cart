import { createClient } from "@supabase/supabase-js";
import { sanitizeProductRow } from "./product-copy-sanitizer.mjs";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: "electronic_shop" },
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: products, error } = await db
  .from("products")
  .select("id, tagline, description, metadata");
if (error) throw new Error(`Could not read products: ${error.message}`);

let changed = 0;
for (const product of products || []) {
  const sanitized = sanitizeProductRow(product);
  const before = JSON.stringify({
    tagline: product.tagline,
    description: product.description,
    metadata: product.metadata,
  });
  const after = JSON.stringify({
    tagline: sanitized.tagline,
    description: sanitized.description,
    metadata: sanitized.metadata,
  });
  if (before === after) continue;

  const { error: updateError } = await db
    .from("products")
    .update({
      tagline: sanitized.tagline,
      description: sanitized.description,
      metadata: sanitized.metadata,
    })
    .eq("id", product.id);
  if (updateError) throw new Error(`Could not update product copy: ${updateError.message}`);
  changed += 1;
}

console.log(`Removed product-condition copy from ${changed} listing(s).`);
