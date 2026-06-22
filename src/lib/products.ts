// Mock product catalog. Will be replaced by Cloud-backed catalog in Phase 2.

export type Category =
  | "phones"
  | "audio"
  | "accessories"
  | "wearables"
  | "gaming";

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  pricePaise: number;
  badge?: string;
  images: string[];
  description: string;
  specs: { label: string; value: string }[];
  variants?: { id: string; label: string }[];
  stock: number;
}

export const PRODUCTS: Product[] = [
  {
    slug: "qin-f22-pro",
    name: "Qin F22 Pro",
    tagline: "Tactile QWERTY • Android 12 • LTE",
    category: "phones",
    pricePaise: 1899900,
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
    stock: 14,
  },
  {
    slug: "cyberspeaker-g1",
    name: "CyberSpeaker G1",
    tagline: "Transparent Audio Engine",
    category: "audio",
    pricePaise: 1099900,
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
    stock: 48,
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
      "Portable retro gaming handheld with vertical 3.5\" IPS, runs everything up to PSP smoothly.",
    specs: [
      { label: "Display", value: '3.5" 640×480 IPS' },
      { label: "SoC", value: "RK3566 Quad-A55" },
      { label: "Battery", value: "5000 mAh" },
    ],
    stock: 21,
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
    description: "Credit-card-sized smartphone with stainless steel chassis. Pocket-friendly, durable, full Android.",
    specs: [
      { label: "Display", value: '3.0" AMOLED' },
      { label: "Chassis", value: "316L Stainless Steel" },
      { label: "OS", value: "Android 13" },
    ],
    stock: 18,
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
    description: "Rugged compact smartphone built for the field. MIL-STD-810H, IP68/69K, 8000 mAh battery.",
    specs: [
      { label: "Rating", value: "IP68/69K, MIL-STD-810H" },
      { label: "Battery", value: "8000 mAh" },
      { label: "Display", value: '5.5" Gorilla Glass 6' },
    ],
    stock: 12,
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
    stock: 9,
  },
];

export const getProductBySlug = (slug: string) =>
  PRODUCTS.find((p) => p.slug === slug);

export const productsByCategory = (cat: Category | "all") =>
  cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All Products" },
  { id: "phones", label: "Phones" },
  { id: "audio", label: "Audio" },
  { id: "accessories", label: "Accessories" },
  { id: "gaming", label: "Gaming" },
  { id: "wearables", label: "Wearables" },
];