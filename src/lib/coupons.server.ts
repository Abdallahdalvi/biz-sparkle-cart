import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { normalizeCouponCode, validateCoupon, type Coupon } from "@/lib/coupons";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Settings rows are publicly readable. Store only ciphertext plus an opaque revision;
// never expose coupon codes, recipient details or redemption information in plaintext.
function key() {
  const secret =
    process.env.BUSINESS_TRACKER_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Coupon encryption is unavailable.");
  return createHash("sha256").update(`coupons-v1:${secret}`).digest();
}
function rowId(code: string) {
  return `coupon_v1_${createHmac("sha256", key()).update(normalizeCouponCode(code)).digest("hex")}`;
}
function encode(coupon: Coupon) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(coupon), "utf8"), cipher.final()]);
  return {
    revision: randomUUID(),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    body: body.toString("base64"),
  };
}
type Envelope = ReturnType<typeof encode>;
function decode(metadata: Envelope): Coupon {
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(metadata.iv, "base64"));
  decipher.setAuthTag(Buffer.from(metadata.tag, "base64"));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(metadata.body, "base64")),
      decipher.final(),
    ]).toString("utf8"),
  );
}
export type CouponRecord = { id: string; revision: string; coupon: Coupon };

export async function readCoupon(code: string): Promise<CouponRecord> {
  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select("id, metadata")
    .eq("id", rowId(code))
    .maybeSingle();
  if (error) throw new Error("Could not check this coupon. Please try again.");
  if (!data) throw new Error("Coupon not found. Check the code and try again.");
  return { id: data.id, revision: data.metadata.revision, coupon: decode(data.metadata) };
}
export async function saveNewCoupon(coupon: Coupon) {
  const { error } = await supabaseAdmin.from("store_settings").insert({
    id: rowId(coupon.code),
    hero_1_image: "",
    hero_1_link: "",
    hero_1_label: "",
    hero_2_image: "",
    hero_2_link: "",
    hero_2_label: "",
    metadata: encode(coupon),
  });
  if (error?.code === "23505")
    throw new Error("That coupon code already exists. Choose a different code.");
  if (error) throw new Error("Could not save coupon.");
}
export async function changeCoupon(record: CouponRecord, coupon: Coupon) {
  // A single conditional UPDATE serializes all competing checkout/admin requests.
  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .update({ metadata: encode(coupon), updated_at: new Date().toISOString() })
    .eq("id", record.id)
    .eq("metadata->>revision", record.revision)
    .select("id");
  if (error || data?.length !== 1)
    throw new Error("This coupon changed or was claimed by another checkout. Please try again.");
}
export async function claimCoupon(
  record: CouponRecord,
  orderId: string,
  signature: string,
  email: string,
) {
  validateCoupon(record.coupon, email, "prepaid");
  if (record.coupon.orderId) throw new Error("This single-use coupon has already been claimed.");
  await changeCoupon(record, { ...record.coupon, orderId, checkoutSignature: signature });
}
export function checkoutSignature(input: unknown) {
  return createHmac("sha256", key()).update(JSON.stringify(input)).digest("hex");
}
export async function listCoupons() {
  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select("metadata")
    .like("id", "coupon_v1_%")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("Could not load coupons.");
  const coupons = data.map((row) => decode(row.metadata));
  const orderIds = coupons.flatMap((coupon) => (coupon.orderId ? [coupon.orderId] : []));
  const batches = [];
  for (let offset = 0; offset < orderIds.length; offset += 100)
    batches.push(orderIds.slice(offset, offset + 100));
  const results = await Promise.all(
    batches.map((ids) =>
      supabaseAdmin.from("orders").select("id, order_number, status").in("id", ids),
    ),
  );
  if (results.some((result) => result.error))
    throw new Error("Could not load coupon order status.");
  const orders = results.flatMap((result) => result.data || []);
  return coupons.map((coupon) => ({
    ...coupon,
    checkoutSignature: null,
    order: orders?.find((order) => order.id === coupon.orderId) || null,
  }));
}
