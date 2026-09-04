import { createHash } from "node:crypto";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function sendMetaPurchaseEvent(orderId: string, marketingConsent: boolean) {
  if (!marketingConsent) return { sent: false, reason: "consent_not_granted" as const };
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN?.trim();
  if (!accessToken) return { sent: false, reason: "not_configured" as const };

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: order, error: orderError }, { data: settings, error: settingsError }] =
      await Promise.all([
        supabaseAdmin
          .from("orders")
          .select("id, order_number, user_id, email, phone, total_paise")
          .eq("id", orderId)
          .single(),
        supabaseAdmin.from("store_settings").select("metadata").eq("id", "hero_banners").single(),
      ]);
    if (orderError || !order) throw new Error(orderError?.message || "Order not found");
    if (settingsError) throw new Error(settingsError.message);

    const pixelId =
      process.env.META_PIXEL_ID?.trim() ||
      String(settings?.metadata?.tracking_meta_pixel_id || "").trim();
    if (!/^\d{5,25}$/.test(pixelId))
      return { sent: false, reason: "pixel_not_configured" as const };

    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("product_id, qty, unit_price_paise")
      .eq("order_id", orderId);
    if (itemsError) throw new Error(itemsError.message);

    const productIds = [
      ...new Set((orderItems || []).map((item) => item.product_id).filter(Boolean)),
    ];
    const { data: products, error: productsError } = productIds.length
      ? await supabaseAdmin.from("products").select("id, slug").in("id", productIds)
      : { data: [], error: null };
    if (productsError) throw new Error(productsError.message);
    const slugById = new Map((products || []).map((product) => [product.id, product.slug]));
    const contents = (orderItems || []).map((item) => ({
      id: slugById.get(item.product_id) || item.product_id,
      quantity: Number(item.qty),
      item_price: Number(item.unit_price_paise) / 100,
    }));

    const userData: Record<string, string[]> = {
      em: [sha256(normalizeEmail(order.email))],
      ph: [sha256(normalizePhone(order.phone))],
      external_id: [sha256(String(order.user_id || order.id))],
    };
    const event = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `purchase_${order.order_number}`,
      event_source_url: "https://aghanimsphones.in/checkout",
      action_source: "website",
      user_data: userData,
      custom_data: {
        currency: "INR",
        value: Number(order.total_paise) / 100,
        content_type: "product",
        content_ids: contents.map((item) => item.id),
        contents,
        num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
      },
    };
    const graphVersion = process.env.META_GRAPH_API_VERSION?.trim() || "v23.0";
    const response = await fetch(`https://graph.facebook.com/${graphVersion}/${pixelId}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        data: [event],
        access_token: accessToken,
        ...(process.env.META_TEST_EVENT_CODE?.trim()
          ? { test_event_code: process.env.META_TEST_EVENT_CODE.trim() }
          : {}),
      }),
    });
    if (!response.ok) {
      throw new Error(`Meta Conversions API returned ${response.status}: ${await response.text()}`);
    }
    return { sent: true as const };
  } catch (error) {
    console.error("Meta Purchase event failed", error);
    return { sent: false, reason: "request_failed" as const };
  }
}
