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

const condition =
  "Open-box, like-new condition. Network unlocked and individually QC tested. Cosmetic condition and included accessories can vary by unit; the exact unit is confirmed before payment.";

const legacyBbFaqs = [
  {
    question: "Is this an Android phone?",
    answer:
      "No. This model runs the legacy BlackBerry 10 operating system. It should not be purchased for modern Android apps, and app or online-service availability is limited.",
  },
  {
    question: "Will calls, mobile data, and apps work in India?",
    answer:
      "Compatibility depends on the exact hardware variant and your operator. BlackBerry ended legacy BlackBerry 10 services, so modern network and online features are not guaranteed. Share your SIM operator and intended use before payment so we can check the available unit.",
  },
  {
    question: "What condition will I receive?",
    answer: condition,
  },
];

const products = [
  {
    slug: "blackberry-keyone",
    name: "BlackBerry KEYone",
    tagline: "QWERTY Android • Unlocked",
    description:
      "A compact Android smartphone with a touch-enabled physical keyboard and fingerprint-enabled spacebar. Android and security support are legacy, so current app compatibility should be confirmed before purchase. " +
      condition,
    price_paise: 2159000,
    cod_advance_paise: 0,
    compare_at_paise: 4999900,
    stock: 1,
    is_active: true,
    metadata: {
      form_factor: "QWERTY Android",
      images: ["/products/blackberry-keyone.jpg"],
      specs: [
        { label: "Condition", value: "Open box, unlocked, individually QC tested" },
        { label: "Operating System", value: "Android 7.1 (legacy; app support varies)" },
        { label: "Form Factor", value: "Touchscreen + physical QWERTY keyboard" },
        { label: "Display", value: "4.5-inch IPS, 1620 × 1080, 3:2" },
        { label: "Processor", value: "Qualcomm Snapdragon 625, octa-core 2.0 GHz" },
        { label: "Memory", value: "3 GB RAM, 32 GB storage, microSD up to 2 TB" },
        { label: "Cameras", value: "12 MP rear, 8 MP front" },
        { label: "Battery", value: "3505 mAh, USB-C, Quick Charge 3.0" },
        { label: "Keyboard", value: "Touch-enabled backlit keys; fingerprint spacebar" },
        { label: "Network", value: "4G LTE, Nano SIM; bands vary by hardware variant" },
      ],
      faqs: [
        {
          question: "Does the BlackBerry KEYone run Android?",
          answer:
            "Yes. It runs Android rather than BlackBerry 10, but its Android version and security support are legacy. Confirm any essential app with us before buying.",
        },
        {
          question: "Will my Indian SIM work?",
          answer:
            "The phone is supplied network unlocked, but band and VoLTE compatibility vary by hardware variant and operator. Share your SIM operator before payment so the exact unit can be checked.",
        },
        { question: "What condition will I receive?", answer: condition },
      ],
    },
  },
  {
    slug: "blackberry-q10",
    name: "BlackBerry Q10",
    tagline: "AMOLED QWERTY • Unlocked",
    description:
      "A classic BlackBerry 10 QWERTY phone with a square AMOLED touch display and removable battery. BlackBerry 10 is a discontinued legacy platform; modern apps, services, and network behavior are limited. " +
      condition,
    price_paise: 1199900,
    cod_advance_paise: 0,
    compare_at_paise: 3999900,
    stock: 1,
    is_active: true,
    metadata: {
      form_factor: "Legacy QWERTY",
      images: ["/products/blackberry-q10.jpg"],
      specs: [
        { label: "Condition", value: "Open box, unlocked, individually QC tested" },
        { label: "Operating System", value: "BlackBerry 10.3 (legacy / discontinued services)" },
        { label: "Form Factor", value: "Physical QWERTY + touchscreen" },
        { label: "Display", value: "3.1-inch Super AMOLED, 720 × 720" },
        { label: "Processor", value: "Qualcomm Snapdragon S4 Plus, dual-core 1.5 GHz" },
        { label: "Memory", value: "2 GB RAM, 16 GB storage, microSD support" },
        { label: "Cameras", value: "8 MP rear, 2 MP front" },
        { label: "Battery", value: "2100 mAh removable" },
        { label: "SIM", value: "Micro-SIM; exact variant confirmed before payment" },
        { label: "Network", value: "3G/4G capability varies by hardware variant and operator" },
      ],
      faqs: legacyBbFaqs,
    },
  },
  {
    slug: "blackberry-classic-q20",
    name: "BlackBerry Classic (Q20)",
    tagline: "QWERTY + Trackpad • Unlocked",
    description:
      "The familiar BlackBerry keyboard layout with optical trackpad, navigation keys, and a square touch display. BlackBerry 10 is a discontinued legacy platform; modern apps, services, and network behavior are limited. " +
      condition,
    price_paise: 1079000,
    cod_advance_paise: 0,
    compare_at_paise: 2999000,
    stock: 1,
    is_active: true,
    metadata: {
      form_factor: "Legacy QWERTY",
      images: ["/products/blackberry-classic-q20.jpg"],
      specs: [
        { label: "Condition", value: "Open box, unlocked, individually QC tested" },
        { label: "Operating System", value: "BlackBerry 10.3.1 (legacy / discontinued services)" },
        { label: "Form Factor", value: "Physical QWERTY, trackpad, navigation keys" },
        { label: "Display", value: "3.5-inch touchscreen, 720 × 720" },
        { label: "Processor", value: "Qualcomm Snapdragon S4 Plus, dual-core 1.5 GHz" },
        { label: "Memory", value: "2 GB RAM, 16 GB storage, microSD support" },
        { label: "Cameras", value: "8 MP rear, 2 MP front" },
        { label: "Battery", value: "2515 mAh" },
        { label: "SIM", value: "Nano-SIM; exact variant confirmed before payment" },
        { label: "Network", value: "3G/4G capability varies by hardware variant and operator" },
      ],
      faqs: legacyBbFaqs,
    },
  },
  {
    slug: "blackberry-passport-q30",
    name: "BlackBerry Passport (Q30)",
    tagline: "Wide QWERTY • Unlocked",
    description:
      "A wide-format BlackBerry 10 device with a touch-enabled QWERTY keyboard and square high-resolution display. BlackBerry 10 is a discontinued legacy platform; modern apps, services, and network behavior are limited. " +
      condition,
    price_paise: 1899000,
    cod_advance_paise: 0,
    compare_at_paise: 4899900,
    stock: 1,
    is_active: true,
    metadata: {
      form_factor: "Legacy QWERTY",
      images: ["/products/blackberry-passport-q30.png"],
      specs: [
        { label: "Condition", value: "Open box, unlocked, individually QC tested" },
        { label: "Operating System", value: "BlackBerry 10.3 (legacy / discontinued services)" },
        { label: "Form Factor", value: "Wide touchscreen + touch-enabled QWERTY" },
        { label: "Display", value: "4.5-inch IPS, 1440 × 1440" },
        { label: "Processor", value: "Qualcomm Snapdragon 801, quad-core 2.2 GHz" },
        { label: "Memory", value: "3 GB RAM, 32 GB storage, microSD support" },
        { label: "Cameras", value: "13 MP rear with OIS, 2 MP front" },
        { label: "Battery", value: "3450 mAh" },
        { label: "SIM", value: "Nano-SIM; exact variant confirmed before payment" },
        { label: "Network", value: "3G/4G capability varies by hardware variant and operator" },
      ],
      faqs: legacyBbFaqs,
    },
  },
  {
    slug: "cat-s22-flip",
    name: "CAT S22 Flip",
    tagline: "Rugged Android Flip • Unlocked",
    description:
      "A rugged Android flip phone with a physical keypad, touch display, removable battery, and IP68 protection. Exact carrier variant and Indian network compatibility are confirmed before payment. " +
      condition,
    price_paise: 2099000,
    cod_advance_paise: 0,
    compare_at_paise: 2500000,
    stock: 1,
    is_active: true,
    metadata: {
      form_factor: "Android Flip",
      images: ["/products/cat-s22-flip.jpg"],
      specs: [
        { label: "Condition", value: "Open box, unlocked, individually QC tested" },
        { label: "Operating System", value: "Android 11 Go Edition" },
        { label: "Form Factor", value: "Rugged flip phone, keypad + touchscreen" },
        { label: "Display", value: "2.8-inch VGA touchscreen + external display" },
        { label: "Processor", value: "Qualcomm QM215" },
        { label: "Memory", value: "2 GB RAM, 16 GB storage, microSD up to 128 GB" },
        { label: "Cameras", value: "5 MP rear, 2 MP front" },
        { label: "Battery", value: "2000 mAh removable" },
        { label: "Rugged Rating", value: "IP68, MIL-STD-810H, tested for 6-foot drops" },
        { label: "Network", value: "Nano-SIM, 4G LTE; bands vary by carrier variant" },
      ],
      faqs: [
        {
          question: "Does the CAT S22 Flip run Android apps?",
          answer:
            "It runs Android 11 Go Edition. App compatibility depends on each app's current Android requirements and the phone's compact display and memory.",
        },
        {
          question: "Will my Indian SIM work?",
          answer:
            "The supplied unit is network unlocked, but LTE bands and VoLTE support vary by original carrier variant and Indian operator. Share your SIM operator before payment so the exact unit can be checked.",
        },
        { question: "What condition will I receive?", answer: condition },
      ],
    },
  },
];

