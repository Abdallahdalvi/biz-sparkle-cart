import { supabase } from "@/integrations/supabase/client";

export type Category = "phones" | "audio" | "accessories" | "wearables" | "gaming";

export interface Product {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  pricePaise: number;
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
  shippingCostPaise?: number;
  packagingCostPaise?: number;
  formFactor?: string;
}

export interface StorefrontCms {
  hero_title: string;
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
  reviews_api_key?: string;
  reviews_place_id?: string;
}

export const DEFAULT_STOREFRONT_CMS: StorefrontCms = {
  hero_title: "The Niche Tech Revolution",
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
    "Founded by a passionate group of hardware engineers and firmware specialists, TechLab began as an experimental workspace dedicated to sourcing, modifying, and importing niche Android devices with physical keyboards and e-ink displays. Over the years, we have grown into the premier boutique hardware catalog for enthusiasts seeking uncompromising quality, privacy-hardened firmware, and full Google Play ecosystem support.",
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
      description: "PAN India COD shipping (no advance payment).",
    },
    {
      icon: "currency_exchange",
      title: "RETURN & REPLACEMENT",
      description: "Hassle-Free Returns & Full Refunds Guaranteed.",
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
    store_name: "Dumbphones India",
    rating: 5.0,
    total_reviews: 84,
  },
  reviews: [
    {
      author: "Dheeraj",
      time: "2 months ago",
      stars: 5,
      snippet:
        "I recently purchased the Duoqin F22 Pro from Dumbphones, and I must say, I'm really impressed with the build and support.",
      avatar: "D",
    },
    {
      author: "SND Gaming",
      time: "2 months ago",
      stars: 5,
      snippet:
        "I Personally Visited The Office And I Truly Like Their Models So I Decided To Purchase Jelly Star And They Give The best service.",
      avatar: "S",
    },
    {
      author: "Khadar Basha",
      time: "2 months ago",
      stars: 5,
      snippet:
        "Recently I bought a mobile from here. Very trusted website and people. They personally interact with you to guide on setup.",
      avatar: "K",
    },
  ],
  cod_charge_amount: 99,
  cod_charge_type: "advance",
  prepaid_discount_amount: 200,
  prepaid_discount_type: "flat",
  biz_name: "TECHLAB Hardware Co.",
  biz_legal_name: "TECHLAB Technologies LLP",
  biz_address: "Bandra Kurla Complex, Bandra East, Mumbai, 400051",
  biz_state: "Maharashtra",
  biz_gstin: "27AADCS1456Q1ZV",
  biz_email: "support@techlab.example",
  biz_phone: "+91 98765 43210",
  biz_hours: "Mon–Sat, 10:00 – 18:00 IST",
  biz_grievance_officer: "Vikram Malhotra",
  whatsapp_channel_url: "https://whatsapp.com/channel/0029Vaexample",
  whatsapp_chat_phone: "919876543210",
  whatsapp_chat_message: "Hi TECHLAB Support, I have an inquiry regarding your products.",
  legal_terms_text: "These Terms & Conditions (\"Terms\") govern your access to and use of the TECHLAB website operated by our company, and any purchase of products listed on the Site. By using the Site you agree to these Terms. All prices are in Indian Rupees (INR) and are inclusive of applicable GST. We accept the offer when we dispatch the product and email an order confirmation with tracking.",
  legal_privacy_text: "We respect your privacy. This Policy explains what we collect, how we use it, and your rights under the Digital Personal Data Protection Act, 2023 (DPDP Act). We share data only with processors needed to deliver your order: Razorpay (payments), Shiprocket and the assigned courier (delivery). We do not sell your data.",
  legal_shipping_text: "We currently ship across India via Shiprocket and its courier partners (Bluedart, Delhivery, DTDC, India Post, Xpressbees). Orders are processed within 1–2 business days from payment confirmation. Delivery takes 2–4 business days in Metro cities and 3–6 business days in other Tier-1 & Tier-2 cities. Shipping is free on all prepaid orders within India.",
  legal_returns_text: "We accept returns within 7 days of delivery for items that are unused, in original condition, and with all original packaging. Approved refunds credit to the original payment method within 5–7 business days of receipt. For damaged-on-arrival (DOA) products, we offer a free replacement if reported within 48 hours of delivery.",
  legal_cancellation_text: "You can cancel any time before your order is marked 'Shipped' — usually within 24 hours. A full refund is issued to your original payment method within 5–7 business days. Once handed to the courier we cannot cancel. You may refuse delivery and we'll process it as a return.",
  footer_tagline: "TECHLAB. PRECISION ENGINEERED LOGISTICS.",
  footer_copyright: "© 2026 TECHLAB. ALL RIGHTS RESERVED.",
  reviews_api_key: "",
  reviews_place_id: "ChIJwe754bS55zsRwb3Q4U1xd7g",
};

