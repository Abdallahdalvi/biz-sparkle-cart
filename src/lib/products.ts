import { supabase } from "@/integrations/supabase/client";

export type Category = "phones" | "audio" | "accessories" | "wearables" | "gaming";

export interface Product {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  pricePaise: number;
  codAdvancePaise: number;
  compareAtPaise?: number | null;
  badge?: string;
  images: string[];
  description: string;
  specs: { label: string; value: string }[];
  variants?: { id: string; label: string }[];
  faqs?: { question: string; answer: string }[];
  stock: number;
  heroSlot?: number;
  costPricePaise?: number;
  gstRate?: number;
  wholesaleGstRate?: number;
  packagingCostPaise?: number;
  formFactor?: string;
}

export interface StorefrontCms {
  hero_eyebrow_label: string;
  hero_title: string;
  hero_title_font_size: number;
  hero_subtitle: string;
  hero_1_image: string;
  hero_1_link: string;
  hero_1_label: string;
  hero_2_image: string;
  hero_2_link: string;
  hero_2_label: string;
  trending_title: string;
  trending_subtitle: string;
  keypad_title: string;
  keypad_desc: string;
  keypad_banner_1_image: string;
  keypad_banner_1_link: string;
  keypad_banner_2_image: string;
  keypad_banner_2_link: string;
  drivers_title: string;
  drivers_subtitle: string;
  faqs: { question: string; answer: string }[];
  catalog_title: string;
  catalog_subtitle: string;
  about_title: string;
  about_subtitle: string;
  about_story: string;
  about_mission: string;
  about_values: string;
  about_image: string;
  videos: {
    platform: string;
    title: string;
    url: string;
    image: string;
    views: string;
    likes: string;
  }[];
  pointers: { icon: string; title: string; description: string }[];
  reviews_heading: { store_name: string; rating: number; total_reviews: number };
  reviews: { author: string; time: string; stars: number; snippet: string; avatar: string }[];
  cod_charge_amount: number;
  cod_charge_type: "advance" | "additional" | "none";
  prepaid_discount_amount: number;
  prepaid_discount_type: "flat" | "percent" | "none";
  biz_name: string;
  biz_legal_name: string;
  biz_address: string;
  biz_state: string;
  biz_gstin: string;
  biz_email: string;
  biz_phone: string;
  biz_hours: string;
  biz_grievance_officer: string;
  business_profile_verified: boolean;
  whatsapp_channel_url: string;
  whatsapp_chat_phone: string;
  whatsapp_chat_message: string;
  legal_terms_text?: string;
  legal_privacy_text?: string;
  legal_shipping_text?: string;
  legal_returns_text?: string;
  legal_cancellation_text?: string;
  footer_tagline?: string;
  footer_copyright?: string;
  tracking_clarity_enabled: boolean;
  tracking_clarity_project_id: string;
  tracking_meta_enabled: boolean;
  tracking_meta_pixel_id: string;
  tracking_meta_domain_verification: string;
  tracking_google_analytics_enabled: boolean;
  tracking_google_analytics_id: string;
  tracking_google_ads_enabled: boolean;
  tracking_google_ads_id: string;
  tracking_google_ads_purchase_label: string;
}

export const LATEST_GOOGLE_TEXT_REVIEWS: StorefrontCms["reviews"] = [
  {
    author: "Basavaraj Patil",
    time: "September 2026",
    stars: 5,
    snippet: "Good service and product, trust worthy and this is not a scam.",
    avatar: "B",
  },
  {
    author: "Alankar Sawant",
    time: "September 2026",
    stars: 5,
    snippet:
      "Had a great experience with Aghanims phones and gadgets bought a phone which was delivered in 40 mins to my location. Hassle free delivery and genuine product was delivery.",
    avatar: "A",
  },
  {
    author: "Dippak ____",
    time: "September 2026",
    stars: 5,
    snippet:
      "Very Fast delivery.. I got my product Nokia 2720 mobile within 2.30 hrs.. Good Service.. Very polite and supporting Guy..!!\nNice experience.",
    avatar: "D",
  },
  {
    author: "MITESH RATHOD",
    time: "August 2026",
    stars: 5,
    snippet:
      "Jai hind\nJai chatrapati shivaji maharaj ki\nI just bought phone from him amazing phone which one is I am looking for my mom satisfied service genuine guys....",
    avatar: "M",
  },
  {
    author: "Sumit Jadhav",
    time: "August 2026",
    stars: 5,
    snippet: "Authentic seller\nI purchase Nokia",
    avatar: "S",
  },
  {
    author: "Karan Mundarkar",
    time: "August 2026",
    stars: 5,
    snippet: "Nice trustworthy product",
    avatar: "K",
  },
  {
    author: "Sahdevsinh Jadav",
    time: "August 2026",
    stars: 5,
    snippet: "Authentic and Trust Worthy!",
    avatar: "S",
  },
];

