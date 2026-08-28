const CASHFREE_API_VERSION = "2025-01-01";

export type CashfreeEnvironment = "sandbox" | "production";

type CashfreeOrder = {
  cf_order_id: string;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | string;
  payment_session_id: string;
};

type CashfreePayment = {
  cf_payment_id: string | number;
  order_id: string;
  payment_amount: number;
  payment_currency: string;
  payment_status: string;
};

function getCashfreeCredentials() {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
  if (!appId || !secretKey) {
    throw new Error("Cashfree is not configured on the server");
  }
  return { appId, secretKey };
}

export function getCashfreeEnvironment(): CashfreeEnvironment {
  const environment = (process.env.CASHFREE_ENVIRONMENT || "sandbox").trim().toLowerCase();
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("CASHFREE_ENVIRONMENT must be sandbox or production");
  }
  return environment;
}

function cashfreeApiBase() {
  return getCashfreeEnvironment() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

async function cashfreeRequest<T>(
  path: string,
  init: RequestInit = {},
  idempotencyKey?: string,
): Promise<T> {
  const { appId, secretKey } = getCashfreeCredentials();
  const response = await fetch(`${cashfreeApiBase()}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secretKey,
      ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cashfree request failed (${response.status}): ${body}`);
  }
  return (await response.json()) as T;
}

function normalizeReturnOrigin(origin: string | undefined) {
  const fallback = process.env.PUBLIC_SITE_URL || "https://aghanimsphones.in";
  const value = (origin || fallback).trim();
  const parsed = new URL(value);
  const isLocal =
    parsed.protocol === "http:" && ["127.0.0.1", "localhost"].includes(parsed.hostname);
  const isStore =
    parsed.protocol === "https:" &&
    ["aghanimsphones.in", "www.aghanimsphones.in", "techshop.dalvi.cloud"].includes(
      parsed.hostname,
    );
  if (!isLocal && !isStore) {
    throw new Error("Checkout return origin is not allowed");
  }
  return parsed.origin;
}

export async function createCashfreeOrderInternal(input: {
  storeOrderId: string;
  storeOrderNumber: string;
  amountPaise: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnOrigin?: string;
  note: string;
}) {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new Error("Cashfree payments must be at least ₹1");
  }
  const cashfreeOrderId = `agh_${input.storeOrderId.replace(/-/g, "")}`;
  const origin = normalizeReturnOrigin(input.returnOrigin);
  const order = await cashfreeRequest<CashfreeOrder>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify({
        order_id: cashfreeOrderId,
        order_amount: Number((input.amountPaise / 100).toFixed(2)),
        order_currency: "INR",
        customer_details: {
          customer_id: `customer_${input.storeOrderId.replace(/-/g, "")}`,
          customer_name: input.customerName,
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone.replace(/\D/g, "").slice(-10),
        },
        order_meta: {
          return_url: `${origin}/checkout?cashfree_order_id={order_id}&store_order_id=${encodeURIComponent(input.storeOrderId)}`,
          notify_url: `${origin}/api/public/webhooks/cashfree`,
        },
        order_note: input.note,
        order_tags: {
          store_order_number: input.storeOrderNumber,
          store_order_id: input.storeOrderId,
        },
      }),
    },
    input.storeOrderId,
  );
  if (!order.payment_session_id || order.order_id !== cashfreeOrderId) {
    throw new Error("Cashfree did not return a valid payment session");
  }
  return {
    cashfreeOrderId: order.order_id,
    paymentSessionId: order.payment_session_id,
    environment: getCashfreeEnvironment(),
  };
}

async function getCashfreeOrder(cashfreeOrderId: string) {
  return cashfreeRequest<CashfreeOrder>(`/orders/${encodeURIComponent(cashfreeOrderId)}`);
}

async function getCashfreePayments(cashfreeOrderId: string) {
  return cashfreeRequest<CashfreePayment[]>(
    `/orders/${encodeURIComponent(cashfreeOrderId)}/payments`,
  );
}

export async function getSuccessfulCashfreePaymentInternal(
  cashfreeOrderId: string,
  expectedPaymentId?: string,
) {
  if (!cashfreeOrderId) throw new Error("The Cashfree payment is not linked to an order");
  const order = await getCashfreeOrder(cashfreeOrderId);
  if (order.order_id !== cashfreeOrderId) {
    throw new Error("Cashfree returned a different order");
  }
  if (order.order_status !== "PAID") {
    throw new Error(`Payment is ${order.order_status || "not paid"}; fulfilment has not started`);
  }
  const payments = await getCashfreePayments(cashfreeOrderId);
  const payment = payments.find(
    (item) =>
      item.payment_status === "SUCCESS" &&
      (!expectedPaymentId || String(item.cf_payment_id) === expectedPaymentId),
  );
  if (!payment) throw new Error("Cashfree has not recorded a successful payment for this order");
  if (payment.order_id !== cashfreeOrderId || payment.payment_currency !== "INR") {
    throw new Error("Cashfree payment details do not match this order");
  }
  const amountPaise = Math.round(Number(payment.payment_amount) * 100);
  const orderAmountPaise = Math.round(Number(order.order_amount) * 100);
  if (amountPaise !== orderAmountPaise) {
    throw new Error("Cashfree payment amount does not match the order amount");
  }
  return {
    id: String(payment.cf_payment_id),
    orderId: payment.order_id,
    amountPaise,
  };
}

export async function completeCashfreePaymentInternal(cashfreeOrderId: string, paymentId?: string) {
  const payment = await getSuccessfulCashfreePaymentInternal(cashfreeOrderId, paymentId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: transitioned, error: transitionError } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", cashfree_payment_id: payment.id })
    .eq("cashfree_order_id", cashfreeOrderId)
    .eq("status", "pending")
    .select("id, order_number")
    .maybeSingle();
  if (transitionError) throw new Error(transitionError.message);

  if (!transitioned) {
    const { data: existing, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status")
      .eq("cashfree_order_id", cashfreeOrderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!existing) throw new Error("No store order matches this Cashfree order");
    if (["cancelled", "refunded"].includes(existing.status)) {
      throw new Error(`This order is already ${existing.status}`);
    }
    return {
      ok: true,
      alreadyProcessed: true,
      orderId: existing.id,
      orderNumber: existing.order_number,
    };
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
    console.error("[cashfree→shiprocket]", error);
  }

  return {
    ok: true,
    alreadyProcessed: false,
    orderId: transitioned.id,
    orderNumber: transitioned.order_number,
  };
}

export async function verifyCashfreeCheckoutPaymentInternal(input: {
  orderId: string;
  cashfreeOrderId: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, cashfree_order_id")
    .eq("id", input.orderId)
    .single();
  if (error || !order) throw new Error(error?.message ?? "Order not found");
  if (!order.cashfree_order_id || order.cashfree_order_id !== input.cashfreeOrderId) {
    throw new Error("The checkout response does not match this store order");
  }
  return completeCashfreePaymentInternal(input.cashfreeOrderId);
}