export const PRODUCTS: Product[] = [
  {
    slug: "qin-f22-pro",
    name: "Qin F22 Pro",
    tagline: "Tactile QWERTY • Android 12 • LTE",
    category: "phones",
    pricePaise: 1899900,
    compareAtPaise: 2199900,
    badge: "Flagship",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAN4IWZ0o1xacmmTaAaeV4gJ2JM37nCA4Vu9FMZfWJ6CWZ9FReqzNA1zUw6b0z8fcVQRPejT-QofOpAaJlfeyZecXQpvnPZozhZdiZEDOj_qYqjYW64yxxY868yjxmBThtOdw-4pzxzc42bvkJogioVcwVPkGQS6ry7BHc3bO3PdOrAO0BS-A9PtmtRSFRGsIExVtxY8Knwi18rphz2LtaWGl0UbhG2lpi0gT9sXZRW0-4tpyNY7rWZZMvKc--gTZ9bjlCWX_yVWtpO",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCm_n1zeaqwYJAsYDw_UO82ywo_kvjRIEVnrSe0IXmiCc0w0f4amIl5GPi1qwb0x_zgKFT2Di4PiqffML-GPcSWoClZySpGw7qQ5KichDioDJ3LGIIdRDCp23b_h_HuycTaBl8fCwkN65HACqY2RyAUbuVYXAMUet7R9QZmQP_Hm2XrrGU9PNnw72oQQSSb34P6kf49pocIY_D43rLRUqke2u3g9uKBoBgCxKU3v86La9sWNrLWM38CWCn2F1LBUJKie2Quec_FQzp_",
    ],
    description:
      "Engineered for users who refuse the glass-slab status quo. The Qin F22 Pro pairs a precision-machined chassis with a full QWERTY keypad, running stock Android with Google Play support. Every keypress is calibrated for sub-50ms tactile feedback.",
    specs: [
      { label: "Display", value: '3.54" 640×960 IPS' },
      { label: "Processor", value: "Unisoc T606 Octa-core" },
      { label: "Memory", value: "4 GB RAM • 64 GB Storage" },
      { label: "Battery", value: "3000 mAh • 18W Fast Charge" },
      { label: "Keyboard", value: "Full QWERTY with backlight" },
      { label: "OS", value: "Android 12 Stock" },
      { label: "Connectivity", value: "4G LTE • Wi-Fi 5 • BT 5.0" },
    ],
    variants: [
      { id: "black", label: "Obsidian Black" },
      { id: "silver", label: "Brushed Silver" },
    ],
    faqs: DEFAULT_STOREFRONT_CMS.faqs,
    stock: 14,
    formFactor: "QWERTY",
  },
  {
    slug: "cyberspeaker-g1",
    name: "CyberSpeaker G1",
    tagline: "Transparent Audio Engine",
    category: "audio",
    pricePaise: 1099900,
    compareAtPaise: 1299900,
    badge: "Viral",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6Q8Vlvrz7ols2_EjmmKMexa3lC2aSxCtKwQHbFBbGnkZKbgSEwgCTPXfZpz0VTSI_3K4nES2ljHFnGbTYRKpwOpchngDKPTV_waavEn_abVboS3xKHpg8r6_WkZ-I-OuY3qrKYqioa64U14nSw98EAdXvpuTXf8_edDXurE52Yfq5iHA0fWmbZxad1rkWVHb_IiVgl7dEVf4nKEFGmBD33rpi5aTHpBCVPHiPMaT8mYB8g-BTHgGxmd0cEig7zq16zrrmLO-aWSDj",
    ],
    description:
      "A futuristic transparent Bluetooth speaker with exposed driver array. 360° sound, 24-hour battery, IPX7 waterproof.",
    specs: [
      { label: "Drivers", value: "2× 40mm full-range" },
      { label: "Battery", value: "24 hours" },
      { label: "Bluetooth", value: "5.3 LDAC" },
      { label: "Rating", value: "IPX7" },
    ],
    faqs: [
      {
        question: "Is it truly waterproof?",
        answer:
          "Yes, it carries an IPX7 waterproof rating, making it fully submersible in water up to 1 meter for 30 minutes.",
      },
      {
        question: "Does it support stereo pairing?",
        answer:
          "Yes! You can wirelessly pair two CyberSpeaker G1 units together for true immersive stereo sound.",
      },
    ],
    stock: 48,
    formFactor: "Audio",
  },
  {
    slug: "macrodial-pro",
    name: "MacroDial Pro",
    tagline: "Machined Aluminum Hub",
    category: "accessories",
    pricePaise: 749900,
    badge: "Editor's Choice",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAFTuwzaYf-7qAoiRNua-u4tEIMbORIpsCKlnZ6S23tWJMpNeshQRf5WnEqM9phCRKbaL3eP9IJU2c57SkwgAa0Zh90XiLXD2Qmzw5tT6edEl4w9X_V3n-mCWPv_KQ1asKdyZs7mcl3jFN3srvk8U73DGxIGrEDx9-7b24UDPHgslvgSZrBG0FOsmsU8AcRQu57Ika3ZhskbPXt2VGLdQ8zsPEL5pYL7Lhk62rGFkBoGpoHyGgK41MvnrtQA-MUVEQpcevDEuwfeOEA",
    ],
    description:
      "Programmable macro pad with rotary dial and 9 hot-swap mechanical keys. CNC-machined aluminum housing.",
    specs: [
      { label: "Keys", value: "9 hot-swap MX" },
      { label: "Dial", value: "Knurled aluminum, infinite rotation" },
      { label: "Software", value: "VIA / QMK compatible" },
    ],
    stock: 32,
    formFactor: "Accessory",
  },
  {
    slug: "retrocore-v3",
    name: "RetroCore V3",
    tagline: "Vertical Emulation Engine",
    category: "gaming",
    pricePaise: 1699900,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAe7g2l5igPz6tSKfgCcnu7K_i34-J4JKLKx5rP0JacwJKBc-UqMMRWbg8Iti8mVFtNhF6e1cCsBNMXCow1qx_dfFZUfWyAvzSOFj5e3vB0SBhXEmX6XHKKdz0VaZ6e3wpm2lzilQ6O837faBXV8I0UVs5-q-x_iK05J2hfvB60mkLykyMV5PXSVRvYAjX_wTRoSrOjvLOU1U86_GPuLXC5vjAb4eEcC86OnyMjCqduZFiXfMuQW0sDWtBUTB4KRWSZL7Be35oTg3h-",
    ],
    description:
      'Portable retro gaming handheld with vertical 3.5" IPS, runs everything up to PSP smoothly.',
    specs: [
      { label: "Display", value: '3.5" 640×480 IPS' },
      { label: "SoC", value: "RK3566 Quad-A55" },
      { label: "Battery", value: "5000 mAh" },
    ],
    stock: 21,
    formFactor: "Gaming",
  },
  {
    slug: "e-ink-phone-ii",
    name: "E-Ink Phone II",
    tagline: "30-Day Battery",
    category: "phones",
    pricePaise: 2199900,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCw2XqHRgBw8NruVEf7FnTUMqs9yBzkFd2HMvxe9bJzmmsQqZfzWZzZCeh6XFM-e2OSp7MT3JbFTQb3dRiVQUiPrgMrO05qDeS98NNBsoIdjbv95nMgjjaCKdA8VhH79arFkhtnhxwyAuyLbzEJuaJQ1ChL5iZVwH1Ayj_BWwq2dD-Sxpha6khqbjZZpMaz0xN9yXPcdxesl0JhkN5e95wS0Y3TegigLJED3-qIBU61rGkPmNVXpBdkUU0_e2zdWiQiUPa4YQXNk4JK",
    ],
    description:
      "Distraction-free e-ink Android phone. Carrier-grade LTE, full Play Store, 30-day standby.",
    specs: [
      { label: "Display", value: '6.13" E-Ink Carta 1200' },
      { label: "Battery", value: "5000 mAh / 30-day standby" },
      { label: "Storage", value: "128 GB" },
    ],
    stock: 7,
    formFactor: "E-Ink",
  },
  {
    slug: "titan-micro",
    name: "Titan Micro",
    tagline: "Steel Chassis Mini-Phone",
    category: "phones",
    pricePaise: 1549900,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCtul4bEHAymnFjP_YwUMJ9Gm51gxXNo2pPWDTDNJa8dv5a5xXnye8_j586jPHevYSBeFWgM6guJIqfFv7-wLliLiVnWeJoKGPWVdN2Bk4GuDTAZByF190znXchXIzDdm9fvipJaYzWEM2znWrt9QI3cNzOsIzeU8WdlZNhVpIMNj81X6Pro1pBkwG1VH_EY9OKpdz01eOQyyOEaRmBDepVn6K3slmZ1FXb3iEzrGw3biPL26Tp0Iqwe2cNS7SmLw2wUggVs2AB_HrE",
    ],
    description:
      "Credit-card-sized smartphone with stainless steel chassis. Pocket-friendly, durable, full Android.",
    specs: [
      { label: "Display", value: '3.0" AMOLED' },
      { label: "Chassis", value: "316L Stainless Steel" },
      { label: "OS", value: "Android 13" },
    ],
    stock: 18,
    formFactor: "Mini",
  },
  {
    slug: "terra-4",
    name: "Terra 4",
    tagline: "IP68 Rugged",
    category: "phones",
    pricePaise: 2649900,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBuXhIJPpQV8cuH_TYSjf_UydmC0Nd_X3l7i-3zGLILvTO7XECP0U__2ugDtNXiEjbTtZdm-PjhkdJxHXdkrjKVCZpb9J9kiE3WV48mtSJNLjpaZvMieTaDaQTfpbKD5d5pwDNmvWFI8NrJ4kGSbp7WTi-T1JPhsln28msfVXoC7KLXYAn40ClIiJXCjzXt1pVywtiUBmOmkepWWifUm5k0hDSpAhnF5uMZO9O91IrIBmOm62wyHtBr27dCIvF0sdy6db9kNZNNcGeK",
    ],
    description:
      "Rugged compact smartphone built for the field. MIL-STD-810H, IP68/69K, 8000 mAh battery.",
    specs: [
      { label: "Rating", value: "IP68/69K, MIL-STD-810H" },
      { label: "Battery", value: "8000 mAh" },
      { label: "Display", value: '5.5" Gorilla Glass 6' },
    ],
    stock: 12,
    formFactor: "Rugged",
  },
  {
    slug: "modu-1-lab",
    name: "Modu-1 Lab",
    tagline: "User Repairable",
    category: "phones",
    pricePaise: 2849900,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCYlzi36glE3LwaIrIUKvCB81Co1u8zlP7Pq7LO3oPJLRSFqpTGa1nUWLm9dCEINLt2VNocO7yRQ_ByI_1WYopWEw05SvG8dvUYDm5Y4pXySE7gHoQGeK8MT_yrf4E6TsSjby8gBrJ-txwxKe5wcaKXGmEgLKrL4UbqQYyVzpd0Ata_lNWAdLpd3cDIhhEQQC1yKXGPd_xQg5zAJ_V-9Wq4RvIzH4I_W0c1coIjI1ig0fAe3s8UoX8b1DoKHEa1I4ANujj19KrouGrQ",
    ],
    description: "Modular smartphone. Swap battery, camera, and ports with a single screwdriver.",
    specs: [
      { label: "Modules", value: "Battery, Camera, USB, Audio" },
      { label: "Display", value: '6.3" OLED' },
      { label: "Warranty", value: "5-year support" },
    ],
    stock: 0,
    formFactor: "Modular",
  },
];