export const DEFAULT_STOREFRONT_CMS: StorefrontCms = {
  hero_eyebrow_label: "AGHANIMS PHONES AND GADGETS",
  hero_title: "Discover phones and gadgets you won't find everywhere.",
  hero_title_font_size: 52,
  hero_subtitle:
    "Engineering the return of tactile precision. Experience the Qin F22 Pro and Blackberry Android hybrids — where modern power meets the unboxing thrill of classic hardware.",
  hero_1_image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAN4IWZ0o1xacmmTaAaeV4gJ2JM37nCA4Vu9FMZfWJ6CWZ9FReqzNA1zUw6b0z8fcVQRPejT-QofOpAaJlfeyZecXQpvnPZozhZdiZEDOj_qYqjYW64yxxY868yjxmBThtOdw-4pzxzc42bvkJogioVcwVPkGQS6ry7BHc3bO3PdOrAO0BS-A9PtmtRSFRGsIExVtxY8Knwi18rphz2LtaWGl0UbhG2lpi0gT9sXZRW0-4tpyNY7rWZZMvKc--gTZ9bjlCWX_yVWtpO",
  hero_1_link: "/product/qin-f22-pro",
  hero_1_label: "QIN F22 PRO",
  hero_2_image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCm_n1zeaqwYJAsYDw_UO82ywo_kvjRIEVnrSe0IXmiCc0w0f4amIl5GPi1qwb0x_zgKFT2Di4PiqffML-GPcSWoClZySpGw7qQ5KichDioDJ3LGIIdRDCp23b_h_HuycTaBl8fCwkN65HACqY2RyAUbuVYXAMUet7R9QZmQP_Hm2XrrGU9PNnw72oQQSSb34P6kf49pocIY_D43rLRUqke2u3g9uKBoBgCxKU3v86La9sWNrLWM38CWCn2F1LBUJKie2Quec_FQzp_",
  hero_2_link: "/product/qin-f22-pro",
  hero_2_label: "KEYBOARD HYBRID",
  trending_title: "Trending Gadgets",
  trending_subtitle: "Viral tech, precision tested.",
  keypad_title: "Keypad Android Collection",
  keypad_desc:
    "Ditch the glass slab. Our curated collection of keypad-driven Android devices offers full app support with physical feedback that touchscreens can't match.",
  keypad_banner_1_image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAN4IWZ0o1xacmmTaAaeV4gJ2JM37nCA4Vu9FMZfWJ6CWZ9FReqzNA1zUw6b0z8fcVQRPejT-QofOpAaJlfeyZecXQpvnPZozhZdiZEDOj_qYqjYW64yxxY868yjxmBThtOdw-4pzxzc42bvkJogioVcwVPkGQS6ry7BHc3bO3PdOrAO0BS-A9PtmtRSFRGsIExVtxY8Knwi18rphz2LtaWGl0UbhG2lpi0gT9sXZRW0-4tpyNY7rWZZMvKc--gTZ9bjlCWX_yVWtpO",
  keypad_banner_1_link: "/product/qin-f22-pro",
  keypad_banner_2_image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCw2XqHRgBw8NruVEf7FnTUMqs9yBzkFd2HMvxe9bJzmmsQqZfzWZzZCeh6XFM-e2OSp7MT3JbFTQb3dRiVQUiPrgMrO05qDeS98NNBsoIdjbv95nMgjjaCKdA8VhH79arFkhtnhxwyAuyLbzEJuaJQ1ChL5iZVwH1Ayj_BWwq2dD-Sxpha6khqbjZZpMaz0xN9yXPcdxesl0JhkN5e95wS0Y3TegigLJED3-qIBU61rGkPmNVXpBdkUU0_e2zdWiQiUPa4YQXNk4JK",
  keypad_banner_2_link: "/product/e-ink-phone-ii",
  drivers_title: "Minimalist Daily Drivers",
  drivers_subtitle: "Focus by design. Tools, not toys.",
  catalog_title: "Precision Engineered Hardware.",
  catalog_subtitle:
    "Every device in our catalog is tested for tactile precision and longevity. No gimmicks.",
  about_title: "Our Mission & Philosophy",
  about_subtitle:
    "We believe in tools, not toys. Our mission is to restore tactile feedback and mindful technology to an era dominated by distracting glass slabs.",
  about_story:
    "Founded by a passionate group of hardware engineers and firmware specialists, Aghanims Phones and Gadgets began as an experimental workspace dedicated to sourcing, modifying, and importing niche Android devices with physical keyboards and e-ink displays. Over the years, we have grown into the premier boutique hardware catalog for enthusiasts seeking uncompromising quality, privacy-hardened firmware, and full Google Play ecosystem support.",
  about_mission:
    "To provide professionals, writers, and digital minimalists with reliable, distraction-free communication tools that feature tactile feedback, long battery life, and rugged durability.",
  about_values:
    "Tactile Precision • Fully Unlocked Hardware • Mindful Design • Long-Term Repairability",
  about_image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCYlzi36glE3LwaIrIUKvCB81Co1u8zlP7Pq7LO3oPJLRSFqpTGa1nUWLm9dCEINLt2VNocO7yRQ_ByI_1WYopWEw05SvG8dvUYDm5Y4pXySE7gHoQGeK8MT_yrf4E6TsSjby8gBrJ-txwxKe5wcaKXGmEgLKrL4UbqQYyVzpd0Ata_lNWAdLpd3cDIhhEQQC1yKXGPd_xQg5zAJ_V-9Wq4RvIzH4I_W0c1coIjI1ig0fAe3s8UoX8b1DoKHEa1I4ANujj19KrouGrQ",
  faqs: [
    {
      question: "Is it a Google Play Store edition phone?",
      answer:
        "Yes, it comes with the Google Play Store pre-installed by the company, allowing you to download and use any apps seamlessly. We only deal in the global version, not the Chinese variant.",
    },
    {
      question: "Does it support UPI and other net banking apps?",
      answer:
        "Yes, all standard UPI apps (Google Pay, PhonePe, Paytm) and net banking applications work flawlessly on our global Android firmware.",
    },
    {
      question: "Is the Duoqin F25 Pro / F22 Pro compatible with Indian SIM cards?",
      answer:
        "Absolutely. They support all major Indian 4G LTE bands including Jio, Airtel, Vi, and BSNL.",
    },
    {
      question: "Key differences between Duoqin F25 Pro and F22 Pro?",
      answer:
        "The F25 Pro features an upgraded processor, slightly larger display, and refined tactile button mechanism compared to the F22 Pro.",
    },
    {
      question: "How long does the battery last?",
      answer:
        "Due to the optimized screen sizes and power-efficient processors, most users get 1.5 to 2 days of solid usage on a single charge.",
    },
  ],
  videos: [
    {
      platform: "Instagram",
      title: "MINI ANDROID PHONE",
      url: "https://instagram.com",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCtul4bEHAymnFjP_YwUMJ9Gm51gxXNo2pPWDTDNJa8dv5a5xXnye8_j586jPHevYSBeFWgM6guJIqfFv7-wLliLiVnWeJoKGPWVdN2Bk4GuDTAZByF190znXchXIzDdm9fvipJaYzWEM2znWrt9QI3cNzOsIzeU8WdlZNhVpIMNj81X6Pro1pBkwG1VH_EY9OKpdz01eOQyyOEaRmBDepVn6K3slmZ1FXb3iEzrGw3biPL26Tp0Iqwe2cNS7SmLw2wUggVs2AB_HrE",
      views: "145K views",
      likes: "20,758 likes",
    },
    {
      platform: "YouTube",
      title: "TACTILE QWERTY REVIEW",
      url: "https://youtube.com",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAN4IWZ0o1xacmmTaAaeV4gJ2JM37nCA4Vu9FMZfWJ6CWZ9FReqzNA1zUw6b0z8fcVQRPejT-QofOpAaJlfeyZecXQpvnPZozhZdiZEDOj_qYqjYW64yxxY868yjxmBThtOdw-4pzxzc42bvkJogioVcwVPkGQS6ry7BHc3bO3PdOrAO0BS-A9PtmtRSFRGsIExVtxY8Knwi18rphz2LtaWGl0UbhG2lpi0gT9sXZRW0-4tpyNY7rWZZMvKc--gTZ9bjlCWX_yVWtpO",
      views: "89K views",
      likes: "12,430 likes",
    },
    {
      platform: "YouTube",
      title: "CYBERSPEAKER G1 BASS TEST",
      url: "https://youtube.com",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD6Q8Vlvrz7ols2_EjmmKMexa3lC2aSxCtKwQHbFBbGnkZKbgSEwgCTPXfZpz0VTSI_3K4nES2ljHFnGbTYRKpwOpchngDKPTV_waavEn_abVboS3xKHpg8r6_WkZ-I-OuY3qrKYqioa64U14nSw98EAdXvpuTXf8_edDXurE52Yfq5iHA0fWmbZxad1rkWVHb_IiVgl7dEVf4nKEFGmBD33rpi5aTHpBCVPHiPMaT8mYB8g-BTHgGxmd0cEig7zq16zrrmLO-aWSDj",
      views: "210K views",
      likes: "34,120 likes",
    },
  ],
  pointers: [
    {
      icon: "local_shipping",
      title: "COD SHIPPING",
      description: "PAN India COD with a model-specific online advance where shown.",
    },
    {
      icon: "currency_exchange",
      title: "48-HOUR DOA SUPPORT",
      description: "Damage or defect claims must be reported within 48 hours of delivery.",
    },
    {
      icon: "video_camera_front",
      title: "LIVE DEMO",
      description: "Live Demo Available via Video Call.",
    },
    {
      icon: "forum",
      title: "CONTACT US!",
      description: "Keep in touch via whatsapp and support system.",
    },
  ],
  reviews_heading: {
    store_name: "Aghanims Phones and Gadgets",
    rating: 5.0,
    total_reviews: 8,
  },
  reviews: LATEST_GOOGLE_TEXT_REVIEWS,
  cod_charge_amount: 99,
  cod_charge_type: "advance",
  prepaid_discount_amount: 200,
  prepaid_discount_type: "flat",
  biz_name: "Aghanims Phones and Gadgets",
  biz_legal_name: "",
  biz_address: "",
  biz_state: "Maharashtra",
  biz_gstin: "",
  biz_email: "",
  biz_phone: "",
  biz_hours: "Mon–Sat, 10:00 – 18:00 IST",
  biz_grievance_officer: "",
  business_profile_verified: false,
  whatsapp_channel_url: "",
  whatsapp_chat_phone: "",
  whatsapp_chat_message: "Hi Aghanims Support, I have an inquiry regarding your products.",
  legal_terms_text:
    'These Terms & Conditions ("Terms") govern your access to and use of the Aghanims Phones and Gadgets website operated by our company, and any purchase of products listed on the Site. By using the Site you agree to these Terms. All prices are in Indian Rupees (INR) and are inclusive of applicable GST. We accept the offer when we dispatch the product and email an order confirmation with tracking.',
  legal_privacy_text:
    "We respect your privacy. This Policy explains what we collect, how we use it, and your rights. We share data only with service providers needed to process and deliver your order, and we do not sell your data.",
  legal_shipping_text:
    "We currently ship across India via Shiprocket and its courier partners (Bluedart, Delhivery, DTDC, India Post, Xpressbees). Orders are processed within 1–2 business days from payment confirmation. Delivery takes 2–4 business days in Metro cities and 3–6 business days in other Tier-1 & Tier-2 cities. No manual shipping fee is added to the customer order; the selected Shiprocket courier rate is recorded internally as the fulfilment cost.",
  legal_returns_text:
    "No change-of-mind returns are accepted. Damage-on-arrival, wrong-item, missing-accessory, or functional-defect claims must be reported within 48 hours of delivery with clear photo/video proof and original packaging. After 48 hours, replacement, return, or refund requests are not accepted except where required by applicable law. Products damaged, misused, opened, repaired, modified, or made incomplete by the customer are not eligible for replacement or refund.",
  legal_cancellation_text:
    "Orders can be cancelled only before dispatch. Once handed to the courier, cancellation is not available. Refused, failed, or returned-to-origin deliveries are reviewed case-by-case and may have courier/payment costs deducted where legally permitted.",
  footer_tagline: "Aghanims Phones and Gadgets. PRECISION ENGINEERED LOGISTICS.",
  footer_copyright: "© 2026 Aghanims Phones and Gadgets. ALL RIGHTS RESERVED.",
  tracking_clarity_enabled: false,
  tracking_clarity_project_id: "",
  tracking_meta_enabled: false,
  tracking_meta_pixel_id: "",
  tracking_meta_domain_verification: "",
  tracking_google_analytics_enabled: false,
  tracking_google_analytics_id: "",
  tracking_google_ads_enabled: false,
  tracking_google_ads_id: "",
  tracking_google_ads_purchase_label: "",
};

