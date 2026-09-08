import { createHmac, timingSafeEqual } from "node:crypto";
import type { PublicTrackingResult } from "@/lib/shiprocket.server";

const RECEIPT_PREFIX = "agh_receipt_v1";

function receiptSecret() {
  const secret = process.env.ORDER_RECEIPT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Order confirmation security is not configured");
  return secret;
}

export function createOrderReceiptToken(orderId: string) {
  return createHmac("sha256", receiptSecret())
    .update(`${RECEIPT_PREFIX}:${orderId}`)
    .digest("base64url");
}

function hasValidReceiptToken(orderId: string, candidate?: string) {
  if (!candidate) return false;
  const expected = createOrderReceiptToken(orderId);
  const expectedBuffer = Buffer.from(expected);
  const candidateBuffer = Buffer.from(candidate);
  return (
    expectedBuffer.length === candidateBuffer.length &&
    timingSafeEqual(expectedBuffer, candidateBuffer)
  );
}

function trackingFallback(order: {
  id: string;
  order_number: string;
  status: string;
  notes: string | null;
  tracking_url: string | null;
  shiprocket_shipment_id: string | null;
}): PublicTrackingResult {
  return {
    orderId: order.id,
    orderNumber: order.order_number,
    awb: null,
    carrier: "Awaiting Shiprocket courier assignment",
    estimatedDelivery: "Available after courier assignment or the courier's first scan",
    statusText: order.status,
    paymentMode: order.notes === "cod" ? "CASH ON DELIVERY (COD)" : "PREPAID",
    trackingUrl: order.tracking_url,
    shipmentCreated: Boolean(order.shiprocket_shipment_id),
    milestones: [],
  };
}

export async function getOrderConfirmationInternal(input: {
  orderId: string;
  authToken?: string;
  receiptToken?: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, user_id, order_number, email, phone, shipping_address, status, subtotal_paise, shipping_paise, tax_paise, total_paise, cod_advance_paise, advance_paid_paise, cod_collectable_paise, created_at, tracking_url, shiprocket_shipment_id, notes, cashfree_payment_id, order_items(name, qty, unit_price_paise, variant_label, image_url)",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (error || !order) throw new Error("Order confirmation was not found");

  let authenticatedUserId: string | null = null;
  if (input.authToken) {
    const { data: authData } = await supabaseAdmin.auth.getUser(input.authToken);
    authenticatedUserId = authData.user?.id ?? null;
  }

  const ownsOrder = Boolean(
    authenticatedUserId && order.user_id && authenticatedUserId === order.user_id,
  );
  if (!ownsOrder && !hasValidReceiptToken(order.id, input.receiptToken)) {
    throw new Error("This private order confirmation is unavailable in this browser session");
  }

  let tracking = trackingFallback(order);
  try {
    const { getPublicTrackingInternal } = await import("@/lib/shiprocket.server");
    tracking = await getPublicTrackingInternal(order.id);
  } catch {
    // The receipt must remain available even if Shiprocket is temporarily unavailable.
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    email: order.email,
    phone: order.phone,
    shippingAddress: order.shipping_address,
    status: order.status,
    subtotalPaise: Number(order.subtotal_paise) || 0,
    shippingPaise: Number(order.shipping_paise) || 0,
    taxPaise: Number(order.tax_paise) || 0,
    totalPaise: Number(order.total_paise) || 0,
    codAdvancePaise: Number(order.cod_advance_paise) || 0,
    advancePaidPaise: Number(order.advance_paid_paise) || 0,
    codCollectablePaise: Number(order.cod_collectable_paise) || 0,
    createdAt: order.created_at,
    paymentMethod: order.notes === "cod" ? ("cod" as const) : ("prepaid" as const),
    onlinePaymentReceived: Boolean(order.cashfree_payment_id),
    items: (order.order_items || []).map((item) => ({
      name: item.name,
      qty: Number(item.qty) || 0,
      unitPricePaise: Number(item.unit_price_paise) || 0,
      variantLabel: item.variant_label,
      imageUrl: item.image_url,
    })),
    tracking,
  };
}
