export function orderReceiptStorageKey(orderId: string) {
  return `aghanims-order-receipt:${orderId}`;
}

export function rememberOrderReceipt(orderId: string, receiptToken: string) {
  window.sessionStorage.setItem(orderReceiptStorageKey(orderId), receiptToken);
}