const youtubeVideos = [
  {
    platform: "YouTube",
    title: "iPhone SE 3 | ₹20,999",
    url: "https://www.youtube.com/shorts/bEH_UsI4lG0",
    image: "https://i.ytimg.com/vi/bEH_UsI4lG0/hqdefault.jpg",
    views: "Official channel",
    likes: "",
  },
  {
    platform: "YouTube",
    title: "Nokia 2720 Flip India | ₹3499",
    url: "https://www.youtube.com/shorts/PLUv0cCqEB8",
    image: "https://i.ytimg.com/vi/PLUv0cCqEB8/hqdefault.jpg",
    views: "Official channel",
    likes: "",
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

const rows = products.map((product) =>
  sanitizeProductRow({ ...product, category_id: phoneCategory.id }),
);
const { data: savedProducts, error: productError } = await db
  .from("products")
  .upsert(rows, { onConflict: "slug" })
  .select("slug,name");

if (productError) throw new Error(`Product upsert failed: ${productError.message}`);

const { data: settings, error: settingsReadError } = await db
  .from("store_settings")
  .select("metadata")
  .eq("id", "hero_banners")
  .single();

if (settingsReadError || !settings) {
  throw new Error(`Could not read storefront settings: ${settingsReadError?.message || "missing"}`);
}

const { error: settingsWriteError } = await db
  .from("store_settings")
  .update({ metadata: { ...(settings.metadata || {}), videos: youtubeVideos } })
  .eq("id", "hero_banners");

if (settingsWriteError) {
  throw new Error(`YouTube showcase update failed: ${settingsWriteError.message}`);
}

console.log(
  `Saved ${savedProducts?.length || 0} specialist products and refreshed YouTube videos.`,
);
