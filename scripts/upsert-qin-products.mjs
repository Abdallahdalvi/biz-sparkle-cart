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

const condition =
  "New-condition, network-unlocked unit that is individually QC tested before dispatch. Packaging and included accessories can vary by supplier batch.";

const androidFaqs = [
  {
    question: "Will Google Play and my Android apps work?",
    answer:
      "The listed Google edition includes Google services. App compatibility still depends on the model's Android version, screen size, memory, and each app's current requirements. Confirm any essential app before ordering.",
  },
  {
    question: "Will my Indian SIM work?",
    answer:
      "The supplied unit is network unlocked. Band and VoLTE compatibility can vary by model and operator, so share your SIM operator before dispatch if voice calling or a specific 4G band is essential.",
  },
  { question: "What condition will I receive?", answer: condition },
];

const featurePhoneFaqs = [
  {
    question: "Does this phone run Android apps?",
    answer:
      "No. This is a focused keypad phone rather than a full Android smartphone. Buy it for calling, messaging, hotspot, and the explicitly listed built-in functions—not Play Store apps.",
  },
  {
    question: "Will my Indian SIM work?",
    answer:
      "The supplied unit is network unlocked. Band and VoLTE compatibility can vary by operator, so share your SIM operator before dispatch if a specific calling or data feature is essential.",
  },
  { question: "What condition will I receive?", answer: condition },
];