// No dummy/seed products — all products are managed via Supabase admin panel.
export const PRODUCTS: Product[] = [];

export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(slug), product_variants(id, label, price_delta_paise, stock)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    const dbProducts: Product[] = data.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline || "",
      category: (row.categories?.slug || "phones") as Category,
      pricePaise: row.price_paise,
      codAdvancePaise: Number(row.cod_advance_paise) || 0,
      compareAtPaise: row.compare_at_paise,
      badge: row.metadata?.badge || undefined,
      images: row.metadata?.images?.length
        ? row.metadata.images
        : [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAN4IWZ0o1xacmmTaAaeV4gJ2JM37nCA4Vu9FMZfWJ6CWZ9FReqzNA1zUw6b0z8fcVQRPejT-QofOpAaJlfeyZecXQpvnPZozhZdiZEDOj_qYqjYW64yxxY868yjxmBThtOdw-4pzxzc42bvkJogioVcwVPkGQS6ry7BHc3bO3PdOrAO0BS-A9PtmtRSFRGsIExVtxY8Knwi18rphz2LtaWGl0UbhG2lpi0gT9sXZRW0-4tpyNY7rWZZMvKc--gTZ9bjlCWX_yVWtpO",
          ],
      description: row.description || "",
      specs: row.metadata?.specs || [],
      variants: row.product_variants?.length
        ? row.product_variants.map((variant: { id: string; label: string }) => ({
            id: variant.id,
            label: variant.label,
          }))
        : undefined,
      faqs: row.metadata?.faqs?.length ? row.metadata.faqs : DEFAULT_STOREFRONT_CMS.faqs,
      stock: row.stock,
      heroSlot: row.metadata?.hero_slot ? Number(row.metadata.hero_slot) : undefined,
      costPricePaise:
        row.metadata?.cost_price_paise !== undefined
          ? Number(row.metadata.cost_price_paise)
          : Math.round(row.price_paise * 0.7),
      gstRate: row.metadata?.gst_rate !== undefined ? Number(row.metadata.gst_rate) : 18,
      wholesaleGstRate:
        row.metadata?.wholesale_gst_rate !== undefined
          ? Number(row.metadata.wholesale_gst_rate)
          : 18,
      packagingCostPaise:
        row.metadata?.packaging_cost_paise !== undefined
          ? Number(row.metadata.packaging_cost_paise)
          : 5000,
      formFactor: row.metadata?.form_factor || row.metadata?.formFactor || undefined,
    }));

    return dbProducts;
  } catch (e) {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug);
}

