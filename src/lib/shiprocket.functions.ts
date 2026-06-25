import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SHIPROCKET_API = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getShiprocketToken(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Shiprocket not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env.",
    );
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const res = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Shiprocket auth failed: ${await res.text()}`);
  const j = (await res.json()) as { token: string };
  cachedToken = { token: j.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return j.token;
}

/**
 * Create a Shiprocket "adhoc" order for a paid electronic_shop order.
 * Pickup location must already exist in your Shiprocket account
 * (defaults to "Primary"). Stores the returned IDs on the order row.
 */
export const createShiprocketOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, email, phone, shipping_address, subtotal_paise, total_paise, shiprocket_order_id, status, created_at, notes",
      )
      .eq("id", data.orderId)
      .single();
    if (error || !order) throw new Error(error?.message ?? "Order not found");
    if (order.shiprocket_order_id) {
      return { ok: true, alreadyExists: true, id: order.shiprocket_order_id };
    }

    const { data: items, error: itErr } = await supabaseAdmin
      .from("order_items")
      .select("name, qty, unit_price_paise, variant_label")
      .eq("order_id", order.id);
    if (itErr) throw new Error(itErr.message);

    const addr = order.shipping_address as Record<string, string>;
    const token = await getShiprocketToken();
    const isCod = order.notes === "cod";

    const payload = {
      order_id: order.order_number,
      order_date: new Date(order.created_at).toISOString().slice(0, 10),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      billing_customer_name: addr.first_name || "Customer",
      billing_last_name: addr.last_name || "",
      billing_address: addr.line1,
      billing_address_2: addr.line2 || "",
      billing_city: addr.city,
      billing_pincode: addr.pincode,
      billing_state: addr.state,
      billing_country: addr.country || "India",
      billing_email: order.email,
      billing_phone: order.phone,
      shipping_is_billing: true,
      order_items: (items || []).map((i) => ({
        name: i.name + (i.variant_label ? ` (${i.variant_label})` : ""),
        sku: i.name.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
        units: i.qty,
        selling_price: (i.unit_price_paise / 100).toFixed(2),
      })),
      payment_method: isCod ? "COD" : "Prepaid",
      sub_total: (order.subtotal_paise / 100).toFixed(2),
      length: 20,
      breadth: 15,
      height: 10,
      weight: 0.5,
    };

    const res = await fetch(`${SHIPROCKET_API}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const j = (await res.json()) as {
      order_id?: number;
      shipment_id?: number;
      status?: string;
      message?: string;
    };
    if (!res.ok || !j.order_id) {
      throw new Error(`Shiprocket create failed: ${j.message ?? JSON.stringify(j)}`);
    }

    await supabaseAdmin
      .from("orders")
      .update({
        shiprocket_order_id: String(j.order_id),
        shiprocket_shipment_id: j.shipment_id ? String(j.shipment_id) : null,
        status: "processing",
      })
      .eq("id", order.id);

    return { ok: true, id: j.order_id, shipmentId: j.shipment_id };
  });

/**
 * Fetch live tracking info for an order's shipment.
 */
export const trackShipment = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("shiprocket_shipment_id, tracking_url")
      .eq("id", data.orderId)
      .single();
    if (!order?.shiprocket_shipment_id) {
      return { tracking: null, message: "Shipment not created yet" };
    }
    const token = await getShiprocketToken();
    const res = await fetch(
      `${SHIPROCKET_API}/courier/track/shipment/${order.shiprocket_shipment_id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const j = await res.json();
    return { tracking: j, trackingUrl: order.tracking_url };
  });

/**
 * Check courier serviceability + shipping rate for a PIN code.
 * Use from PDP / cart to surface "delivers to your PIN" badges.
 */
export const checkServiceability = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        pickupPincode: z.string().length(6),
        deliveryPincode: z.string().length(6),
        weightKg: z.number().positive().default(0.5),
        cod: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const token = await getShiprocketToken();
    const url = new URL(`${SHIPROCKET_API}/courier/serviceability/`);
    url.searchParams.set("pickup_postcode", data.pickupPincode);
    url.searchParams.set("delivery_postcode", data.deliveryPincode);
    url.searchParams.set("weight", String(data.weightKg));
    url.searchParams.set("cod", data.cod ? "1" : "0");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  });