const catalog = [
  {
    sourceHandle: "xiaomi-mijia-qin-1s-volte-4g",
    slug: "qin-1s-plus",
    name: "Qin 1S+ 4G Keypad",
    tagline: "4G Keypad • Dual SIM • Hotspot • QC Tested",
    formFactor: "4G Keypad",
    description:
      "A slim non-Android keypad phone with 4G VoLTE, Wi-Fi hotspot, Bluetooth, GPS, and no camera. Designed for focused calling and connectivity rather than modern Android apps. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Mocor 5 feature-phone platform (not Android)"],
      ["Display", "2.8-inch, 240 × 320"],
      ["Processor", "SC9820E dual-core 1.3 GHz"],
      ["Memory", "512 MB RAM, 4 GB storage, microSD up to 32 GB"],
      ["Camera", "No camera"],
      ["Battery", "1480 mAh; supplier-listed standby up to 7 days"],
      ["SIM", "Dual SIM dual standby; Nano SIM / shared TF slot"],
      ["Connectivity", "4G VoLTE, Wi-Fi hotspot, Bluetooth 4.2, GPS, infrared"],
    ],
    faqs: featurePhoneFaqs,
  },
  {
    sourceHandle: "xiaomi-qin-f21s-keypad-phone-mi-original",
    slug: "qin-f21s",
    name: "Qin F21S Keypad",
    tagline: "Compact 4G Keypad • Dual SIM • No Camera • QC Tested",
    formFactor: "4G Keypad",
    description:
      "A compact non-Android 4G keypad phone for calls and essential phone functions. It uses the Mocor platform and should not be confused with the Android-based F21 Pro. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Mocor 5 feature-phone platform (not Android)"],
      ["Form Factor", "Compact physical keypad"],
      ["Display", "2.4-inch"],
      ["Processor", "Spreadtrum platform"],
      ["Memory", "1 GB RAM, 8 GB storage"],
      ["Camera", "No front or rear camera"],
      ["Battery", "1150 mAh"],
      ["SIM", "Dual SIM"],
      ["Network", "4G LTE; operator compatibility should be confirmed"],
    ],
    faqs: featurePhoneFaqs,
  },
  {
    sourceHandle: "xiomi-qin-f21-pro-qwerty-keypad-basic-simple-android-smartphone",
    slug: "qin-f21-pro",
    name: "Qin F21 Pro Google Edition",
    tagline: "Android Keypad • Google Services • 3/32 GB • QC Tested",
    formFactor: "Android Keypad",
    description:
      "A pocket-sized Android keypad smartphone with a 2.8-inch touchscreen, Google services, cameras, 4G, and USB-C. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Android 11 with Google services"],
      ["Form Factor", "Physical keypad + capacitive touchscreen"],
      ["Display", "2.8-inch IPS, 480 × 640"],
      ["Processor", "MediaTek Helio A22, quad-core 2.0 GHz"],
      ["Memory", "3 GB RAM, 32 GB storage"],
      ["Cameras", "5 MP rear with flash, 2 MP front"],
      ["Battery", "2120 mAh, USB-C"],
      ["SIM", "Single Nano SIM"],
      ["Connectivity", "4G LTE, Wi-Fi, Bluetooth 5.0, GPS, infrared"],
    ],
    faqs: androidFaqs,
  },
  {
    sourceHandle: "xiaomi-qin-f22-no-camera-touch-screen-16gb-2gb-smart-phone",
    slug: "qin-f22-no-camera",
    name: "Qin F22 No-Camera",
    tagline: "Android Keypad • No Camera • 2/16 GB • QC Tested",
    formFactor: "Android Keypad",
    description:
      "A compact Android Go keypad phone intentionally built without front or rear cameras, with a 2.8-inch touchscreen and 4G connectivity. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Android 11 Go Edition"],
      ["Form Factor", "Physical keypad + IPS touchscreen"],
      ["Display", "2.8-inch IPS, 480 × 640"],
      ["Processor", "MediaTek MT6739, quad-core 1.3 GHz"],
      ["Memory", "2 GB RAM, 16 GB storage"],
      ["Cameras", "No front or rear camera"],
      ["Battery", "1700 mAh, USB-C"],
      ["SIM", "Dual Nano SIM, dual standby"],
      ["Connectivity", "4G LTE, Wi-Fi, Bluetooth 4.1, GPS"],
    ],
    faqs: androidFaqs,
  },
  {
    sourceHandle: "xiomi-qin-f22-pro-4gb-64gb-touch-screen-phone",
    slug: "qin-f22-pro-google",
    name: "Qin F22 Pro Google Edition",
    tagline: "Android Keypad • Google Play • 4/64 GB • QC Tested",
    formFactor: "Android Keypad",
    description:
      "A compact Android keypad smartphone with a taller touch display, Helio G85 processor, cameras, and Google Play services. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Android 12 with Google services"],
      ["Form Factor", "Physical keypad + capacitive touchscreen"],
      ["Display", "3.54-inch touchscreen, 640 × 960"],
      ["Processor", "MediaTek Helio G85, octa-core"],
      ["Memory", "4 GB RAM, 64 GB storage"],
      ["Cameras", "8 MP rear, 2 MP front"],
      ["Battery", "2150 mAh, USB-C"],
      ["SIM", "Single Nano SIM"],
      ["Connectivity", "4G LTE, Wi-Fi, Bluetooth, GPS"],
    ],
    faqs: androidFaqs,
  },
  {
    sourceHandle: "xiaomi-qin-f25-touchscreen-dual-sim-smart-phone",
    slug: "qin-f25-touchscreen",
    name: "Qin F25 Touchscreen 6/128 GB",
    tagline: "Compact Android 14 • Dual SIM • 6/128 GB • QC Tested",
    formFactor: "Compact Android",
    description:
      "A compact touchscreen Android phone with dual SIM, substantial 6/128 GB memory, and a pocket-friendly narrow body. This is separate from the keypad-style Qin F25 Pro already in the store. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Android 14 Google Edition"],
      ["Form Factor", "Compact touchscreen smartphone"],
      ["Display", "3.54-inch, 640 × 960"],
      ["Processor", "MediaTek MTK8786"],
      ["Memory", "6 GB RAM, 128 GB storage"],
      ["Battery", "2700 mAh, USB-C"],
      ["SIM", "Dual SIM"],
      ["Connectivity", "4G LTE, dual-band Wi-Fi, Bluetooth, hotspot, infrared"],
      ["Size", "147.5 × 59.4 × 10.2 mm; 133 g"],
    ],
    faqs: androidFaqs,
  },
  {
    sourceHandle: "xiaomi-qin-k25-mini-smart-phone-google-edition",
    slug: "qin-k25",
    name: "Qin K25 Mini Google Edition",
    tagline: "Mini Android 14 • Google Play • 4/128 GB • QC Tested",
    formFactor: "Mini Android",
    description:
      "An ultra-compact Android mini smartphone with Google services, a 3.54-inch touchscreen, modern storage, and dual cameras. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Android 14 with Google services"],
      ["Form Factor", "Ultra-compact touchscreen smartphone"],
      ["Display", "3.54-inch LCD touchscreen"],
      ["Processor", "MediaTek Helio G81"],
      ["Memory", "4 GB RAM, 128 GB storage"],
      ["Cameras", "8 MP rear, 2 MP front"],
      ["Battery", "2150 mAh, USB-C"],
      ["SIM", "Single SIM; no memory-card slot"],
      ["Size", "97.6 × 59.5 × 11.7 mm; 94.3 g"],
    ],
    faqs: androidFaqs,
  },
  {
    sourceHandle: "xiaomi-qin-2-pro-original",
    slug: "qin-2-pro",
    name: "Qin 2 Pro",
    tagline: "Slim Mini Android • 2/64 GB • 5.05-inch • QC Tested",
    formFactor: "Mini Android",
    description:
      "A narrow minimalist Android smartphone with a tall 5.05-inch display, single rear camera, infrared remote, and one-hand-friendly dimensions. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Android 9 with Google Play"],
      ["Form Factor", "Narrow touchscreen smartphone"],
      ["Display", "5.05-inch, 576 × 1440"],
      ["Processor", "SC9832E quad-core 1.3 GHz"],
      ["Memory", "2 GB RAM, 64 GB storage"],
      ["Camera", "13 MP rear; no front camera"],
      ["Battery", "2100 mAh, USB-C"],
      ["SIM", "Single Nano SIM + virtual SIM support"],
      ["Connectivity", "4G LTE, Wi-Fi, Bluetooth 5.0, GPS, infrared"],
    ],
    faqs: androidFaqs,
  },
  {
    sourceHandle: "xiaomi-qin-3-mobile-phone",
    slug: "qin-3",
    name: "Qin 3",
    tagline: "Compact Android 12 • 4/64 GB • 5.5-inch • QC Tested",
    formFactor: "Compact Android",
    description:
      "A slim compact Android smartphone with a 5.5-inch HD+ display, 4/64 GB memory, dual cameras, and side fingerprint reader. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Android 12"],
      ["Form Factor", "Compact touchscreen smartphone"],
      ["Display", "5.5-inch IPS, 720 × 1496"],
      ["Processor", "MediaTek Helio P22, octa-core 2.0 GHz"],
      ["Memory", "4 GB RAM, 64 GB storage"],
      ["Cameras", "8 MP rear, 5 MP front"],
      ["Battery", "3100 mAh, USB-C"],
      ["SIM", "Single Nano SIM"],
      ["Connectivity", "4G LTE, Wi-Fi, Bluetooth 5.0, GPS"],
    ],
    faqs: androidFaqs,
  },
  {
    sourceHandle: "xiaomi-qin-3-ultra-android-smartphone-mi-original",
    slug: "qin-3-ultra",
    name: "Qin 3 Ultra",
    tagline: "Compact Android 12 • Helio G99 • 8/256 GB • QC Tested",
    formFactor: "Compact Android",
    description:
      "A higher-performance compact Android smartphone with Helio G99, 8/256 GB memory, a 5.02-inch display, and pocket-friendly proportions. " +
      condition,
    specs: [
      ["Condition", "New condition, unlocked, individually QC tested"],
      ["Operating System", "Android 12 with Google services"],
      ["Form Factor", "Compact touchscreen smartphone"],
      ["Display", "5.02-inch IPS, 720 × 1600, 60 Hz"],
      ["Processor", "MediaTek Helio G99, octa-core up to 2.2 GHz"],
      ["Memory", "8 GB RAM, 256 GB storage"],
      ["Cameras", "8 MP rear, 5 MP front"],
      ["Battery", "2500 mAh, USB-C fast charging"],
      ["Network", "4G LTE with VoLTE"],
      ["Connectivity", "Wi-Fi, Bluetooth 5.3, USB-C"],
    ],
    faqs: androidFaqs,
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
for (const product of catalog) {
  const response = await fetch(`https://www.astore.in/products/${product.sourceHandle}.js`);
  if (!response.ok) throw new Error(`Could not load Astore listing: ${product.sourceHandle}`);

  const source = await response.json();
  const availableVariants = source.variants.filter((variant) => variant.available);
  const variants = availableVariants.length ? availableVariants : source.variants;
  const pricePaise = Math.min(...variants.map((variant) => Number(variant.price)));
  const comparePrices = variants
    .map((variant) => Number(variant.compare_at_price || 0))
    .filter((price) => price > pricePaise);

  rows.push({
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    price_paise: pricePaise,
    cod_advance_paise: 0,
    compare_at_paise: comparePrices.length ? Math.max(...comparePrices) : null,
    stock: 1,
    is_active: true,
    category_id: phoneCategory.id,
    metadata: {
      badge: "NEW • QC TESTED",
      form_factor: product.formFactor,
      source_reference: `https://www.astore.in/products/${product.sourceHandle}`,
      images: source.images.slice(0, 5),
      specs: product.specs.map(([label, value]) => ({ label, value })),
      faqs: product.faqs,
    },
  });
}

const { data: savedProducts, error: productError } = await db
  .from("products")
  .upsert(rows, { onConflict: "slug" })
  .select("slug,name,price_paise");

if (productError) throw new Error(`Qin product upsert failed: ${productError.message}`);

console.log(`Saved ${savedProducts?.length || 0} Qin products using current Astore prices.`);