const LEGACY_REVIEW_SUMMARY_REPLACEMENTS = new Map<string, string>([
  [
    "Bought a phone for his mother and praised the product, service, and the team's genuine support.",
    "Jai hind Jai chatrapati shivaji maharaj ki I just bought phone from him amazing phone which one is I am looking for my mom satisfied service genuine guys....",
  ],
  [
    "Purchased a Nokia phone and described Aghanims Phones and Gadgets as an authentic seller.",
    "Authentic seller I purchase Nokia",
  ],
  ["Found the product nice and trustworthy.", "Nice trustworthy product"],
  ["Called the business authentic and trustworthy.", "Authentic and Trust Worthy!"],
]);

function replaceLegacyReviewSummaries(
  reviews: StorefrontCms["reviews"] | undefined,
): StorefrontCms["reviews"] {
  const source = reviews?.length ? reviews : DEFAULT_STOREFRONT_CMS.reviews;

  return source.map((review) => ({
    ...review,
    snippet: LEGACY_REVIEW_SUMMARY_REPLACEMENTS.get(review.snippet) || review.snippet,
  }));
}

function isLegacyGoogleReviewSet(reviews: StorefrontCms["reviews"] | undefined) {
  if (!reviews?.length || reviews.length > 4) return !reviews?.length;
  const legacyAuthors = new Set([
    "MITESH RATHOD",
    "Sumit Jadhav",
    "Karan Mundarkar",
    "Sahdevsinh Jadav",
  ]);
  return reviews.every((review) => legacyAuthors.has(review.author));
}

