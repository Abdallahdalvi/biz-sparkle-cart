type AdminOrderRecord = {
  id: string;
  order_number: string;
  status: string;
  notes: string | null;
  tracking_url: string | null;
  stock_decremented_at: string | null;
  stock_restored_at: string | null;
  cashfree_order_id: string | null;
  cashfree_payment_id: string | null;
  cashfree_refund_id: string | null;
  cashfree_refund_status: string | null;
  razorpay_payment_id: string | null;
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
};

async function loadAdminOrder(orderId: string): Promise<AdminOrderRecord> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, status, notes, tracking_url, stock_decremented_at, stock_restored_at, cashfree_order_id, cashfree_payment_id, cashfree_refund_id, cashfree_refund_status, razorpay_payment_id, shiprocket_order_id, shiprocket_shipment_id",
    )
    .eq("id", orderId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Order not found");
  return data as AdminOrderRecord;
}

function hasRealAwb(order: AdminOrderRecord) {
  if (!order.tracking_url) return false;
  const code = decodeURIComponent(order.tracking_url.split("/").filter(Boolean).pop() ?? "");
  return Boolean(code && !/^SRK-ES-/i.test(code));
}

async function restoreReservedStock(orderId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("restore_order_stock", { p_order_id: orderId });
  if (error) throw new Error(`Stock restoration failed: ${error.message}`);
  return Boolean(data);
}

export async function cancelAdminOrderInternal(orderId: string, reason: string) {
  const order = await loadAdminOrder(orderId);
  if (["shipped", "delivered"].includes(order.status)) {
    throw new Error("This order has already shipped. Use the returns workflow instead.");
  }
  if (order.status === "refunded") {
    return { orderId, status: "refunded", alreadyCancelled: true, stockRestored: false };
  }

  if (hasRealAwb(order) && order.status !== "cancelled") {
    const { cancelShiprocketShipmentInternal } = await import("@/lib/shiprocket.server");
    await cancelShiprocketShipmentInternal(orderId);
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "cancelled", cancellation_reason: reason })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
  const stockRestored = await restoreReservedStock(orderId);
  return {
    orderId,
    status: "cancelled",
    alreadyCancelled: order.status === "cancelled",
    stockRestored,
  };
}

export async function refundAdminOrderInternal(orderId: string, reason: string) {
  let order = await loadAdminOrder(orderId);
  if (["shipped", "delivered"].includes(order.status)) {
    throw new Error("This order has already shipped. Use the returns workflow before refunding.");
  }
  if (order.status === "refunded" || order.cashfree_refund_status === "SUCCESS") {
    return {
      orderId,
      status: "SUCCESS",
      amountPaise: 0,
      alreadyRefunded: true,
      message: "This Cashfree payment has already been refunded",
    };
  }
  if (order.cashfree_refund_status === "PENDING") {
    return {
      orderId,
      status: "PENDING",
      amountPaise: 0,
      alreadyRefunded: false,
      message: "Cashfree is already processing this refund",
    };
  }
  if (!order.cashfree_order_id || !order.cashfree_payment_id) {
    throw new Error("This order has no verified Cashfree payment to refund");
  }

  await cancelAdminOrderInternal(orderId, reason);
  order = await loadAdminOrder(orderId);
  const { createCashfreeRefundInternal, finalizeCashfreeRefundInternal } =
    await import("@/lib/cashfree.server");
  const refund = await createCashfreeRefundInternal({
    storeOrderId: order.id,
    cashfreeOrderId: order.cashfree_order_id!,
    cashfreePaymentId: order.cashfree_payment_id!,
    reason,
  });
  await finalizeCashfreeRefundInternal({
    cashfreePaymentId: order.cashfree_payment_id!,
    cashfreeRefundId: refund.id,
    refundStatus: refund.status,
    refundAmountPaise: refund.amountPaise,
  });
  return {
    orderId,
    status: refund.status,
    amountPaise: refund.amountPaise,
    alreadyRefunded: false,
    message: refund.description,
  };
}

export async function updateAdminOrderStatusInternal(orderId: string, status: string) {
  const order = await loadAdminOrder(orderId);
  if (["cancelled", "refunded"].includes(order.status)) {
    throw new Error(`A ${order.status} order cannot be moved back into fulfilment`);
  }
  const { isUnpaidPaymentAttempt } = await import("@/lib/order-admin-policy");
  if (isUnpaidPaymentAttempt(order) && status !== "pending") {
    throw new Error(
      "Payment has not been verified. This checkout attempt cannot enter fulfilment.",
    );
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);
  return { orderId, status };
}

const ARCHIVED_ORDERS_SETTINGS_ID = "archived_orders";

async function readArchivedOrderIds() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .select("metadata")
    .eq("id", ARCHIVED_ORDERS_SETTINGS_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const ids = data?.metadata && typeof data.metadata === "object" ? data.metadata.orderIds : [];
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

async function writeArchivedOrderIds(orderIds: string[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("store_settings").upsert({
    id: ARCHIVED_ORDERS_SETTINGS_ID,
    hero_1_image: "",
    hero_1_link: "",
    hero_1_label: "",
    hero_2_image: "",
    hero_2_link: "",
    hero_2_label: "",
    metadata: { orderIds: [...new Set(orderIds)] },
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function getArchivedAdminOrderIdsInternal() {
  return readArchivedOrderIds();
}

export async function setAdminOrderArchivedInternal(orderId: string, archived: boolean) {
  await loadAdminOrder(orderId);
  const current = await readArchivedOrderIds();
  const next = archived
    ? [...new Set([...current, orderId])]
    : current.filter((id) => id !== orderId);
  await writeArchivedOrderIds(next);
  return { orderId, archived };
}

export async function deleteAdminOrderInternal(orderId: string) {
  const order = await loadAdminOrder(orderId);
  const { canPermanentlyDeleteOrder } = await import("@/lib/order-admin-policy");
  if (!canPermanentlyDeleteOrder(order)) {
    throw new Error(
      "Only unpaid pending or cancelled orders without payment or Shiprocket records can be permanently deleted. Archive this order instead.",
    );
  }

  if (order.stock_decremented_at && !order.stock_restored_at) {
    await restoreReservedStock(orderId);
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("orders").delete().eq("id", orderId);
  if (error) throw new Error(error.message);
  await writeArchivedOrderIds((await readArchivedOrderIds()).filter((id) => id !== orderId));
  return { orderId, deleted: true };
}
