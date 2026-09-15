export interface OrderAdminPolicyRecord {
  status: string;
  cashfree_payment_id?: string | null;
  razorpay_payment_id?: string | null;
  shiprocket_order_id?: string | null;
  shiprocket_shipment_id?: string | null;
  tracking_url?: string | null;
}

export function hasVerifiedOrderPayment(order: OrderAdminPolicyRecord) {
  return Boolean(order.cashfree_payment_id || order.razorpay_payment_id);
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