export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(slug)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return PRODUCTS.map((sp) => ({
        ...sp,
        id: `static-${sp.slug}`,
        costPricePaise: Math.round(sp.pricePaise * 0.7),
        gstRate: 18,
        wholesaleGstRate: 18,
        shippingCostPaise: 15000,
        packagingCostPaise: 5000,
      }));
    }

    const dbProducts: Product[] = data.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline || "",
      category: (row.categories?.slug || "phones") as Category,
      pricePaise: row.price_paise,
      compareAtPaise: row.compare_at_paise,
      badge: row.metadata?.badge || undefined,
      images: row.metadata?.images?.length
        ? row.metadata.images
        : [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAN4IWZ0o1xacmmTaAaeV4gJ2JM37nCA4Vu9FMZfWJ6CWZ9FReqzNA1zUw6b0z8fcVQRPejT-QofOpAaJlfeyZecXQpvnPZozhZdiZEDOj_qYqjYW64yxxY868yjxmBThtOdw-4pzxzc42bvkJogioVcwVPkGQS6ry7BHc3bO3PdOrAO0BS-A9PtmtRSFRGsIExVtxY8Knwi18rphz2LtaWGl0UbhG2lpi0gT9sXZRW0-4tpyNY7rWZZMvKc--gTZ9bjlCWX_yVWtpO",
          ],
      description: row.description || "",
      specs: row.metadata?.specs || [],
      variants: row.metadata?.variants?.length ? row.metadata.variants : undefined,
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
      shippingCostPaise:
        row.metadata?.shipping_cost_paise !== undefined
          ? Number(row.metadata.shipping_cost_paise)
          : 15000,
      packagingCostPaise:
        row.metadata?.packaging_cost_paise !== undefined
          ? Number(row.metadata.packaging_cost_paise)
          : 5000,
      formFactor: row.metadata?.form_factor || row.metadata?.formFactor || undefined,
    }));

    // Merge with static PRODUCTS for rich demonstration if needed
    const existingSlugs = new Set(dbProducts.map((p) => p.slug));
    for (const sp of PRODUCTS) {
      if (!existingSlugs.has(sp.slug)) {
        dbProducts.push({
          ...sp,
          id: `static-${sp.slug}`,
          costPricePaise: Math.round(sp.pricePaise * 0.7),
          gstRate: 18,
          wholesaleGstRate: 18,
          shippingCostPaise: 15000,
          packagingCostPaise: 5000,
        });
      }
    }

    return dbProducts;
  } catch (e) {
    return PRODUCTS.map((sp) => ({
      ...sp,
      id: `static-${sp.slug}`,
      costPricePaise: Math.round(sp.pricePaise * 0.7),
      gstRate: 18,
      wholesaleGstRate: 18,
      shippingCostPaise: 15000,
      packagingCostPaise: 5000,
    }));
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug);
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
        whatsapp_channel_url: meta.whatsapp_channel_url,
        whatsapp_chat_phone: meta.whatsapp_chat_phone,
        whatsapp_chat_message: meta.whatsapp_chat_message,
      };
    }
  } catch (e) {
    // Ignore error
  }

  if (typeof window !== "undefined") {
    try {
      const localStr = localStorage.getItem("storefront_cms_custom");
      if (localStr) {
        const localData = JSON.parse(localStr);
        dbCms = { ...dbCms, ...localData };
      }
    } catch (e) {
      // Ignore
    }
  }

  return {
    hero_title: dbCms.hero_title || DEFAULT_STOREFRONT_CMS.hero_title,
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
    reviews_heading: dbCms.reviews_heading || DEFAULT_STOREFRONT_CMS.reviews_heading,
    reviews: dbCms.reviews?.length ? dbCms.reviews : DEFAULT_STOREFRONT_CMS.reviews,
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
    biz_grievance_officer: dbCms.biz_grievance_officer || DEFAULT_STOREFRONT_CMS.biz_grievance_officer,
    whatsapp_channel_url: dbCms.whatsapp_channel_url || DEFAULT_STOREFRONT_CMS.whatsapp_channel_url,
    whatsapp_chat_phone: dbCms.whatsapp_chat_phone || DEFAULT_STOREFRONT_CMS.whatsapp_chat_phone,
    whatsapp_chat_message: dbCms.whatsapp_chat_message || DEFAULT_STOREFRONT_CMS.whatsapp_chat_message,
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
