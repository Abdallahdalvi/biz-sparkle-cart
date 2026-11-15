import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Preview: node --env-file=.env scripts/add-qin-pro-phones.mjs
// Apply: append --apply. Only these two new products are created.
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "electronic_shop" },
  auth: { persistSession: false, autoRefreshToken: false },
});
const directory = "outputs/qin-pro-additions";
const sources = JSON.parse(await readFile(`${directory}/clean-photo-sources.json`, "utf8"));
const devices = [
  {
    slug: "qin-f21-pro", name: "Qin F21 Pro", price: 14999, stock: 6,
    photos: ["f21-clean-2.jpg", "f21-clean-1.png", "f21-clean-3.png"],
    source: "https://www.astore.in/products/xiomi-qin-f21-pro-qwerty-keypad-basic-simple-android-smartphone",
    description: "Brand new Qin F21 Pro with 4 GB RAM and 64 GB storage. Its physical number keypad and 2.8-inch touchscreen offer two ways to navigate Android 11. Includes a MediaTek Helio A22 processor, cameras and USB-C charging.",
    specs: [["Operating System", "Android 11"], ["Display", "2.8-inch IPS touchscreen · 480 × 640"], ["Processor", "MediaTek Helio A22"], ["Battery", "2120 mAh · USB-C"], ["Cameras", "5 MP rear · 2 MP front"]],
  },
  {
    slug: "qin-f22-pro", name: "Qin F22 Pro", price: 18999, stock: 5,
    photos: ["f22-clean-1.jpg", "f22-clean-2.jpg", "f22-clean-3.jpg"],
    source: "https://www.astore.in/products/xiomi-qin-f22-pro-4gb-64gb-touch-screen-phone",
    description: "Brand new Qin F22 Pro with 4 GB RAM and 64 GB storage. A physical number keypad pairs with a 3.54-inch touchscreen, Android 12 and a MediaTek Helio G85 processor. Includes front and rear cameras and USB-C charging.",
    specs: [["Operating System", "Android 12"], ["Display", "3.54-inch touchscreen · 640 × 960"], ["Processor", "MediaTek Helio G85"], ["Battery", "2150 mAh · USB-C"], ["Cameras", "8 MP rear · 2 MP front"]],
  },
];
const { data: existing, error: existingError } = await db.from("products").select("id,slug,name")
  .or("slug.ilike.%f21-pro%,slug.ilike.%f22-pro%,name.ilike.%F21 Pro%,name.ilike.%F22 Pro%");
if (existingError) throw existingError;
if (existing.length) throw new Error("A Qin Pro listing already exists. Inspect it before changing or duplicating it.");
const { data: category, error: categoryError } = await db.from("categories").select("id").eq("slug", "phones").single();
if (categoryError) throw categoryError;
for (const device of devices) {
  device.gallery = await Promise.all(device.photos.map(async (file) => {
    const bytes = await readFile(`${directory}/${file}`);
    const hash = createHash("sha256").update(bytes).digest("hex");
    const extension = file.split(".").pop();
    return { file, bytes, hash, path: `qin-pro-gallery/${hash}.${extension}`, source: sources[file.replace(/\.(png|jpg)$/, "")] };
  }));
  if (new Set(device.gallery.map((photo) => photo.hash)).size !== 3) throw new Error("Each phone needs three distinct photos.");
}
console.log(JSON.stringify({ apply: process.argv.includes("--apply"), phones: devices.map((d) => ({ name:d.name, price:d.price, stock:d.stock, memory:"4 GB / 64 GB", photos:d.gallery.length, condition:"Brand New" })) }));
if (!process.argv.includes("--apply")) process.exit(0);
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/before.json`, JSON.stringify(existing, null, 2));
for (const device of devices) for (const photo of device.gallery) {
  const { error } = await db.storage.from("product-images").upload(photo.path, photo.bytes, {
    contentType: photo.file.endsWith("png") ? "image/png" : "image/jpeg", upsert:false, cacheControl:"31536000",
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}
const { data: saved, error: saveError } = await db.from("products").insert(devices.map((d) => ({
  slug:d.slug, name:d.name, tagline:"Brand New · 4 GB / 64 GB · Android Keypad",
  description:d.description, category_id:category.id, price_paise:d.price * 100,
  cod_advance_paise:0, stock:d.stock, is_active:true, compare_at_paise:null,
  metadata: {
    brand:"Qin", condition:"new", badge:"Brand New", form_factor:"Android Keypad",
    cod_advance_collection:"after_confirmation", source_reference:d.source,
    images:d.gallery.map((p) => db.storage.from("product-images").getPublicUrl(p.path).data.publicUrl),
    specs:[["Condition", "Brand New"], ["Memory", "4 GB RAM / 64 GB storage"], ["Form Factor", "Physical number keypad + touchscreen"], ...d.specs, ["Connectivity", "4G LTE · Wi-Fi · Bluetooth"]].map(([label,value]) => ({label,value})),
  },
}))).select("id,slug");
if (saveError) throw saveError;
const { error: variantError } = await db.from("product_variants").insert(saved.map((p) => ({
  product_id:p.id, label:"4 GB / 64 GB", stock:devices.find((d) => d.slug === p.slug).stock, price_delta_paise:0,
})));
if (variantError) throw variantError;
const { data: after, error: verifyError } = await db.from("products")
  .select("id,slug,name,price_paise,stock,is_active,cod_advance_paise,metadata,product_variants(label,stock)")
  .in("slug",devices.map((d) => d.slug));
if (verifyError) throw verifyError;
await writeFile(`${directory}/after.json`,JSON.stringify(after,null,2));
for (const d of devices) {
  const p=after.find((p) => p.slug===d.slug);
  if (!p || p.price_paise!==d.price*100 || !p.is_active || p.metadata.condition!=="new" ||
      p.metadata.images.length<3 || p.stock!==d.stock || p.cod_advance_paise!==0 ||
      p.metadata.cod_advance_collection!=="after_confirmation" || p.product_variants.length!==1 ||
      p.product_variants[0].stock!==d.stock) throw new Error(`Verification failed for ${d.slug}`);
  for (const image of p.metadata.images) {
    const response=await fetch(image,{method:"HEAD"});
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Gallery image unavailable");
  }
}
console.log(JSON.stringify({verified:true,phones:after.map((p) => ({slug:p.slug,price:p.price_paise/100,photos:p.metadata.images.length,active:p.is_active}))}));
