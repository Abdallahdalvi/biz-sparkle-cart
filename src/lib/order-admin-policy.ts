export interface OrderAdminPolicyRecord {
  status: string;
  cashfree_payment_id?: string | null;
  razorpay_payment_id?: string | null;
  shiprocket_order_id?: string | null;
  shiprocket_shipment_id?: string | null;
  tracking_url?: string | null;
  notes?: string | null;
  advance_paid_paise?: number;
  shipping_address?: Record<string, unknown> | null;
}

export function hasVerifiedOrderPayment(order: OrderAdminPolicyRecord) {
  const receipt = order.shipping_address?.cod_advance_receipt;
  const manualReceipt =
    receipt && typeof receipt === "object" && "amount_paise" in receipt && "recorded_by" in receipt;
  return Boolean(
    order.cashfree_payment_id ||
    order.razorpay_payment_id ||
    (order.notes === "cod" &&
      manualReceipt &&
      Number(order.advance_paid_paise) > 0 &&
      Number(receipt.amount_paise) === Number(order.advance_paid_paise) &&
      receipt.recorded_by),
  );
}

export function isUnpaidPaymentAttempt(order: OrderAdminPolicyRecord) {
  return order.status === "pending" && !hasVerifiedOrderPayment(order);
}

export function canPermanentlyDeleteOrder(order: OrderAdminPolicyRecord) {
  const hasFulfilmentRecord = Boolean(
    order.shiprocket_order_id || order.shiprocket_shipment_id || order.tracking_url,
  );
  return (
    ["pending", "cancelled"].includes(order.status) &&
    !hasVerifiedOrderPayment(order) &&
    !hasFulfilmentRecord
  );
}
