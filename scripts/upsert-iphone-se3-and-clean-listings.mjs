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

const { data: phoneCategory, error: categoryError } = await db
  .from("categories")
  .select("id")
  .eq("slug", "phones")
  .single();

if (categoryError || !phoneCategory) {
  throw new Error(`Could not find Phones category: ${categoryError?.message || "missing"}`);
}

const iphone = {
  slug: "iphone-se-3-2022",
  name: "Apple iPhone SE 3 (2022)",
  tagline: "A15 Bionic • 5G • Touch ID • 4.7-inch Retina HD",
  description:
    "A compact iPhone powered by the A15 Bionic chip, with Touch ID, 5G connectivity, a 12 MP camera, wireless charging, and a 4.7-inch Retina HD display. Exact storage, colour, cosmetic condition, battery health, warranty status, and included accessories are confirmed before payment.",
  price_paise: 2099900,
  cod_advance_paise: 0,
  compare_at_paise: null,
  stock: 1,
  is_active: true,
  category_id: phoneCategory.id,
  metadata: {
    form_factor: "Compact iPhone",
    source_reference: "https://support.apple.com/en-in/111866",
    images: [
      "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111866_sp867-iphone-se-3gen.png",
      "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111866_sp867-portimage.png",
    ],
    videos: [
      {
        title: "iPhone SE 3",
        url: "https://www.youtube.com/shorts/bEH_UsI4lG0",
      },
    ],
    specs: [
      { label: "Model", value: "iPhone SE, 3rd generation (2022)" },
      { label: "Display", value: "4.7-inch Retina HD IPS, 1334 × 750" },
      { label: "Chip", value: "Apple A15 Bionic" },
      { label: "Rear Camera", value: "12 MP wide, optical image stabilisation" },
      { label: "Front Camera", value: "7 MP" },
      { label: "Biometrics", value: "Touch ID fingerprint sensor in Home button" },
      { label: "Network", value: "5G and 4G LTE; exact bands depend on model variant" },
      { label: "Durability", value: "IP67 water and dust resistance when new" },
      { label: "Charging", value: "Lightning, Qi wireless charging, fast-charge capable" },
      { label: "Unit Details", value: "Storage, colour and condition confirmed before payment" },
    ],
    faqs: [
      {
        question: "Which storage, colour, and condition will I receive?",
        answer:
          "Available units can vary. We confirm the exact storage, colour, cosmetic condition, battery health, warranty status, and included accessories with you before payment.",
      },
      {
        question: "Does it support Indian 5G and 4G networks?",
        answer:
          "The iPhone SE 3 supports 5G and 4G LTE. Compatibility depends on the exact regional model and your operator, so the available unit can be checked against your SIM before payment.",
      },
      {
        question: "What happens if it arrives damaged or defective?",
        answer:
          "Contact us within 48 hours of delivery with an unboxing video and clear proof. Eligible delivery-damage, wrong-item, or functional-defect claims are reviewed under the store replacement policy.",
      },
    ],
  },
};

const { error: iphoneError } = await db.from("products").upsert(iphone, { onConflict: "slug" });
if (iphoneError) throw new Error(`Could not save iPhone SE 3: ${iphoneError.message}`);

const { data: products, error: readError } = await db
  .from("products")
  .select("id,slug,name,tagline,metadata");

if (readError) throw new Error(`Could not read product listings: ${readError.message}`);

function cleanCardTagline(tagline = "") {
  return tagline
    .replace(/\s*•\s*(?:open box|like new|qc tested|new arrival|best seller)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

for (const product of products || []) {
  const { badge: _removedBadge, ...metadata } = product.metadata || {};
  const { error: updateError } = await db
    .from("products")
    .update({ tagline: cleanCardTagline(product.tagline), metadata })
    .eq("id", product.id);

  if (updateError) throw new Error(`Could not clean ${product.slug}: ${updateError.message}`);
}

console.log(`Saved iPhone SE 3 at ₹20,999 and cleaned ${products?.length || 0} product cards.`);
