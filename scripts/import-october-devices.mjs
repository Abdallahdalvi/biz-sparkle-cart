import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Run with node --env-file=.env scripts/import-october-devices.mjs <photo-directory>
// Optional final argument: JSON file mapping slugs to { priceRupees, stock, condition, grade }.
// Prices must be supplied by the seller. Unpriced listings are saved as inactive drafts.
// Use --copy-only to update existing descriptions/specs/FAQs without changing inventory or photos.
const copyOnly = process.argv.includes("--copy-only");
const photoDirectory = process.argv[2];
if (!copyOnly && !photoDirectory)
  throw new Error("Pass the directory containing converted JPEG photos.");
const pricing =
  !copyOnly && process.argv[3] ? JSON.parse(await readFile(process.argv[3], "utf8")) : {};
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Supabase server configuration is required.");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "electronic_shop" },
  auth: { persistSession: false, autoRefreshToken: false },
});

const faq = (question, answer) => ({ question, answer });
const specs = (pairs) => pairs.map(([label, value]) => ({ label, value }));
const working = "100% functional with no issues.";
const devices = [
  {
    slug: "oneplus-10r-5g-12-256gb",
    name: "OnePlus 10R 5G (12 GB / 256 GB)",
    brand: "OnePlus",
    condition: "used",
    grade: "A",
    formFactor: "Touchscreen",
    tagline: "12/256 GB · 120 Hz AMOLED",
    description: `100% original OnePlus 10R 5G with 12 GB RAM and 256 GB storage in used Grade A condition. ${working} Enjoy a 6.7-inch 120 Hz Fluid OLED display, the MediaTek Dimensity 8100-MAX processor and a 50 MP main camera with optical image stabilisation. This is the 150W SUPERVOOC edition with a 4500 mAh battery and OxygenOS 15. Includes the phone, charger and USB cable. Retail box is not included.`,
    photos: [
      "PXL_20261011_082057118",
      "PXL_20261011_082220800",
      "PXL_20261011_082247311",
      "PXL_20261011_082039503",
      "PXL_20261011_082147492",
      "PXL_20261011_082123688",
      "PXL_20261011_082236635",
      "PXL_20261011_082303639",
      "PXL_20261011_082307928",
      "PXL_20261011_082319617",
    ],
    specs: specs([
      ["Memory", "12 GB RAM / 256 GB storage"],
      ["Condition", "Used · Grade A"],
      ["Display", "6.7-inch Fluid OLED · 2412 × 1080 · 120 Hz"],
      ["Processor", "MediaTek Dimensity 8100-MAX"],
      ["Software", "OxygenOS 15"],
      ["Rear cameras", "50 MP OIS + 8 MP ultrawide + 2 MP macro"],
      ["Front camera", "16 MP"],
      ["Battery / charging", "4500 mAh · 150W SUPERVOOC edition"],
      ["Connectivity", "5G · Dual nano-SIM · Wi-Fi · Bluetooth · USB-C"],
      ["Included", "Phone, charger and USB cable"],
    ]),
    faqs: [
      faq(
        "What condition is this OnePlus 10R in?",
        `This OnePlus 10R is in used Grade A condition. ${working} Grade A refers to its cosmetic condition.`,
      ),
      faq(
        "Does this unit have 12 GB RAM and 256 GB storage?",
        "Yes. It has 12 GB physical RAM and 256 GB internal storage.",
      ),
      faq(
        "Is this the 80W or 150W OnePlus 10R?",
        "This is the 150W SUPERVOOC edition with a 4500 mAh battery. It supports 150W fast charging with a compatible SUPERVOOC charger and cable.",
      ),
      faq("Which software is installed?", "It runs OxygenOS 15."),
      faq(
        "What is included with this OnePlus 10R?",
        "The phone, charger and USB cable are included. A retail box is not included.",
      ),
      faq(
        "Does the OnePlus 10R support 5G and a memory card?",
        "It supports 5G on compatible networks and dual nano-SIM cards. It does not have a microSD card slot.",
      ),
    ],
    references: ["https://www.oneplus.in/10r/specs"],
  },
  {
    slug: "samsung-galaxy-chat-gt-b5330",
    name: "Samsung Galaxy Chat (GT-B5330)",
    brand: "Samsung",
    formFactor: "QWERTY",
    colors: ["White"],
    tagline: "Android · Physical QWERTY",
    description: `100% original Samsung Galaxy Chat GT-B5330 in white, combining a 3-inch touchscreen with a physical QWERTY keyboard. ${working} It features Android with Samsung TouchWiz, a 2 MP rear camera, 4 GB internal storage, microSD expansion, Wi-Fi and Bluetooth. Includes the phone and charger. A compact choice for calling, texting and physical-keyboard typing.`,
    photos: [
      "IMG_1728",
      "IMG_1727",
      "IMG_1733",
      "IMG_1734",
      "IMG_1729",
      "IMG_1730",
      "IMG_1731",
      "IMG_1732",
      "IMG_1726",
    ],
    specs: specs([
      ["Model", "Samsung Galaxy Chat · GT-B5330"],
      ["Design", "Touchscreen and physical QWERTY keyboard"],
      ["Display", "3.0-inch TFT touchscreen"],
      ["Software", "Legacy Android with Samsung TouchWiz"],
      ["Rear camera", "2 MP"],
      ["Storage", "4 GB internal · microSD support"],
      ["Connectivity", "Wi-Fi · Bluetooth · micro-USB"],
      ["Colour", "White"],
      ["Functionality", "100% functional · No issues"],
    ]),
    faqs: [
      faq(
        "Does Galaxy Chat have a touchscreen and real keyboard?",
        "Yes. It has a 3-inch touchscreen and a physical QWERTY keyboard.",
      ),
      faq(
        "Can I use current WhatsApp, banking or social apps on Galaxy Chat?",
        "It runs legacy Android and supports compatible legacy apps. Current WhatsApp and banking apps are not supported on its older Android platform.",
      ),
      faq(
        "Is this Galaxy Chat original and functional?",
        "Yes. This is a 100% original Samsung Galaxy Chat, fully functional with no issues.",
      ),
      faq(
        "Can the storage be expanded?",
        "Yes. It supports a microSD memory card. A memory card is not included.",
      ),
      faq(
        "Which colour and accessories are included?",
        "The phone is white. The phone and charger are included.",
      ),
    ],
    references: ["https://www.samsung.com/id/support/model.GT-B5330ZIAXSE/"],
  },
  {
    slug: "realme-narzo-80-pro-5g-8-128gb",
    name: "realme Narzo 80 Pro 5G (8 GB / 128 GB)",
    brand: "realme",
    condition: "used",
    grade: "B",
    formFactor: "Touchscreen",
    colors: ["Silver"],
    tagline: "8/128 GB · With box · Grade B",
    description: `100% original realme Narzo 80 Pro 5G with 8 GB RAM and 128 GB storage in used Grade B condition. ${working} It combines a 120 Hz OLED display, MediaTek Dimensity 7400 processor, 50 MP Sony OIS camera and a 6000 mAh battery with 80W Ultra Charge. Runs realme UI 7.0. Includes the phone, original box, charger and USB cable. Grade B describes cosmetic condition; the device is fully functional.`,
    photos: [
      "PXL_20261011_075318057",
      "PXL_20261011_075407238",
      "PXL_20261011_075523487",
      "PXL_20261011_075445428",
      "PXL_20261011_075510240",
      "PXL_20261011_075531636",
      "PXL_20261011_075540685",
      "PXL_20261011_075559530",
    ],
    specs: specs([
      ["Memory", "8 GB RAM / 128 GB storage"],
      ["Condition", "Used · Grade B · with box"],
      ["Display", "6.7-inch OLED · 2392 × 1080 · 120 Hz"],
      ["Processor", "MediaTek Dimensity 7400"],
      ["Software", "realme UI 7.0"],
      ["Rear cameras", "50 MP Sony IMX882 OIS + 2 MP"],
      ["Front camera", "16 MP"],
      ["Battery / charging", "6000 mAh · 80W Ultra Charge"],
      ["Connectivity", "5G · Dual nano-SIM · Wi-Fi · Bluetooth · USB-C"],
      ["Included", "Phone, original box, charger and USB cable"],
    ]),
    faqs: [
      faq(
        "What does Grade B mean for this Narzo 80 Pro?",
        `This Narzo 80 Pro is in used Grade B condition. Grade B describes cosmetic condition. ${working}`,
      ),
      faq(
        "Is the original box included?",
        "Yes. The original box, phone, charger and USB cable are included.",
      ),
      faq(
        "Is this 8 GB physical RAM or extended RAM?",
        "It has 8 GB physical RAM and 128 GB storage. Extended RAM uses internal storage and is separate from the 8 GB physical RAM.",
      ),
      faq(
        "What battery and charging does Narzo 80 Pro support?",
        "The model has a 6000 mAh typical battery and supports 80W Ultra Charge. Battery runtime depends on usage and the condition of this used unit.",
      ),
      faq(
        "Does it have an OIS camera and 5G?",
        "Yes. The model has a 50 MP Sony IMX882 main camera with optical image stabilisation and supports 5G on compatible networks.",
      ),
      faq("Which software is installed?", "It runs realme UI 7.0."),
    ],
    references: ["https://www.realme.com/in/realme-narzo-80-pro-5g/specs"],
  },
  {
    slug: "samsung-gt-e1272-flip",
    name: "Samsung GT-E1272 Flip",
    brand: "Samsung",
    formFactor: "Flip",
    colors: ["Red", "Black", "White"],
    tagline: "Compact flip · Dual SIM",
    description: `100% original Samsung GT-E1272 compact flip phone with a physical keypad and dual-SIM support. ${working} It features a 1.77-inch colour display, removable 800 mAh battery and FM radio. Available in red, black and white. Its pocket-friendly clamshell design is built for straightforward calling and texting.`,
    photos: [
      "IMG_0085",
      "IMG_0086",
      "IMG_0071",
      "IMG_0072",
      "IMG_0073",
      "IMG_0074",
      "IMG_0075",
      "IMG_0076",
      "IMG_0077",
      "IMG_0078",
      "IMG_0079",
      "IMG_0080",
      "IMG_0081",
      "IMG_0082",
      "IMG_0083",
      "IMG_0084",
    ],
    specs: specs([
      ["Model", "Samsung GT-E1272"],
      ["Design", "Compact clamshell flip with physical keypad"],
      ["SIM", "Dual SIM"],
      ["Display", "1.77-inch TFT"],
      ["Battery", "800 mAh removable"],
      ["Features", "Calling · SMS · FM radio"],
      ["Colours", "Red · Black · White"],
      ["Functionality", "100% functional · No issues"],
    ]),
    faqs: [
      faq(
        "Is the Samsung GT-E1272 an Android phone?",
        "No. It is a keypad feature phone for calling, SMS and basic built-in functions. It does not run Android apps or have the Google Play Store.",
      ),
      faq("Does GT-E1272 support two SIM cards?", "Yes. It supports two SIM cards."),
      faq(
        "Which colours are available?",
        "It is available in red, black and white. Select your preferred colour when ordering.",
      ),
      faq(
        "Is the battery removable?",
        "Yes. The GT-E1272 uses a removable battery. Its rated capacity is 800 mAh; real runtime depends on usage and battery condition.",
      ),
      faq(
        "Is this an original, working Samsung device?",
        "Yes. This is a 100% original Samsung GT-E1272, fully functional with no issues.",
      ),
    ],
    references: ["https://www.samsung.com/ph/support/model/GT-E1272GRAXTC/"],
  },
  {
    slug: "v3i-style-metal-flip",
    name: "V3i-style Metal Flip",
    brand: "V3i-style",
    formFactor: "Flip",
    colors: ["Gold", "Orange"],
    tagline: "Metal body · Dual display flip",
    description: `V3i-style flip phone with a metal body, illuminated physical keypad and dual displays. ${working} The main colour screen is complemented by an external display for convenient viewing while closed. Available in gold and orange, its slim clamshell design combines a distinctive metallic finish with tactile keypad controls.`,
    photos: [
      "IMG-20261005-WA0105",
      "IMG-20261005-WA0109",
      "IMG-20261005-WA0016",
      "IMG-20261005-WA0005",
      "IMG-20261005-WA0003",
      "IMG-20261005-WA0007",
      "IMG-20261005-WA0038",
      "IMG-20261005-WA0044",
      "IMG-20261005-WA0046",
      "IMG-20261005-WA0097",
      "IMG-20261005-WA0103",
      "IMG-20261005-WA0113",
      "IMG-20261005-WA0115",
    ],
    specs: specs([
      ["Design", "V3i-style clamshell flip"],
      ["Body", "Metal body"],
      ["Displays", "Main colour display and external display"],
      ["Keypad", "Physical keypad with illumination"],
      ["Finishes", "Gold · Orange"],
      ["Functionality", "100% functional · No issues"],
    ]),
    faqs: [
      faq(
        "What kind of phone is the V3i-style Metal Flip?",
        "It is a metal-body keypad flip phone with a main colour screen, an external display and an illuminated physical keypad.",
      ),
      faq("Is the body metal?", "Yes. It has a metal body."),
      faq(
        "Which colours are available?",
        "It is available in gold and orange. Select your preferred colour when ordering.",
      ),
      faq("Is the device fully functional?", `Yes. ${working}`),
      faq(
        "Can I see the exact device before buying?",
        "Yes. A live video demonstration is available before purchase.",
      ),
    ],
    references: [],
  },
];

