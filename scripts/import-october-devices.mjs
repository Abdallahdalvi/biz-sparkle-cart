import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Run with node --env-file=.env scripts/import-october-devices.mjs <photo-directory>
// Optional final argument: JSON file mapping slugs to { priceRupees, stock, condition, grade }.
// Prices must be supplied by the seller. Unpriced listings are saved as inactive drafts.
const photoDirectory = process.argv[2];
if (!photoDirectory) throw new Error("Pass the directory containing converted JPEG photos.");
const pricing = process.argv[3] ? JSON.parse(await readFile(process.argv[3], "utf8")) : {};
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Supabase server configuration is required.");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "electronic_shop" },
  auth: { persistSession: false, autoRefreshToken: false },
});

const faq = (question, answer) => ({ question, answer });
const specs = (pairs) => pairs.map(([label, value]) => ({ label, value }));
const working =
  "Fully functional, with no known functional issues, as confirmed by the seller. The gallery shows the actual devices offered.";
const devices = [
  {
    slug: "oneplus-10r-5g-12-256gb",
    name: "OnePlus 10R 5G (12 GB / 256 GB)",
    brand: "OnePlus",
    condition: "used",
    grade: "A",
    formFactor: "Touchscreen",
    tagline: "12/256 GB · 120 Hz AMOLED",
    description: `Original OnePlus 10R 5G with 12 GB RAM and 256 GB storage, offered as a used Grade A device. ${working} The photographed unit shows OxygenOS 15 and a 4500 mAh battery, identifying the 150W edition. Charger and USB cable are pictured; no retail box is included in this listing. Cosmetic condition is shown in the supplied photos.`,
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
      ["Software", "OxygenOS 15 shown on the actual device"],
      ["Rear cameras", "50 MP OIS + 8 MP ultrawide + 2 MP macro"],
      ["Front camera", "16 MP"],
      ["Battery / charging", "4500 mAh · 150W SUPERVOOC edition"],
      ["Connectivity", "5G · Dual nano-SIM · Wi-Fi · Bluetooth · USB-C"],
      ["Included", "Device, charger and USB cable as pictured"],
    ]),
    faqs: [
      faq(
        "What condition is this OnePlus 10R in?",
        `This is a used Grade A OnePlus 10R. Grade A describes its cosmetic condition; it is not an A+ listing. ${working} Review the front, back and edge photos for the unit's appearance.`,
      ),
      faq(
        "Does this unit have 12 GB RAM and 256 GB storage?",
        "Yes. The actual device's About device photo confirms 12 GB RAM and 256 GB storage. Some storage is occupied by the operating system.",
      ),
      faq(
        "Is this the 80W or 150W OnePlus 10R?",
        "The supplied About device photo shows a 4500 mAh battery, which corresponds to the 150W SUPERVOOC edition. Fast charging requires a compatible charger and cable.",
      ),
      faq(
        "Which software is installed?",
        "The photographed device shows OxygenOS 15. The version installed when dispatched can change if the device receives an update.",
      ),
      faq(
        "What is included with this OnePlus 10R?",
        "The device, charger and USB cable shown in the gallery. A retail box is not included in this listing.",
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
    description: `Original Samsung Galaxy Chat GT-B5330 combining a touchscreen with a physical QWERTY keyboard. ${working} Supplied photos show the white handset, working screen, rear and edges, with a charger. It is a legacy Android device; current app and online-service compatibility must be checked for the intended app.`,
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
      ["Colour", "White, as photographed"],
      ["Functionality", "Fully functional · no known issues"],
    ]),
    faqs: [
      faq(
        "Does Galaxy Chat have a touchscreen and real keyboard?",
        "Yes. The GT-B5330 combines a 3-inch touchscreen with a physical QWERTY keyboard. The gallery shows both the keyboard and working screen.",
      ),
      faq(
        "Can I use current WhatsApp, banking or social apps on Galaxy Chat?",
        "This is a legacy Android phone. Many current apps no longer support its Android version; do not assume that an app works just because its icon appears in a photo. Ask us to demonstrate the specific app you need before ordering.",
      ),
      faq(
        "Is this Galaxy Chat original and functional?",
        `The seller confirms this is an original Samsung Galaxy Chat. ${working}`,
      ),
      faq(
        "Can the storage be expanded?",
        "Yes. Galaxy Chat supports a microSD memory card. A memory card is not listed as included.",
      ),
      faq(
        "Which colour and accessories are shown?",
        "The supplied photos show a white handset and a charger. Confirm any additional accessories with the store before ordering.",
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
    description: `Original realme Narzo 80 Pro 5G with 8 GB RAM and 128 GB storage, offered as a used Grade B device with its box. ${working} Grade B refers to cosmetic condition; inspect the supplied front, rear and edge photos for visible wear. The gallery shows the box, charger and USB cable, plus the unit's About device screen.`,
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
      ["Software", "realme UI 7.0 shown on the actual device"],
      ["Rear cameras", "50 MP Sony IMX882 OIS + 2 MP"],
      ["Front camera", "16 MP"],
      ["Battery / charging", "6000 mAh · 80W Ultra Charge"],
      ["Connectivity", "5G · Dual nano-SIM · Wi-Fi · Bluetooth · USB-C"],
      ["Included", "Device, box, charger and USB cable as pictured"],
    ]),
    faqs: [
      faq(
        "What does Grade B mean for this Narzo 80 Pro?",
        `This is a used Grade B unit. The grade describes cosmetic condition rather than a functional fault. ${working} Please inspect the edge and body photos for visible wear.`,
      ),
      faq(
        "Is the original box included?",
        "Yes. This listing includes the box, device, charger and USB cable shown in the supplied gallery.",
      ),
      faq(
        "Is this 8 GB physical RAM or extended RAM?",
        "It has 8 GB physical RAM and 128 GB storage. The About device photo also shows an additional virtual RAM allocation; virtual RAM is not extra physical RAM.",
      ),
      faq(
        "What battery and charging does Narzo 80 Pro support?",
        "The model has a 6000 mAh typical battery and supports 80W Ultra Charge. Battery runtime depends on usage and the condition of this used unit.",
      ),
      faq(
        "Does it have an OIS camera and 5G?",
        "Yes. The model has a 50 MP Sony IMX882 main camera with optical image stabilisation and supports 5G on compatible networks.",
      ),
      faq(
        "Which software is shown in the photos?",
        "The supplied About device photos show realme UI 7.0. Installed software may change after an update.",
      ),
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
    description: `Original Samsung GT-E1272 compact flip phone with physical keypad and dual-SIM support. ${working} The supplied gallery shows red, black and white handsets from the front, rear and sides. This is a calling and messaging feature phone, not an Android smartphone.`,
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
      ["Colours pictured", "Red · Black · White"],
      ["Functionality", "Fully functional · no known issues"],
    ]),
    faqs: [
      faq(
        "Is the Samsung GT-E1272 an Android phone?",
        "No. It is a keypad feature phone for calling, SMS and basic built-in functions. It does not run Android apps or have the Google Play Store.",
      ),
      faq(
        "Does GT-E1272 support two SIM cards?",
        "Yes. This model supports dual SIM cards. Confirm compatibility with your specific SIM operator before ordering.",
      ),
      faq(
        "Which colours are available?",
        "The supplied photos show red, black and white devices. Choose the colour variant shown for the listing and confirm current availability with the store.",
      ),
      faq(
        "Is the battery removable?",
        "Yes. The GT-E1272 uses a removable battery. Its rated capacity is 800 mAh; real runtime depends on usage and battery condition.",
      ),
      faq(
        "Is this an original, working Samsung device?",
        `The seller confirms it is an original Samsung GT-E1272. ${working}`,
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
    description: `V3i-style flip phone with a metal body, physical keypad and an outer display, offered in the gold and orange finishes pictured. ${working} The actual supplied photos show the exterior, illuminated keypad, working main screen, side controls and packaging. This listing identifies the V3i-style device shown in the photos; it does not use specifications from a different Motorola handset.`,
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
      ["Finishes pictured", "Gold · Orange"],
      ["Functionality", "Fully functional · no known issues"],
    ]),
    faqs: [
      faq(
        "What kind of phone is the V3i-style Metal Flip?",
        "It is the metal-body keypad flip phone shown in this gallery, with a main colour screen, an outer display and an illuminated physical keypad.",
      ),
      faq(
        "Is the body metal?",
        "Yes. The seller confirms a metal body. The side and rear photos show the construction and finish.",
      ),
      faq(
        "Which colours are shown?",
        "The supplied device photos show gold and orange finishes. Select your preferred variant and confirm its current availability before ordering.",
      ),
      faq("Is the device fully functional?", working),
      faq(
        "Can I see the exact device before buying?",
        "Yes. These are the seller's actual photos. Contact the store for a live demonstration and confirmation of the specific unit, included accessories and SIM compatibility.",
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
    const { error: variantError } = await db
      .from("product_variants")
      .insert(
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