export async function getStorefrontCms(): Promise<StorefrontCms> {
  let dbCms: Partial<StorefrontCms> = {};
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", "hero_banners")
      .single();
    if (!error && data) {
      const meta = data.metadata || {};
      dbCms = {
        hero_title: meta.hero_title || data.hero_title,
        hero_eyebrow_label: meta.hero_eyebrow_label,
        hero_title_font_size:
          meta.hero_title_font_size !== undefined ? Number(meta.hero_title_font_size) : undefined,
        hero_subtitle: meta.hero_subtitle || data.hero_subtitle,
        hero_1_image: data.hero_1_image,
        hero_1_link: data.hero_1_link,
        hero_1_label: data.hero_1_label,
        hero_2_image: data.hero_2_image,
        hero_2_link: data.hero_2_link,
        hero_2_label: data.hero_2_label,
        trending_title: meta.trending_title,
        trending_subtitle: meta.trending_subtitle,
        keypad_title: meta.keypad_title,
        keypad_desc: meta.keypad_desc,
        keypad_banner_1_image: meta.keypad_banner_1_image,
        keypad_banner_1_link: meta.keypad_banner_1_link,
        keypad_banner_2_image: meta.keypad_banner_2_image,
        keypad_banner_2_link: meta.keypad_banner_2_link,
        drivers_title: meta.drivers_title,
        drivers_subtitle: meta.drivers_subtitle,
        faqs: meta.faqs,
        catalog_title: meta.catalog_title,
        catalog_subtitle: meta.catalog_subtitle,
        about_title: meta.about_title,
        about_subtitle: meta.about_subtitle,
        about_story: meta.about_story,
        about_mission: meta.about_mission,
        about_values: meta.about_values,
        about_image: meta.about_image,
        videos: meta.videos,
        pointers: meta.pointers,
        reviews_heading: meta.reviews_heading,
        reviews: meta.reviews,
        cod_charge_amount:
          meta.cod_charge_amount !== undefined ? Number(meta.cod_charge_amount) : undefined,
        cod_charge_type: meta.cod_charge_type,
        prepaid_discount_amount:
          meta.prepaid_discount_amount !== undefined
            ? Number(meta.prepaid_discount_amount)
            : undefined,
        prepaid_discount_type: meta.prepaid_discount_type,
        biz_name: meta.biz_name,
        biz_legal_name: meta.biz_legal_name,
        biz_address: meta.biz_address,
        biz_state: meta.biz_state,
        biz_gstin: meta.biz_gstin,
        biz_email: meta.biz_email,
        biz_phone: meta.biz_phone,
        biz_hours: meta.biz_hours,
        biz_grievance_officer: meta.biz_grievance_officer,
        business_profile_verified: meta.business_profile_verified,
        whatsapp_channel_url: meta.whatsapp_channel_url,
        whatsapp_chat_phone: meta.whatsapp_chat_phone,
        whatsapp_chat_message: meta.whatsapp_chat_message,
        legal_terms_text: meta.legal_terms_text,
        legal_privacy_text: meta.legal_privacy_text,
        legal_shipping_text: meta.legal_shipping_text,
        legal_returns_text: meta.legal_returns_text,
        legal_cancellation_text: meta.legal_cancellation_text,
        footer_tagline: meta.footer_tagline,
        footer_copyright: meta.footer_copyright,
        tracking_clarity_enabled: meta.tracking_clarity_enabled,
        tracking_clarity_project_id: meta.tracking_clarity_project_id,
        tracking_meta_enabled: meta.tracking_meta_enabled,
        tracking_meta_pixel_id: meta.tracking_meta_pixel_id,
        tracking_meta_domain_verification: meta.tracking_meta_domain_verification,
        tracking_google_analytics_enabled: meta.tracking_google_analytics_enabled,
        tracking_google_analytics_id: meta.tracking_google_analytics_id,
        tracking_google_ads_enabled: meta.tracking_google_ads_enabled,
        tracking_google_ads_id: meta.tracking_google_ads_id,
        tracking_google_ads_purchase_label: meta.tracking_google_ads_purchase_label,
      };
    }
  } catch (e) {
    // Ignore error
  }

  return {
    hero_eyebrow_label: dbCms.hero_eyebrow_label || DEFAULT_STOREFRONT_CMS.hero_eyebrow_label,
    hero_title: dbCms.hero_title || DEFAULT_STOREFRONT_CMS.hero_title,
    hero_title_font_size:
      dbCms.hero_title_font_size !== undefined
        ? Math.min(76, Math.max(36, Number(dbCms.hero_title_font_size)))
        : DEFAULT_STOREFRONT_CMS.hero_title_font_size,
    hero_subtitle: dbCms.hero_subtitle || DEFAULT_STOREFRONT_CMS.hero_subtitle,
    hero_1_image: dbCms.hero_1_image || DEFAULT_STOREFRONT_CMS.hero_1_image,
    hero_1_link: dbCms.hero_1_link || DEFAULT_STOREFRONT_CMS.hero_1_link,
    hero_1_label: dbCms.hero_1_label || DEFAULT_STOREFRONT_CMS.hero_1_label,
    hero_2_image: dbCms.hero_2_image || DEFAULT_STOREFRONT_CMS.hero_2_image,
    hero_2_link: dbCms.hero_2_link || DEFAULT_STOREFRONT_CMS.hero_2_link,
    hero_2_label: dbCms.hero_2_label || DEFAULT_STOREFRONT_CMS.hero_2_label,
    trending_title: dbCms.trending_title || DEFAULT_STOREFRONT_CMS.trending_title,
    trending_subtitle: dbCms.trending_subtitle || DEFAULT_STOREFRONT_CMS.trending_subtitle,
    keypad_title: dbCms.keypad_title || DEFAULT_STOREFRONT_CMS.keypad_title,
    keypad_desc: dbCms.keypad_desc || DEFAULT_STOREFRONT_CMS.keypad_desc,
    keypad_banner_1_image:
      dbCms.keypad_banner_1_image || DEFAULT_STOREFRONT_CMS.keypad_banner_1_image,
    keypad_banner_1_link: dbCms.keypad_banner_1_link || DEFAULT_STOREFRONT_CMS.keypad_banner_1_link,
    keypad_banner_2_image:
      dbCms.keypad_banner_2_image || DEFAULT_STOREFRONT_CMS.keypad_banner_2_image,
    keypad_banner_2_link: dbCms.keypad_banner_2_link || DEFAULT_STOREFRONT_CMS.keypad_banner_2_link,
    drivers_title: dbCms.drivers_title || DEFAULT_STOREFRONT_CMS.drivers_title,
    drivers_subtitle: dbCms.drivers_subtitle || DEFAULT_STOREFRONT_CMS.drivers_subtitle,
    faqs: dbCms.faqs?.length ? dbCms.faqs : DEFAULT_STOREFRONT_CMS.faqs,
    catalog_title: dbCms.catalog_title || DEFAULT_STOREFRONT_CMS.catalog_title,
    catalog_subtitle: dbCms.catalog_subtitle || DEFAULT_STOREFRONT_CMS.catalog_subtitle,
    about_title: dbCms.about_title || DEFAULT_STOREFRONT_CMS.about_title,
    about_subtitle: dbCms.about_subtitle || DEFAULT_STOREFRONT_CMS.about_subtitle,
    about_story: dbCms.about_story || DEFAULT_STOREFRONT_CMS.about_story,
    about_mission: dbCms.about_mission || DEFAULT_STOREFRONT_CMS.about_mission,
    about_values: dbCms.about_values || DEFAULT_STOREFRONT_CMS.about_values,
    about_image: dbCms.about_image || DEFAULT_STOREFRONT_CMS.about_image,
    videos: dbCms.videos?.length ? dbCms.videos : DEFAULT_STOREFRONT_CMS.videos,
    pointers: dbCms.pointers?.length ? dbCms.pointers : DEFAULT_STOREFRONT_CMS.pointers,
    reviews_heading: isLegacyGoogleReviewSet(dbCms.reviews)
      ? DEFAULT_STOREFRONT_CMS.reviews_heading
      : dbCms.reviews_heading || DEFAULT_STOREFRONT_CMS.reviews_heading,
    reviews: isLegacyGoogleReviewSet(dbCms.reviews)
      ? DEFAULT_STOREFRONT_CMS.reviews
      : replaceLegacyReviewSummaries(dbCms.reviews),
    cod_charge_amount:
      dbCms.cod_charge_amount !== undefined
        ? dbCms.cod_charge_amount
        : DEFAULT_STOREFRONT_CMS.cod_charge_amount,
    cod_charge_type: dbCms.cod_charge_type || DEFAULT_STOREFRONT_CMS.cod_charge_type,
    prepaid_discount_amount:
      dbCms.prepaid_discount_amount !== undefined
        ? dbCms.prepaid_discount_amount
        : DEFAULT_STOREFRONT_CMS.prepaid_discount_amount,
    prepaid_discount_type:
      dbCms.prepaid_discount_type || DEFAULT_STOREFRONT_CMS.prepaid_discount_type,
    biz_name: dbCms.biz_name || DEFAULT_STOREFRONT_CMS.biz_name,
    biz_legal_name: dbCms.biz_legal_name || DEFAULT_STOREFRONT_CMS.biz_legal_name,
    biz_address: dbCms.biz_address || DEFAULT_STOREFRONT_CMS.biz_address,
    biz_state: dbCms.biz_state || DEFAULT_STOREFRONT_CMS.biz_state,
    biz_gstin: dbCms.biz_gstin || DEFAULT_STOREFRONT_CMS.biz_gstin,
    biz_email: dbCms.biz_email || DEFAULT_STOREFRONT_CMS.biz_email,
    biz_phone: dbCms.biz_phone || DEFAULT_STOREFRONT_CMS.biz_phone,
    biz_hours: dbCms.biz_hours || DEFAULT_STOREFRONT_CMS.biz_hours,
    biz_grievance_officer:
      dbCms.biz_grievance_officer || DEFAULT_STOREFRONT_CMS.biz_grievance_officer,
    business_profile_verified: dbCms.business_profile_verified === true,
    whatsapp_channel_url: dbCms.whatsapp_channel_url || DEFAULT_STOREFRONT_CMS.whatsapp_channel_url,
    whatsapp_chat_phone: dbCms.whatsapp_chat_phone || DEFAULT_STOREFRONT_CMS.whatsapp_chat_phone,
    whatsapp_chat_message:
      dbCms.whatsapp_chat_message || DEFAULT_STOREFRONT_CMS.whatsapp_chat_message,
    legal_terms_text: dbCms.legal_terms_text || DEFAULT_STOREFRONT_CMS.legal_terms_text,
    legal_privacy_text: dbCms.legal_privacy_text || DEFAULT_STOREFRONT_CMS.legal_privacy_text,
    legal_shipping_text: dbCms.legal_shipping_text || DEFAULT_STOREFRONT_CMS.legal_shipping_text,
    legal_returns_text: dbCms.legal_returns_text || DEFAULT_STOREFRONT_CMS.legal_returns_text,
    legal_cancellation_text:
      dbCms.legal_cancellation_text || DEFAULT_STOREFRONT_CMS.legal_cancellation_text,
    footer_tagline: dbCms.footer_tagline || DEFAULT_STOREFRONT_CMS.footer_tagline,
    footer_copyright: dbCms.footer_copyright || DEFAULT_STOREFRONT_CMS.footer_copyright,
    tracking_clarity_enabled: dbCms.tracking_clarity_enabled === true,
    tracking_clarity_project_id:
      dbCms.tracking_clarity_project_id || DEFAULT_STOREFRONT_CMS.tracking_clarity_project_id,
    tracking_meta_enabled: dbCms.tracking_meta_enabled === true,
    tracking_meta_pixel_id:
      dbCms.tracking_meta_pixel_id || DEFAULT_STOREFRONT_CMS.tracking_meta_pixel_id,
    tracking_meta_domain_verification:
      dbCms.tracking_meta_domain_verification ||
      DEFAULT_STOREFRONT_CMS.tracking_meta_domain_verification,
    tracking_google_analytics_enabled: dbCms.tracking_google_analytics_enabled === true,
    tracking_google_analytics_id:
      dbCms.tracking_google_analytics_id || DEFAULT_STOREFRONT_CMS.tracking_google_analytics_id,
    tracking_google_ads_enabled: dbCms.tracking_google_ads_enabled === true,
    tracking_google_ads_id:
      dbCms.tracking_google_ads_id || DEFAULT_STOREFRONT_CMS.tracking_google_ads_id,
    tracking_google_ads_purchase_label:
      dbCms.tracking_google_ads_purchase_label ||
      DEFAULT_STOREFRONT_CMS.tracking_google_ads_purchase_label,
  };
}

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "phones", label: "Phones" },
  { id: "audio", label: "Audio" },
  { id: "accessories", label: "Accessories" },
  { id: "gaming", label: "Gaming" },
  { id: "wearables", label: "Wearables" },
];
