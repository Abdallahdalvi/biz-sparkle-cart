export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export interface Coupon {
  code: string;
  amountPaise: number;
  email: string;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
  disabled: boolean;
  orderId: string | null;
  checkoutSignature: string | null;
  checkoutReady: boolean;
}

export function validateCoupon(
  coupon: Coupon,
  email: string,
  payMode: "prepaid" | "cod",
  now = Date.now(),
) {
  if (payMode !== "prepaid") throw new Error("Coupons can only be used for prepaid orders.");
  if (coupon.disabled) throw new Error("This coupon is no longer available.");
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= now && !coupon.orderId)
    throw new Error("This coupon has expired.");
  if (coupon.email && coupon.email !== email.trim().toLowerCase())
    throw new Error("This coupon is not available for this email address.");
  if (!Number.isSafeInteger(coupon.amountPaise) || coupon.amountPaise < 100)
    throw new Error("Invalid coupon amount.");
}

// An applied coupon replaces the prepaid promotion even when the coupon is smaller.
export function checkoutDiscount(
  payMode: "prepaid" | "cod",
  prepaidPaise: number,
  couponPaise?: number,
) {
  if (payMode === "cod") {
    if (couponPaise !== undefined) throw new Error("Coupons can only be used for prepaid orders.");
    return 0;
  }
  return couponPaise ?? prepaidPaise;
}

export function couponDiscountForMerchandise(couponPaise: number, merchandisePaise: number) {
  // Keep at least ₹1 payable online; gift wrapping is never discounted.
  return Math.min(couponPaise, Math.max(0, merchandisePaise - 100));
}