const { data: category, error: categoryError } = await db
  .from("categories")
  .select("id")
  .eq("slug", "phones")
  .single();
if (categoryError) throw new Error(categoryError.message);
const { data: existing, error: readError } = await db
  .from("products")
  .select("id,slug,metadata,price_paise,stock,is_active")
  .in(
    "slug",
    devices.map((p) => p.slug),
  );
if (readError) throw new Error(readError.message);

for (const product of devices) {
  const current = existing.find((p) => p.slug === product.slug);
  if (copyOnly) {
    if (!current) throw new Error(`Product not found: ${product.slug}`);
    const questionAliases = {
      "Which colour and accessories are shown?": "Which colour and accessories are included?",
      "Which software is shown in the photos?": "Which software is installed?",
      "Which colours are shown?": "Which colours are available?",
    };
    const specAliases = { "Colours pictured": "Colours", "Finishes pictured": "Finishes" };
    const metadata = {
      ...current.metadata,
      specs: (current.metadata?.specs || []).map((spec) => {
        const label = specAliases[spec.label] || spec.label;
        // Replace only the source-attribution wording, preserving other admin edits.
        if (
          !/(?:photograph|pictured|shown on the actual|no known issues)/i.test(
            spec.label + " " + spec.value,
          )
        )
          return spec;
        return product.specs.find((next) => next.label === label) || spec;
      }),
      faqs: (current.metadata?.faqs || []).map((item) => {
        const question = questionAliases[item.question] || item.question;
        return product.faqs.find((next) => next.question === question) || item;
      }),
    };
    const { error } = await db
      .from("products")
      .update({ description: product.description, metadata })
      .eq("id", current.id);
    if (error) throw new Error(`Copy update failed for ${product.slug}: ${error.message}`);
    console.log(`Updated descriptions, specs and FAQs: ${product.name}`);
    continue;
  }
  const supplied = pricing[product.slug] || {};
  const images = [];
  for (const [index, filename] of product.photos.entries()) {
    const bytes = await readFile(resolve(photoDirectory, `${filename}.jpg`));
    const path = `actual-devices-20261013/${product.slug}/${String(index + 1).padStart(2, "0")}-${filename}.jpg`;
    const { error } = await db.storage
      .from("product-images")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" });
    if (error) throw new Error(`Image upload failed for ${product.slug}: ${error.message}`);
    images.push(db.storage.from("product-images").getPublicUrl(path).data.publicUrl);
  }
  const price =
    supplied.priceRupees !== undefined
      ? Math.round(Number(supplied.priceRupees) * 100)
      : current?.price_paise || 0;
  if (!Number.isSafeInteger(price) || price < 0)
    throw new Error(`Invalid price for ${product.slug}`);
  const condition =
    supplied.condition || product.condition || current?.metadata?.condition || "new";
  const grade = supplied.grade ?? product.grade ?? current?.metadata?.condition_grade ?? "";
  const stock = supplied.stock ?? current?.stock ?? 1;
  if (!Number.isSafeInteger(stock) || stock < 0)
    throw new Error(`Invalid stock for ${product.slug}`);
  const metadata = {
    ...(current?.metadata || {}),
    brand: product.brand,
    condition,
    condition_grade: grade,
    form_factor: product.formFactor,
    images,
    specs: product.specs,
    faqs: product.faqs,
    source_references: product.references,
    photo_source: "Seller-supplied Photos-1-001.zip",
    ...(price === 0
      ? { draft_reason: "Seller price required before publishing" }
      : { draft_reason: "" }),
    variants: (product.colors || []).map((label) => ({ label })),
  };
  const row = {
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    category_id: category.id,
    price_paise: price,
    cod_advance_paise: 0,
    compare_at_paise: null,
    stock,
    is_active: price > 0 && (supplied.priceRupees !== undefined || current?.is_active === true),
    metadata,
  };
  const { data: saved, error } = await db
    .from("products")
    .upsert(row, { onConflict: "slug" })
    .select("id,slug,is_active")
    .single();
  if (error) throw new Error(`Product save failed: ${error.message}`);
  // Initial import only: later admin photo/variant edits must remain intact.
  if (!current && product.colors?.length) {
    const { error: variantError } = await db.from("product_variants").insert(
      product.colors.map((label) => ({
        product_id: saved.id,
        label,
        price_delta_paise: 0,
        stock,
      })),
    );
    if (variantError) throw new Error(`Variant save failed: ${variantError.message}`);
  }
  console.log(
    `${product.name}: ${images.length} photos, ${product.faqs.length} device FAQs, ${saved.is_active ? "published" : "draft (price needed)"}`,
  );
}
