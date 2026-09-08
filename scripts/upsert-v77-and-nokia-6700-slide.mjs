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

const legacyNetworkAnswer =
  "This is a legacy 2G/3G phone without 4G or VoLTE. Indian network availability varies by operator and location, and Jio is not supported. Share your SIM operator before ordering so the available unit can be checked.";

const legacyCondition =
  "Open-box, like-new condition. Network unlocked and individually QC tested before dispatch. Cosmetic condition, colour, packaging, and included accessories can vary by unit; the exact available unit is confirmed before payment.";

const supplierProducts = [
  {
    sourceUrl:
      "https://yelphones.com/products/ver-tu-v77-premium-luxury-flip-phone-flip-mobile-keypad.js",
    sourceReference:
      "https://www.olx.in/item/mobile-phones-c1453-used-other-mobiles-in-jogeshwari-west-mumbai-iid-1850348897",
    slug: "v77-luxury-flip",
    name: "V77 Luxury Flip (Vertu-style)",
    tagline: "Luxury-style Flip • Dual SIM",
    formFactor: "Luxury Flip",
    description:
      "A premium-look V77 flip feature phone for calling, messaging, and basic multimedia. This is a Vertu-style replica and is not represented as an official Vertu-manufactured handset. " +
      legacyCondition,
    overridePricePaise: 599900,
    overrideCompareAtPaise: 1450000,
    specs: [
      ["Authenticity", "Vertu-style replica; not an official Vertu handset"],
      ["Condition", "Open box, like new, unlocked, individually QC tested"],
      ["Form Factor", "Premium-look flip phone with physical keypad"],
      ["Display", "2.4-inch main display + secondary external display"],
      ["SIM", "Dual SIM (Mini SIM + Micro SIM)"],
      ["Network", "Legacy 2G calling; no 4G/VoLTE; Jio not supported"],
      ["Camera", "3.2 MP rear camera"],
      ["Memory", "100 MB internal; microSD expansion supported"],
      ["Battery", "1600 mAh removable"],
      ["Features", "Bluetooth, wireless FM, torch, MP4 playback"],
    ],
    faqs: [
      {
        question: "Is this an original Vertu phone?",
        answer:
          "No. This is a V77 luxury-style replica with a Vertu-inspired flip design. It is listed transparently as a replica rather than an official Vertu-manufactured handset.",
      },
      { question: "Will my Indian SIM work?", answer: legacyNetworkAnswer },
      { question: "What condition will I receive?", answer: legacyCondition },
    ],
  },
  {
    sourceUrl: "https://www.astore.in/products/nokia-6700-slide-phone-original.js",
    sourceReference: "https://www.astore.in/products/nokia-6700-slide-phone-original",
    slug: "nokia-6700-slide",
    name: "Nokia 6700 Slide (6700s)",
    tagline: "Original Slider • Symbian • 5 MP Camera",
    formFactor: "Slider",
    description:
      "The original Nokia 6700 Slide combines a compact aluminium slider body, physical keypad, Symbian software, and a 5 MP autofocus camera with Carl Zeiss optics. It is a discontinued legacy phone intended for collectors and basic compatible-network use. " +
      legacyCondition,
    overridePricePaise: 349900,
    specs: [
      ["Condition", "Open box, like new, unlocked, individually QC tested"],
      ["Operating System", "Symbian OS 9.3, S60 3rd Edition Feature Pack 2"],
      ["Form Factor", "Aluminium slider with physical numeric keypad"],
      ["Display", "2.2-inch TFT, 240 × 320"],
      ["Network", "GSM / HSPA 3G; no 4G or VoLTE"],
      ["Camera", "5 MP autofocus, Carl Zeiss optics, dual-LED flash"],
      ["Memory", "45 MB internal; microSD card support"],
      ["Battery", "860 mAh BL-4CT removable"],
      ["SIM", "Single Mini-SIM"],
      ["Connectivity", "Bluetooth 2.1, micro-USB, 2.5 mm audio jack"],
    ],
    faqs: [
      {
        question: "Does the Nokia 6700 Slide run modern Android apps?",
        answer:
          "No. It runs the discontinued Symbian S60 platform. Modern Android apps and current online services should not be expected to work.",
      },
      { question: "Will my Indian SIM work?", answer: legacyNetworkAnswer },
      { question: "What condition will I receive?", answer: legacyCondition },
    ],
  },
];

const { data: phoneCategory, error: categoryError } = await db
  .from("categories")
  .select("id")
  .eq("slug", "phones")
  .single();

if (categoryError || !phoneCategory) {
  throw new Error(`Could not find Phones category: ${categoryError?.message || "missing"}`);
}

const rows = [];
for (const product of supplierProducts) {
  const response = await fetch(product.sourceUrl);
  if (!response.ok) throw new Error(`Could not load supplier listing: ${product.sourceUrl}`);

  const source = await response.json();
  const availableVariants = source.variants.filter((variant) => variant.available);
  const variants = availableVariants.length ? availableVariants : source.variants;
  const sourcePricePaise = Math.min(...variants.map((variant) => Number(variant.price)));
  const pricePaise = product.overridePricePaise ?? sourcePricePaise;
  const comparePrices = variants
    .map((variant) => Number(variant.compare_at_price || 0))
    .filter((price) => price > pricePaise);
  const images = source.images
    .map((url) => (url.startsWith("//") ? `https:${url}` : url))
    .slice(0, 5);

  rows.push({
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    price_paise: pricePaise,
    cod_advance_paise: 0,
    compare_at_paise:
      product.overrideCompareAtPaise ?? (comparePrices.length ? Math.max(...comparePrices) : null),
    stock: 1,
    is_active: true,
    category_id: phoneCategory.id,
    metadata: {
      form_factor: product.formFactor,
      source_reference: product.sourceReference,
      images,
      specs: product.specs.map(([label, value]) => ({ label, value })),
      faqs: product.faqs,
    },
  });
}

const { data: savedProducts, error: productError } = await db
  .from("products")
  .upsert(rows.map(sanitizeProductRow), { onConflict: "slug" })
  .select("slug,name,price_paise,compare_at_paise,stock,metadata");

if (productError) throw new Error(`Product upsert failed: ${productError.message}`);

for (const product of savedProducts || []) {
  console.log(
    `${product.name}: ₹${(product.price_paise / 100).toLocaleString("en-IN")} (${product.metadata?.images?.length || 0} images)`,
  );
}
