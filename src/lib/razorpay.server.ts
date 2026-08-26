import { createHmac, timingSafeEqual } from "crypto";

const RAZORPAY_API = "https://api.razorpay.com/v1";

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  status: string;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured on the server");
  }
  return { keyId, keySecret };
}

async function razorpayRequest<T>(path: string): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    headers: { Authorization: `Basic ${authorization}` },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Razorpay verification failed (${response.status}): ${body}`);
  }
  return (await response.json()) as T;
}

export async function getCapturedRazorpayPaymentInternal(
  paymentId: string,
  expectedOrderId: string,
) {
  if (!paymentId || !expectedOrderId) {
    throw new Error("The Razorpay payment is not linked to an order");
  }
  const payment = await razorpayRequest<RazorpayPayment>(
    `/payments/${encodeURIComponent(paymentId)}`,
  );
  if (payment.order_id !== expectedOrderId) {
    throw new Error("The Razorpay payment belongs to a different order");
  }
  if (payment.status !== "captured") {
    throw new Error(`Payment is ${payment.status || "not captured"}; fulfilment has not started`);
  }
  return {
    id: payment.id,
    orderId: payment.order_id,
    amountPaise: Number(payment.amount) || 0,
  };
}

async function findCapturedPaymentForOrder(razorpayOrderId: string) {
  const response = await razorpayRequest<{ items?: RazorpayPayment[] }>(
    `/orders/${encodeURIComponent(razorpayOrderId)}/payments`,
  );
  const payment = response.items?.find((item) => item.status === "captured");
  if (!payment) throw new Error("Razorpay has not captured a payment for this order");
  return getCapturedRazorpayPaymentInternal(payment.id, razorpayOrderId);
}

export async function completeRazorpayPaymentInternal(razorpayOrderId: string, paymentId?: string) {
  const payment = paymentId
    ? await getCapturedRazorpayPaymentInternal(paymentId, razorpayOrderId)
    : await findCapturedPaymentForOrder(razorpayOrderId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: transitioned, error: transitionError } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", razorpay_payment_id: payment.id })
    .eq("razorpay_order_id", razorpayOrderId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (transitionError) throw new Error(transitionError.message);

  if (!transitioned) {
    const { data: existing, error } = await supabaseAdmin
      .from("orders")
      .select("id, status")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!existing) throw new Error("No store order matches this Razorpay order");
    if (["cancelled", "refunded"].includes(existing.status)) {
      throw new Error(`This order is already ${existing.status}`);
    }
    return { ok: true, alreadyProcessed: true, orderId: existing.id };
  }

  const { data: items, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select("qty, product_id, variant_id")
    .eq("order_id", transitioned.id);
  if (itemsError) throw new Error(itemsError.message);

  for (const item of items ?? []) {
    const { error } = await supabaseAdmin.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_variant_id: item.variant_id,
      p_qty: item.qty,
    });
    if (error) throw new Error(`Stock update failed: ${error.message}`);
  }

  try {
    const { createShiprocketOrderInternal } = await import("@/lib/shiprocket.server");
    await createShiprocketOrderInternal(transitioned.id);
  } catch (error) {
    console.error("[razorpay→shiprocket]", error);
  }

  return { ok: true, alreadyProcessed: false, orderId: transitioned.id };
}

export async function verifyRazorpayCheckoutPaymentInternal(input: {
  orderId: string;
  razorpayOrderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = getRazorpayCredentials();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, razorpay_order_id")
    .eq("id", input.orderId)
    .single();
  if (error || !order) throw new Error(error?.message ?? "Order not found");
  if (!order.razorpay_order_id || order.razorpay_order_id !== input.razorpayOrderId) {
    throw new Error("The checkout response does not match this store order");
  }

  const expected = createHmac("sha256", keySecret)
    .update(`${order.razorpay_order_id}|${input.paymentId}`)
    .digest("hex");
  const receivedBuffer = Buffer.from(input.signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid Razorpay payment signature");
  }

  return completeRazorpayPaymentInternal(order.razorpay_order_id, input.paymentId);
}
