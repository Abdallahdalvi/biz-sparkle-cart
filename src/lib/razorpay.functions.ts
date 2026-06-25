import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Create a Razorpay order for an existing electronic_shop.orders row.
 * Returns { rzpOrderId, keyId, amountPaise, currency } so the client can
 * launch Razorpay Checkout. RZP keys live in env: RAZORPAY_KEY_ID /
 * RAZORPAY_KEY_SECRET (test or live).
 */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.",
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total_paise, currency, email, status")
      .eq("id", data.orderId)
      .single();
    if (error || !order) throw new Error(error?.message ?? "Order not found");
    if (order.status !== "pending") throw new Error(`Order already ${order.status}`);

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: order.total_paise,
        currency: order.currency || "INR",
        receipt: order.order_number,
        notes: { internal_order_id: order.id },
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Razorpay order create failed: ${txt}`);
    }
    const rzp = (await res.json()) as { id: string };

    await supabaseAdmin.from("orders").update({ razorpay_order_id: rzp.id }).eq("id", order.id);

    return {
      rzpOrderId: rzp.id,
      keyId,
      amountPaise: order.total_paise,
      currency: order.currency || "INR",
      orderNumber: order.order_number,
      email: order.email,
    };
  });

/**
 * Verify a Razorpay Checkout success signature and mark the order as paid.
 * Called from the client immediately after Razorpay's handler fires —
 * server-side HMAC verification is the source of truth.
 */
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        orderId: z.string().uuid(),
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay not configured");

    const { createHmac } = await import("crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    if (expected !== data.razorpay_signature) {
      throw new Error("Invalid Razorpay signature");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: data.razorpay_payment_id,
      })
      .eq("id", data.orderId);
    if (error) throw new Error(error.message);

    // Shiprocket order creation and atomic stock decrement are handled by the Razorpay webhook to prevent race conditions.

    return { ok: true };
  });
